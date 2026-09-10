import { Evaluator, EvaluationContext, EvaluationResult } from './Evaluator';
import { RuleBasedEvaluator } from './RuleBasedEvaluator';
import { LLMEvaluator } from './LLMEvaluator';

export interface CompositeEvaluatorOptions {
  ruleBasedEvaluator?: RuleBasedEvaluator;
  llmEvaluator?: LLMEvaluator;
  fallbackToRuleBasedOnFailure?: boolean;
}

export class CompositeEvaluator implements Evaluator {
  readonly name = 'CompositeEvaluator';
  private readonly ruleBasedEvaluator: RuleBasedEvaluator;
  private readonly llmEvaluator: LLMEvaluator;
  private readonly fallbackOnFailure: boolean;

  constructor(options?: CompositeEvaluatorOptions) {
    this.ruleBasedEvaluator = options?.ruleBasedEvaluator ?? new RuleBasedEvaluator();
    this.llmEvaluator = options?.llmEvaluator ?? new LLMEvaluator();
    this.fallbackOnFailure = options?.fallbackToRuleBasedOnFailure ?? false;
  }

  async evaluate(context: EvaluationContext): Promise<EvaluationResult> {
    const { submission } = context;
    const content = submission.content;

    // Check if submission is completely blank
    const isCompletelyEmpty = Object.values(content || {}).every(
      val => typeof val === 'string' && val.trim().length === 0
    );

    if (isCompletelyEmpty) {
      // Deterministic immediate evaluation for blank submissions
      const ruleResult = await this.ruleBasedEvaluator.evaluate(context);
      return {
        ...ruleResult,
        evaluatorType: 'composite',
      };
    }

    try {
      // Run LLM evaluation as primary evaluator
      const llmResult = await this.llmEvaluator.evaluate(context);

      // Also run rule-based check for structural feedback
      const ruleResult = await this.ruleBasedEvaluator.evaluate(context);

      // Merge unique deterministic structural concerns if not already present
      const combinedFeedback = [...llmResult.feedback];
      for (const ruleItem of ruleResult.feedback) {
        const isDuplicate = combinedFeedback.some(
          fb => fb.criterion.toLowerCase() === ruleItem.criterion.toLowerCase()
        );
        if (!isDuplicate && ruleItem.score < 50) {
          combinedFeedback.push(ruleItem);
        }
      }

      return {
        ...llmResult,
        feedback: combinedFeedback,
        evaluatorType: 'composite',
      };
    } catch (error) {
      if (this.fallbackOnFailure) {
        const ruleResult = await this.ruleBasedEvaluator.evaluate(context);
        return {
          ...ruleResult,
          evaluatorType: 'composite',
        };
      }
      throw error;
    }
  }
}
