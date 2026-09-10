import type { IncomingMessage, ServerResponse } from 'http';
import { PracticeService } from '../core/services/PracticeService';
import { InMemoryPracticeStore } from '../core/services/PracticeStore';
import { CompositeEvaluator } from '../core/evaluator/CompositeEvaluator';
import { LLMEvaluator } from '../core/evaluator/LLMEvaluator';
import { RuleBasedEvaluator } from '../core/evaluator/RuleBasedEvaluator';

// Initialize server-side evaluator architecture
const store = new InMemoryPracticeStore();
const ruleEvaluator = new RuleBasedEvaluator();
const llmEvaluator = new LLMEvaluator();
const compositeEvaluator = new CompositeEvaluator({
  ruleBasedEvaluator: ruleEvaluator,
  llmEvaluator,
  fallbackToRuleBasedOnFailure: false, // Ensure errors propagate as required
});

export const serverPracticeService = new PracticeService(compositeEvaluator, store);

function parseJsonBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
    });
    req.on('end', () => {
      if (!body.trim()) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res: ServerResponse, statusCode: number, data: any): void {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(JSON.stringify(data));
}

export async function handleApiRequest(
  req: IncomingMessage,
  res: ServerResponse,
  service = serverPracticeService
): Promise<boolean> {
  const url = req.url || '';

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    res.end();
    return true;
  }

  // Health check
  if (url === '/api/health' && req.method === 'GET') {
    sendJson(res, 200, {
      status: 'ok',
      geminiConfigured: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 0),
    });
    return true;
  }

  // GET /api/problems
  if (url === '/api/problems' && req.method === 'GET') {
    const problems = await service.getProblems();
    sendJson(res, 200, problems);
    return true;
  }

  // GET /api/attempts
  if (url === '/api/attempts' && req.method === 'GET') {
    const attempts = await service.getAttempts();
    sendJson(res, 200, attempts);
    return true;
  }

  // GET /api/evaluations/by-problem/:problemId
  const byProblemMatch = url.match(/^\/api\/evaluations\/by-problem\/([a-zA-Z0-9_-]+)/);
  if (byProblemMatch && req.method === 'GET') {
    const problemId = byProblemMatch[1];
    const attempts = await service.getAttempts();
    const problemAttempt = attempts.find(a => a.problemId === problemId && a.evaluationId);
    if (problemAttempt?.evaluationId) {
      const evaluation = await service.getEvaluation(problemAttempt.evaluationId);
      if (evaluation) {
        sendJson(res, 200, evaluation);
        return true;
      }
    }
    sendJson(res, 404, { error: `No evaluation found for problem '${problemId}'.` });
    return true;
  }

  // GET /api/evaluations/:id
  const evalMatch = url.match(/^\/api\/evaluations\/([a-zA-Z0-9_-]+)/);
  if (evalMatch && req.method === 'GET' && !url.includes('/retry')) {
    const id = evalMatch[1];
    let evaluation = await service.getEvaluation(id);
    if (!evaluation) {
      evaluation = await service.getEvaluationBySubmissionId(id);
    }
    if (evaluation) {
      sendJson(res, 200, evaluation);
    } else {
      sendJson(res, 404, { error: `Evaluation '${id}' not found.` });
    }
    return true;
  }

  // GET /api/submissions/:id
  const subMatch = url.match(/^\/api\/submissions\/([a-zA-Z0-9_-]+)/);
  if (subMatch && req.method === 'GET') {
    const id = subMatch[1];
    const submission = await service.getSubmission(id);
    if (submission) {
      sendJson(res, 200, submission);
    } else {
      sendJson(res, 404, { error: `Submission '${id}' not found.` });
    }
    return true;
  }

  // POST /api/submissions (Create & evaluate)
  if (url === '/api/submissions' && req.method === 'POST') {
    try {
      const body = await parseJsonBody(req);
      const { problemId, content } = body;

      if (!problemId || !content) {
        sendJson(res, 400, { error: 'Missing problemId or content in request body.' });
        return true;
      }

      const totalLength = Object.values(content).reduce(
        (sum: number, val: any) => sum + (typeof val === 'string' ? val.trim().length : 0),
        0
      );

      if (totalLength < 15) {
        sendJson(res, 400, {
          error: 'Submission cannot be empty. Please provide your core classes, responsibilities, and requirements before submitting for evaluation.',
        });
        return true;
      }

      // 1. Persist submission first (Guaranteed saved)
      const { submission, attempt } = await service.createSubmission(problemId, content);

      // 2. Perform evaluation
      try {
        const evaluation = await service.evaluateSubmission(submission.id);
        sendJson(res, 201, {
          success: true,
          submission,
          attempt: await service.getAttempt(attempt.id),
          evaluation,
        });
      } catch (evalError: any) {
        // Submission is saved even if evaluation fails
        const failedAttempt = await service.getAttempt(attempt.id);
        sendJson(res, 502, {
          success: false,
          submission,
          attempt: failedAttempt,
          error: evalError?.message || 'Evaluation failed',
          errorCode: evalError?.code || 'EVALUATION_FAILED',
        });
      }
      return true;
    } catch (err: any) {
      sendJson(res, 500, { error: err?.message || 'Internal server error' });
      return true;
    }
  }

  // POST /api/evaluations/:submissionId/retry
  const retryMatch = url.match(/^\/api\/evaluations\/([a-zA-Z0-9_-]+)\/retry/);
  if (retryMatch && req.method === 'POST') {
    const submissionId = retryMatch[1];
    try {
      const evaluation = await service.retryEvaluation(submissionId);
      const submission = await service.getSubmission(submissionId);
      const attempt = submission ? await service.getAttempt(submission.attemptId) : null;
      sendJson(res, 200, {
        success: true,
        evaluation,
        attempt,
      });
    } catch (retryError: any) {
      const submission = await service.getSubmission(submissionId);
      const attempt = submission ? await service.getAttempt(submission.attemptId) : null;
      sendJson(res, 502, {
        success: false,
        attempt,
        error: retryError?.message || 'Retry evaluation failed',
        errorCode: retryError?.code || 'RETRY_FAILED',
      });
    }
    return true;
  }

  return false;
}
