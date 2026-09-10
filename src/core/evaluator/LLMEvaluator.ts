import { Evaluator, EvaluationContext, EvaluationResult } from './Evaluator';
import { LLD_EVALUATION_SYSTEM_PROMPT, buildEvaluationUserPrompt } from './prompt';
import { validateEvaluationResponse } from './validator';
import { MalformedEvaluationError } from './errors';
import { IGeminiClient, RealGeminiClient } from '../../server/geminiClient';

export interface LLMEvaluatorOptions {
  client?: IGeminiClient;
  model?: string;
  timeoutMs?: number;
}

export class LLMEvaluator implements Evaluator {
  readonly name = 'LLMEvaluator';
  private readonly client: IGeminiClient;
  private readonly model: string;
  private readonly timeoutMs: number;

  constructor(options?: LLMEvaluatorOptions) {
    const envTimeout = process.env.GEMINI_TIMEOUT_MS ? parseInt(process.env.GEMINI_TIMEOUT_MS, 10) : NaN;
    this.timeoutMs = options?.timeoutMs || (!isNaN(envTimeout) && envTimeout > 0 ? envTimeout : 60000);
    this.client = options?.client ?? new RealGeminiClient({ model: options?.model, timeoutMs: this.timeoutMs });
    this.model = options?.model || process.env.GEMINI_MODEL || 'gemini-3.6-flash';
  }

  async evaluate(context: EvaluationContext): Promise<EvaluationResult> {
    const { problem, submission } = context;
    const userPrompt = buildEvaluationUserPrompt(problem, submission);

    // Call Gemini API through client
    const rawJsonText = await this.client.generateEvaluation({
      systemInstruction: LLD_EVALUATION_SYSTEM_PROMPT,
      prompt: userPrompt,
      timeoutMs: this.timeoutMs,
    });

    // Parse JSON
    let parsed: any;
    try {
      // Strip markdown code fences if model returned ```json ... ```
      const cleanedJson = rawJsonText
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/, '')
        .replace(/\s*```$/, '')
        .trim();
      parsed = JSON.parse(cleanedJson);
    } catch (parseError: any) {
      throw new MalformedEvaluationError(
        `Gemini returned malformed non-JSON output: ${parseError?.message || String(parseError)}. Raw text: ${rawJsonText.slice(0, 200)}...`
      );
    }

    // Validate structured JSON matching Evaluation model
    const validatedResult = validateEvaluationResponse(parsed, this.model);
    return validatedResult;
  }
}
