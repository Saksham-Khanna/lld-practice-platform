import { describe, it, expect, vi } from 'vitest';
import { LLMEvaluator } from '../src/core/evaluator/LLMEvaluator';
import { IGeminiClient } from '../src/server/geminiClient';
import {
  MissingApiKeyError,
  EvaluationTimeoutError,
  RateLimitError,
  GeminiApiError,
  MalformedEvaluationError,
} from '../src/core/evaluator/errors';
import { Problem, Submission } from '../src/types/lld';

const sampleProblem: Problem = {
  id: 'parking-lot',
  title: 'Parking Lot System',
  description: 'Design a multi-story parking lot.',
  requirements: ['Support vehicle types', 'Ticketing and payment'],
  difficulty: 'Medium',
  tags: ['OOP'],
  context: 'High throughput parking system.',
};

const sampleSubmission: Submission = {
  id: 'sub-test-1',
  attemptId: 'att-test-1',
  problemId: 'parking-lot',
  content: {
    requirements: 'Support Car, Bike, Truck. Automated gate ticketing.',
    classes: 'class ParkingLot, class ParkingFloor, class ParkingSpot, interface PaymentStrategy',
    responsibilities: 'ParkingLot manages floors. Spot tracks occupancy. PaymentStrategy calculates fee.',
    relationships: 'ParkingLot HAS-A ParkingFloors. ParkingFloor HAS-A ParkingSpots.',
    decisions: 'Strategy pattern for payment processing. Thread-safe locks on spot reservation.',
    edgeCases: 'Lot full, concurrent spot booking, expired tickets.',
  },
  createdAt: '2026-09-10T00:00:00Z',
};

const validGeminiJsonResponse = JSON.stringify({
  overallScore: 88,
  rubricScores: {
    requirementUnderstanding: 90,
    classResponsibilities: 85,
    encapsulationInterfaces: 85,
    relationshipsCoupling: 90,
    extensibilityTradeoffs: 90,
    edgeCasesTestability: 85,
    explanationQuality: 90,
  },
  strengths: [
    'Clean separation of concerns with ParkingLot and Floor',
    'Utilized Strategy pattern for extensible payment calculation',
    'Addressed concurrent spot booking in edge cases',
  ],
  feedback: [
    {
      criterion: 'Encapsulation & Interfaces',
      score: 85,
      evidence: 'interface PaymentStrategy is defined for payment processing',
      concern: 'ParkingSpot assignment logic could benefit from a dedicated SpotAssignmentStrategy abstraction',
      suggestion: 'Introduce SpotAssignmentStrategy interface to support nearest-first or random spot assignment',
      confidence: 0.92,
    },
    {
      criterion: 'Edge Cases & Testability',
      score: 85,
      evidence: 'Mentioned concurrent spot booking and thread-safe locks',
      concern: 'Exact synchronization boundary (floor vs lot level) is not detailed',
      suggestion: 'Document whether spot locking is done via fine-grained spot mutexes or optimistic locking',
      confidence: 0.88,
    },
  ],
});

describe('LLMEvaluator', () => {
  it('successfully evaluates a submission with valid structured Gemini output', async () => {
    const mockClient: IGeminiClient = {
      generateEvaluation: vi.fn().mockResolvedValue(validGeminiJsonResponse),
    };

    const evaluator = new LLMEvaluator({ client: mockClient, model: 'gemini-2.5-flash' });
    const result = await evaluator.evaluate({
      problem: sampleProblem,
      submission: sampleSubmission,
    });

    expect(result.overallScore).toBe(88);
    expect(result.rubricScores.requirementUnderstanding).toBe(90);
    expect(result.rubricScores.classResponsibilities).toBe(85);
    expect(result.rubricScores.relationshipsCoupling).toBe(90);
    // UI backward compatibility aliases
    expect(result.rubricScores.couplingCohesion).toBe(90);
    expect(result.strengths.length).toBe(3);
    expect(result.feedback.length).toBe(2);
    expect(result.feedback[0].criterion).toBe('Encapsulation & Interfaces');
    expect(result.evaluatorType).toBe('llm');
    expect(mockClient.generateEvaluation).toHaveBeenCalledTimes(1);
  });

  it('handles markdown fences in Gemini response gracefully', async () => {
    const fencedJson = `\`\`\`json\n${validGeminiJsonResponse}\n\`\`\``;
    const mockClient: IGeminiClient = {
      generateEvaluation: vi.fn().mockResolvedValue(fencedJson),
    };

    const evaluator = new LLMEvaluator({ client: mockClient });
    const result = await evaluator.evaluate({
      problem: sampleProblem,
      submission: sampleSubmission,
    });

    expect(result.overallScore).toBe(88);
  });

  it('throws MalformedEvaluationError when Gemini returns invalid non-JSON output', async () => {
    const mockClient: IGeminiClient = {
      generateEvaluation: vi.fn().mockResolvedValue('I am an AI and here is your feedback without JSON: Good job!'),
    };

    const evaluator = new LLMEvaluator({ client: mockClient });
    await expect(
      evaluator.evaluate({
        problem: sampleProblem,
        submission: sampleSubmission,
      })
    ).rejects.toThrow(MalformedEvaluationError);
  });

  it('throws MalformedEvaluationError when required fields are missing from JSON', async () => {
    const incompleteJson = JSON.stringify({
      overallScore: 80,
      // Missing rubricScores, strengths, feedback
    });

    const mockClient: IGeminiClient = {
      generateEvaluation: vi.fn().mockResolvedValue(incompleteJson),
    };

    const evaluator = new LLMEvaluator({ client: mockClient });
    await expect(
      evaluator.evaluate({
        problem: sampleProblem,
        submission: sampleSubmission,
      })
    ).rejects.toThrow(MalformedEvaluationError);
  });

  it('throws MalformedEvaluationError when scores are out of bounds (> 100 or < 0)', async () => {
    const outOfBoundsJson = JSON.stringify({
      overallScore: 150, // Invalid!
      rubricScores: {
        requirementUnderstanding: 90,
        classResponsibilities: 85,
        encapsulationInterfaces: 85,
        relationshipsCoupling: 90,
        extensibilityTradeoffs: 90,
        edgeCasesTestability: 85,
        explanationQuality: 90,
      },
      strengths: ['Great work'],
      feedback: [
        {
          criterion: 'Testing',
          score: 80,
          evidence: 'test',
          concern: 'none',
          suggestion: 'keep it up',
          confidence: 0.9,
        },
      ],
    });

    const mockClient: IGeminiClient = {
      generateEvaluation: vi.fn().mockResolvedValue(outOfBoundsJson),
    };

    const evaluator = new LLMEvaluator({ client: mockClient });
    await expect(
      evaluator.evaluate({
        problem: sampleProblem,
        submission: sampleSubmission,
      })
    ).rejects.toThrow(MalformedEvaluationError);
  });

  it('handles API failure properly (e.g. 500 error from Gemini)', async () => {
    const mockClient: IGeminiClient = {
      generateEvaluation: vi.fn().mockRejectedValue(new GeminiApiError('Internal server error 500')),
    };

    const evaluator = new LLMEvaluator({ client: mockClient });
    await expect(
      evaluator.evaluate({
        problem: sampleProblem,
        submission: sampleSubmission,
      })
    ).rejects.toThrow(GeminiApiError);
  });

  it('handles missing API key properly', async () => {
    const mockClient: IGeminiClient = {
      generateEvaluation: vi.fn().mockRejectedValue(new MissingApiKeyError()),
    };

    const evaluator = new LLMEvaluator({ client: mockClient });
    await expect(
      evaluator.evaluate({
        problem: sampleProblem,
        submission: sampleSubmission,
      })
    ).rejects.toThrow(MissingApiKeyError);
  });

  it('handles timeout properly', async () => {
    const mockClient: IGeminiClient = {
      generateEvaluation: vi.fn().mockRejectedValue(new EvaluationTimeoutError('Timeout after 30000ms')),
    };

    const evaluator = new LLMEvaluator({ client: mockClient });
    await expect(
      evaluator.evaluate({
        problem: sampleProblem,
        submission: sampleSubmission,
      })
    ).rejects.toThrow(EvaluationTimeoutError);
  });

  it('handles rate limits properly', async () => {
    const mockClient: IGeminiClient = {
      generateEvaluation: vi.fn().mockRejectedValue(new RateLimitError('Rate limit exceeded 429')),
    };

    const evaluator = new LLMEvaluator({ client: mockClient });
    await expect(
      evaluator.evaluate({
        problem: sampleProblem,
        submission: sampleSubmission,
      })
    ).rejects.toThrow(RateLimitError);
  });
});
