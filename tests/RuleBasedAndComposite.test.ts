import { describe, it, expect, vi } from 'vitest';
import { RuleBasedEvaluator } from '../src/core/evaluator/RuleBasedEvaluator';
import { CompositeEvaluator } from '../src/core/evaluator/CompositeEvaluator';
import { LLMEvaluator } from '../src/core/evaluator/LLMEvaluator';
import { Problem, Submission } from '../src/types/lld';

const sampleProblem: Problem = {
  id: 'vending-machine',
  title: 'Vending Machine',
  description: 'Design a vending machine system.',
  requirements: ['Dispense items', 'Accept payments'],
  difficulty: 'Easy',
  tags: ['OOP'],
  context: 'State pattern driven machine.',
};

describe('RuleBasedEvaluator & CompositeEvaluator', () => {
  it('penalizes empty submissions deterministically', async () => {
    const evaluator = new RuleBasedEvaluator();
    const emptySubmission: Submission = {
      id: 'sub-empty',
      attemptId: 'att-empty',
      problemId: 'vending-machine',
      content: {
        requirements: '',
        classes: '',
        responsibilities: '',
        relationships: '',
        decisions: '',
        edgeCases: '',
      },
      createdAt: new Date().toISOString(),
    };

    const result = await evaluator.evaluate({
      problem: sampleProblem,
      submission: emptySubmission,
    });

    expect(result.overallScore).toBeLessThan(40);
    expect(result.feedback.some(f => f.criterion === 'Requirement Understanding')).toBe(true);
    expect(result.feedback.some(f => f.criterion === 'Class Responsibilities')).toBe(true);
    expect(result.evaluatorType).toBe('rule-based');
  });

  it('rewards structured submissions with detected classes, patterns, and concurrency', async () => {
    const evaluator = new RuleBasedEvaluator();
    const richSubmission: Submission = {
      id: 'sub-rich',
      attemptId: 'att-rich',
      problemId: 'vending-machine',
      content: {
        requirements: 'Support cash and cards. Keep inventory accurate. Safe refund flow.',
        classes: 'class VendingMachine, class Inventory, interface State, class IdleState, class HasMoneyState, interface PaymentStrategy',
        responsibilities: 'VendingMachine delegates to State. Inventory tracks stock. PaymentStrategy handles payments.',
        relationships: 'VendingMachine HAS-A Inventory (composition). VendingMachine HAS-A State. IdleState implements State.',
        decisions: 'State pattern for transaction lifecycles. Strategy pattern for payment methods.',
        edgeCases: 'Concurrent purchases handled with thread synchronization locks and atomic inventory decrement.',
      },
      createdAt: new Date().toISOString(),
    };

    const result = await evaluator.evaluate({
      problem: sampleProblem,
      submission: richSubmission,
    });

    expect(result.overallScore).toBeGreaterThanOrEqual(75);
    expect(result.strengths.length).toBeGreaterThan(2);
    expect(result.rubricScores.encapsulationInterfaces).toBeGreaterThanOrEqual(75);
  });

  it('CompositeEvaluator evaluates blank submissions with RuleBasedEvaluator immediately without calling LLM', async () => {
    const mockLlm = {
      name: 'MockLLM',
      evaluate: vi.fn(),
    } as unknown as LLMEvaluator;

    const composite = new CompositeEvaluator({
      llmEvaluator: mockLlm,
      ruleBasedEvaluator: new RuleBasedEvaluator(),
    });

    const blankSubmission: Submission = {
      id: 'sub-blank',
      attemptId: 'att-blank',
      problemId: 'vending-machine',
      content: {
        requirements: '',
        classes: '',
        responsibilities: '',
        relationships: '',
        decisions: '',
        edgeCases: '',
      },
      createdAt: new Date().toISOString(),
    };

    const result = await composite.evaluate({
      problem: sampleProblem,
      submission: blankSubmission,
    });

    expect(result.evaluatorType).toBe('composite');
    expect(mockLlm.evaluate).not.toHaveBeenCalled();
  });
});
