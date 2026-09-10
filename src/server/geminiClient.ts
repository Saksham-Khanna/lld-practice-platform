import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import {
  MissingApiKeyError,
  EvaluationTimeoutError,
  RateLimitError,
  GeminiApiError,
} from '../core/evaluator/errors';

export interface GeminiClientOptions {
  apiKey?: string;
  model?: string;
  timeoutMs?: number;
}

export interface IGeminiClient {
  generateEvaluation(params: {
    systemInstruction: string;
    prompt: string;
    timeoutMs?: number;
  }): Promise<string>;
}

export class RealGeminiClient implements IGeminiClient {
  private readonly explicitApiKey?: string;
  private readonly configuredModel?: string;
  private readonly defaultTimeoutMs: number;
  private aiInstance: GoogleGenAI | null = null;
  private cachedKey: string = '';

  constructor(options?: GeminiClientOptions) {
    this.explicitApiKey = options?.apiKey;
    this.configuredModel = options?.model;
    const envTimeout = process.env.GEMINI_TIMEOUT_MS ? parseInt(process.env.GEMINI_TIMEOUT_MS, 10) : NaN;
    this.defaultTimeoutMs = options?.timeoutMs || (!isNaN(envTimeout) && envTimeout > 0 ? envTimeout : 60000);
  }

  private getApiKey(): string {
    if (this.explicitApiKey && this.explicitApiKey.trim().length > 0) {
      return this.explicitApiKey.trim();
    }

    if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 0) {
      return process.env.GEMINI_API_KEY.trim();
    }

    // Attempt to reload from .env in case it was added after process start
    try {
      dotenv.config();
    } catch {
      // ignore
    }

    return (process.env.GEMINI_API_KEY || '').trim();
  }

  private getModel(): string {
    return this.configuredModel || process.env.GEMINI_MODEL || 'gemini-3.6-flash';
  }

  private getAI(): GoogleGenAI {
    const key = this.getApiKey();
    if (!key) {
      throw new MissingApiKeyError();
    }
    if (!this.aiInstance || this.cachedKey !== key) {
      this.aiInstance = new GoogleGenAI({ apiKey: key });
      this.cachedKey = key;
    }
    return this.aiInstance;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async generateEvaluation(params: {
    systemInstruction: string;
    prompt: string;
    timeoutMs?: number;
  }): Promise<string> {
    const ai = this.getAI();
    const model = this.getModel();
    const timeoutMs = params.timeoutMs ?? this.defaultTimeoutMs;

    const maxRetries = 3;
    let lastError: any = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const apiPromise = ai.models.generateContent({
          model,
          contents: params.prompt,
          config: {
            systemInstruction: params.systemInstruction,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                overallScore: { type: Type.INTEGER },
                rubricScores: {
                  type: Type.OBJECT,
                  properties: {
                    requirementUnderstanding: { type: Type.INTEGER },
                    classResponsibilities: { type: Type.INTEGER },
                    encapsulationInterfaces: { type: Type.INTEGER },
                    relationshipsCoupling: { type: Type.INTEGER },
                    extensibilityTradeoffs: { type: Type.INTEGER },
                    edgeCasesTestability: { type: Type.INTEGER },
                    explanationQuality: { type: Type.INTEGER },
                  },
                  required: [
                    'requirementUnderstanding',
                    'classResponsibilities',
                    'encapsulationInterfaces',
                    'relationshipsCoupling',
                    'extensibilityTradeoffs',
                    'edgeCasesTestability',
                    'explanationQuality',
                  ],
                },
                strengths: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                feedback: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      criterion: { type: Type.STRING },
                      score: { type: Type.INTEGER },
                      evidence: { type: Type.STRING },
                      concern: { type: Type.STRING },
                      suggestion: { type: Type.STRING },
                      confidence: { type: Type.NUMBER },
                    },
                    required: ['criterion', 'score', 'evidence', 'concern', 'suggestion', 'confidence'],
                  },
                },
              },
              required: ['overallScore', 'rubricScores', 'strengths', 'feedback'],
            },
            abortSignal: controller.signal,
          },
        });

        const response = await apiPromise;
        const text = response.text;
        if (!text) {
          throw new GeminiApiError('Gemini API returned an empty response text.');
        }
        return text;
      } catch (err: any) {
        lastError = err;

        if (err.name === 'AbortError' || controller.signal.aborted) {
          throw new EvaluationTimeoutError(`Gemini evaluation timed out after ${timeoutMs}ms.`);
        }

        const errMsg = err?.message || String(err);
        const errStatus = err?.status || err?.statusCode || err?.code;

        // Check if error is transient (503 High Demand / UNAVAILABLE / 429 Rate Limit)
        const isTransient =
          errStatus === 503 ||
          errStatus === 429 ||
          /503|high\s*demand|unavailable|resource_exhausted|rate\s*limit/i.test(errMsg);

        if (isTransient && attempt < maxRetries) {
          // Wait with backoff: attempt 1 -> 1500ms, attempt 2 -> 3000ms
          const backoffDelay = attempt * 1500;
          await this.sleep(backoffDelay);
          continue; // Retry next attempt
        }

        // Clean user-friendly message formatting if retries exhausted
        if (errStatus === 503 || /503|high\s*demand|unavailable/i.test(errMsg)) {
          throw new GeminiApiError(
            'Google Gemini servers are temporarily experiencing high traffic demand. Spikes usually clear in seconds; please click "Retry Evaluation".',
            err
          );
        }

        if (errStatus === 429 || /rate\s*limit|quota|resource_exhausted/i.test(errMsg)) {
          throw new RateLimitError(
            'Gemini API request limit reached. Please wait a brief moment and retry.'
          );
        }

        if (err instanceof MissingApiKeyError || err instanceof EvaluationTimeoutError || err instanceof RateLimitError) {
          throw err;
        }

        // Clean JSON formatting if message is wrapped in raw JSON
        let cleanMsg = errMsg;
        try {
          const match = errMsg.match(/\{"error":\{.*\}\}/);
          if (match) {
            const parsed = JSON.parse(match[0]);
            cleanMsg = parsed?.error?.message || cleanMsg;
          }
        } catch {
          // ignore
        }

        throw new GeminiApiError(`Gemini API error: ${cleanMsg}`, err);
      } finally {
        clearTimeout(timeoutId);
      }
    }

    throw new GeminiApiError('Gemini evaluation could not complete after retries.', lastError);
  }
}
