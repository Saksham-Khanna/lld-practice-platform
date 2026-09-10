export class EvaluationError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = 'EvaluationError';
  }
}

export class MissingApiKeyError extends EvaluationError {
  constructor(message = 'GEMINI_API_KEY is not configured in the environment.') {
    super(message, 'MISSING_API_KEY');
    this.name = 'MissingApiKeyError';
  }
}

export class EvaluationTimeoutError extends EvaluationError {
  constructor(message = 'Evaluation request timed out.') {
    super(message, 'TIMEOUT');
    this.name = 'EvaluationTimeoutError';
  }
}

export class RateLimitError extends EvaluationError {
  constructor(message = 'Gemini API rate limit exceeded. Please try again shortly.') {
    super(message, 'RATE_LIMIT_EXCEEDED');
    this.name = 'RateLimitError';
  }
}

export class GeminiApiError extends EvaluationError {
  constructor(message: string, public readonly originalError?: unknown) {
    super(message, 'GEMINI_API_ERROR');
    this.name = 'GeminiApiError';
  }
}

export class MalformedEvaluationError extends EvaluationError {
  constructor(message: string) {
    super(message, 'MALFORMED_EVALUATION');
    this.name = 'MalformedEvaluationError';
  }
}

export class DuplicateEvaluationError extends EvaluationError {
  constructor(message = 'An evaluation is already in progress for this submission.') {
    super(message, 'DUPLICATE_EVALUATION');
    this.name = 'DuplicateEvaluationError';
  }
}
