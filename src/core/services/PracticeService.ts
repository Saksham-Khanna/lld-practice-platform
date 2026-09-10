import { Evaluator } from '../evaluator/Evaluator';
import { DuplicateEvaluationError } from '../evaluator/errors';
import { PracticeStore } from './PracticeStore';
import { Problem, Submission, SubmissionContent, Attempt, Evaluation } from '../../types/lld';

export class PracticeService {
  private inProgressEvaluations: Set<string> = new Set();

  constructor(
    private readonly evaluator: Evaluator,
    private readonly store: PracticeStore
  ) {}

  /**
   * Persists a submission before calling the evaluator to ensure the user's work is never lost.
   * Initial lifecycle state: Submitted.
   */
  async createSubmission(problemId: string, content: SubmissionContent): Promise<{ submission: Submission; attempt: Attempt }> {
    const problem = await this.store.getProblem(problemId);
    if (!problem) {
      throw new Error(`Problem with ID '${problemId}' not found.`);
    }

    const timestamp = new Date().toISOString();
    const submissionId = `sub-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const attemptId = `att-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const submission: Submission = {
      id: submissionId,
      attemptId,
      problemId,
      content: { ...content },
      createdAt: timestamp,
    };

    const attempt: Attempt = {
      id: attemptId,
      problemId,
      submissionId,
      status: 'Submitted',
      date: timestamp.split('T')[0],
    };

    // Step 1: Persist the submission and initial attempt upfront
    await this.store.saveSubmission(submission);
    await this.store.saveAttempt(attempt);

    return { submission, attempt };
  }

  /**
   * Executes evaluation for a persisted submission.
   * State transitions:
   * Submitted -> Evaluating -> Completed
   * or
   * Submitted -> Evaluating -> Failed
   */
  async evaluateSubmission(submissionId: string): Promise<Evaluation> {
    // Synchronously check and lock before any async tick
    if (this.inProgressEvaluations.has(submissionId)) {
      throw new DuplicateEvaluationError(`Evaluation is already in progress for submission '${submissionId}'.`);
    }
    this.inProgressEvaluations.add(submissionId);

    try {
      const submission = await this.store.getSubmission(submissionId);
      if (!submission) {
        throw new Error(`Submission '${submissionId}' not found.`);
      }

      const problem = await this.store.getProblem(submission.problemId);
      if (!problem) {
        throw new Error(`Problem '${submission.problemId}' not found.`);
      }

      const attempt = await this.store.getAttempt(submission.attemptId);
      if (!attempt) {
        throw new Error(`Attempt '${submission.attemptId}' not found for submission.`);
      }

      // Idempotency check: If already completed, return existing evaluation
      if (attempt.status === 'Completed' && attempt.evaluationId) {
        const existingEval = await this.store.getEvaluation(attempt.evaluationId);
        if (existingEval) {
          return existingEval;
        }
      }

      if (attempt.status === 'Evaluating') {
        throw new DuplicateEvaluationError(`Evaluation is already in progress for submission '${submissionId}'.`);
      }

      // Step 2: Transition status: Evaluating
      attempt.status = 'Evaluating';
      attempt.errorReason = undefined;
      await this.store.saveAttempt(attempt);

      try {
        // Step 3: Run evaluator
        const result = await this.evaluator.evaluate({
          problem,
          submission,
        });

        // Step 4: Persist evaluation result only after successful completion & validation
        const evaluationId = `eval-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        const evaluation: Evaluation = {
          id: evaluationId,
          submissionId: submission.id,
          overallScore: result.overallScore,
          rubricScores: result.rubricScores,
          strengths: result.strengths,
          feedback: result.feedback,
          evaluatorType: result.evaluatorType,
          modelUsed: result.modelUsed,
          createdAt: result.evaluatedAt || new Date().toISOString(),
        };

        await this.store.saveEvaluation(evaluation);

        // Step 5: Transition status: Completed
        attempt.status = 'Completed';
        attempt.score = evaluation.overallScore;
        attempt.evaluationId = evaluation.id;
        attempt.errorReason = undefined;
        await this.store.saveAttempt(attempt);

        return evaluation;
      } catch (error: any) {
        // Step 6: On any failure, transition status: Failed (do not save corrupted evaluation)
        attempt.status = 'Failed';
        attempt.errorReason = error?.message || String(error);
        await this.store.saveAttempt(attempt);
        throw error;
      }
    } finally {
      this.inProgressEvaluations.delete(submissionId);
    }
  }

  /**
   * Retries an evaluation for a submission.
   * State transitions:
   * Failed -> Evaluating -> Completed / Failed
   */
  async retryEvaluation(submissionId: string): Promise<Evaluation> {
    const submission = await this.store.getSubmission(submissionId);
    if (!submission) {
      throw new Error(`Submission '${submissionId}' not found.`);
    }

    const attempt = await this.store.getAttempt(submission.attemptId);
    if (!attempt) {
      throw new Error(`Attempt '${submission.attemptId}' not found.`);
    }

    // If already completed, return existing evaluation
    if (attempt.status === 'Completed' && attempt.evaluationId) {
      const existingEval = await this.store.getEvaluation(attempt.evaluationId);
      if (existingEval) {
        return existingEval;
      }
    }

    // Reset failure state and re-run evaluation
    attempt.errorReason = undefined;
    return this.evaluateSubmission(submissionId);
  }

  // Read operations
  async getProblem(id: string): Promise<Problem | null> {
    return this.store.getProblem(id);
  }

  async getProblems(): Promise<Problem[]> {
    return this.store.getProblems();
  }

  async getAttempt(id: string): Promise<Attempt | null> {
    return this.store.getAttempt(id);
  }

  async getAttempts(): Promise<Attempt[]> {
    return this.store.getAttempts();
  }

  async getSubmission(id: string): Promise<Submission | null> {
    return this.store.getSubmission(id);
  }

  async getEvaluation(id: string): Promise<Evaluation | null> {
    return this.store.getEvaluation(id);
  }

  async getEvaluationBySubmissionId(submissionId: string): Promise<Evaluation | null> {
    return this.store.getEvaluationBySubmissionId(submissionId);
  }
}
