import { describe, it, expect, vi } from 'vitest';
import { PracticeService } from '../src/core/services/PracticeService';
import { InMemoryPracticeStore } from '../src/core/services/PracticeStore';
import { Evaluator, EvaluationResult } from '../src/core/evaluator/Evaluator';
import { DuplicateEvaluationError, GeminiApiError } from '../src/core/evaluator/errors';

const mockEvaluationResult: EvaluationResult = {
  overallScore: 85,
  rubricScores: {
    requirementUnderstanding: 85,
    classResponsibilities: 85,
    encapsulationInterfaces: 80,
    relationshipsCoupling: 85,
    extensibilityTradeoffs: 90,
    edgeCasesTestability: 80,
    explanationQuality: 85,
    couplingCohesion: 85,
    abstractionPatterns: 85,
    extensibility: 90,
  },
  strengths: ['Solid architecture'],
  feedback: [
    {
      criterion: 'Encapsulation & Interfaces',
      score: 80,
      evidence: 'Clear classes',
      concern: 'Tight coupling',
      suggestion: 'Use dependency injection',
      confidence: 0.9,
    },
  ],
  evaluatorType: 'llm',
};

describe('PracticeService Lifecycle & Persistence', () => {
  it('persists submission to store before calling evaluator (ensuring user work is never lost)', async () => {
    const store = new InMemoryPracticeStore();
    const mockEvaluator: Evaluator = {
      name: 'MockEvaluator',
      evaluate: vi.fn().mockRejectedValue(new GeminiApiError('API connection dropped')),
    };

    const service = new PracticeService(mockEvaluator, store);

    // 1. Create submission
    const { submission, attempt } = await service.createSubmission('parking-lot', {
      requirements: 'Support different vehicles',
      classes: 'class ParkingLot',
      responsibilities: 'Manage spots',
      relationships: 'ParkingLot HAS-A spots',
      decisions: 'Simple memory map',
      edgeCases: 'Lot full',
    });

    // Verify submission is in store immediately
    const savedSubBeforeEval = await store.getSubmission(submission.id);
    expect(savedSubBeforeEval).not.toBeNull();
    expect(savedSubBeforeEval?.content.classes).toBe('class ParkingLot');
    expect(attempt.status).toBe('Submitted');

    // 2. Run evaluation which will fail
    await expect(service.evaluateSubmission(submission.id)).rejects.toThrow(GeminiApiError);

    // Verify submission STILL exists and content is NOT lost
    const savedSubAfterFail = await store.getSubmission(submission.id);
    expect(savedSubAfterFail).not.toBeNull();
    expect(savedSubAfterFail?.content.classes).toBe('class ParkingLot');

    // Verify attempt transitioned to Failed with errorReason
    const failedAttempt = await store.getAttempt(attempt.id);
    expect(failedAttempt?.status).toBe('Failed');
    expect(failedAttempt?.errorReason).toContain('API connection dropped');

    // Verify no corrupted evaluation was saved
    const evaluations = await store.getEvaluations();
    const subEval = evaluations.find(e => e.submissionId === submission.id);
    expect(subEval).toBeUndefined();
  });

  it('completes the successful lifecycle: Submitted -> Evaluating -> Completed', async () => {
    const store = new InMemoryPracticeStore();
    const mockEvaluator: Evaluator = {
      name: 'MockEvaluator',
      evaluate: vi.fn().mockResolvedValue(mockEvaluationResult),
    };

    const service = new PracticeService(mockEvaluator, store);

    // Create submission: initial status 'Submitted'
    const { submission, attempt } = await service.createSubmission('parking-lot', {
      requirements: 'Requirements',
      classes: 'Classes',
      responsibilities: 'Responsibilities',
      relationships: 'Relationships',
      decisions: 'Decisions',
      edgeCases: 'EdgeCases',
    });
    expect(attempt.status).toBe('Submitted');

    // Evaluate submission: transitions to 'Evaluating' -> 'Completed'
    const evaluation = await service.evaluateSubmission(submission.id);

    expect(evaluation).toBeDefined();
    expect(evaluation.overallScore).toBe(85);
    expect(evaluation.submissionId).toBe(submission.id);

    // Attempt is marked Completed with score and evaluationId
    const completedAttempt = await store.getAttempt(attempt.id);
    expect(completedAttempt?.status).toBe('Completed');
    expect(completedAttempt?.score).toBe(85);
    expect(completedAttempt?.evaluationId).toBe(evaluation.id);
    expect(completedAttempt?.errorReason).toBeUndefined();
  });

  it('supports retry after failed evaluation: Failed -> Evaluating -> Completed', async () => {
    const store = new InMemoryPracticeStore();
    let shouldFail = true;

    const mockEvaluator: Evaluator = {
      name: 'MockEvaluator',
      evaluate: vi.fn().mockImplementation(async () => {
        if (shouldFail) {
          throw new GeminiApiError('Temporary network timeout');
        }
        return mockEvaluationResult;
      }),
    };

    const service = new PracticeService(mockEvaluator, store);

    const { submission, attempt } = await service.createSubmission('parking-lot', {
      requirements: 'Reqs',
      classes: 'Classes',
      responsibilities: 'Resp',
      relationships: 'Rels',
      decisions: 'Decs',
      edgeCases: 'Edges',
    });

    // 1. Initial evaluate fails
    await expect(service.evaluateSubmission(submission.id)).rejects.toThrow(GeminiApiError);
    let currentAttempt = await store.getAttempt(attempt.id);
    expect(currentAttempt?.status).toBe('Failed');

    // 2. Network recovers, user retries
    shouldFail = false;
    const retryEvaluation = await service.retryEvaluation(submission.id);

    expect(retryEvaluation).toBeDefined();
    expect(retryEvaluation.overallScore).toBe(85);

    currentAttempt = await store.getAttempt(attempt.id);
    expect(currentAttempt?.status).toBe('Completed');
    expect(currentAttempt?.score).toBe(85);
    expect(currentAttempt?.errorReason).toBeUndefined();
  });

  it('provides idempotent evaluation (subsequent evaluate calls return existing evaluation)', async () => {
    const store = new InMemoryPracticeStore();
    const mockEvaluator: Evaluator = {
      name: 'MockEvaluator',
      evaluate: vi.fn().mockResolvedValue(mockEvaluationResult),
    };

    const service = new PracticeService(mockEvaluator, store);

    const { submission } = await service.createSubmission('parking-lot', {
      requirements: 'Reqs',
      classes: 'Classes',
      responsibilities: 'Resp',
      relationships: 'Rels',
      decisions: 'Decs',
      edgeCases: 'Edges',
    });

    // First evaluation
    const firstEval = await service.evaluateSubmission(submission.id);
    expect(mockEvaluator.evaluate).toHaveBeenCalledTimes(1);

    // Second evaluation on the same submission
    const secondEval = await service.evaluateSubmission(submission.id);
    expect(secondEval.id).toBe(firstEval.id);
    expect(secondEval.overallScore).toBe(firstEval.overallScore);

    // Evaluator should NOT have been called a second time
    expect(mockEvaluator.evaluate).toHaveBeenCalledTimes(1);
  });

  it('prevents duplicate concurrent evaluations for the same submission', async () => {
    const store = new InMemoryPracticeStore();
    const mockEvaluator: Evaluator = {
      name: 'MockEvaluator',
      evaluate: vi.fn().mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(mockEvaluationResult), 100))
      ),
    };

    const service = new PracticeService(mockEvaluator, store);

    const { submission } = await service.createSubmission('parking-lot', {
      requirements: 'Reqs',
      classes: 'Classes',
      responsibilities: 'Resp',
      relationships: 'Rels',
      decisions: 'Decs',
      edgeCases: 'Edges',
    });

    // Start first evaluation in background
    const firstEvalPromise = service.evaluateSubmission(submission.id);

    // Attempt second evaluation concurrently
    await expect(service.evaluateSubmission(submission.id)).rejects.toThrow(DuplicateEvaluationError);

    // Await first evaluation completion
    const result = await firstEvalPromise;
    expect(result.overallScore).toBe(85);
  });
});
