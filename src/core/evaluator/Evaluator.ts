import { Problem, Submission, RubricScores, FeedbackItem } from '../../types/lld';

export interface EvaluationContext {
  problem: Problem;
  submission: Submission;
}

export interface EvaluationResult {
  overallScore: number;
  rubricScores: RubricScores;
  strengths: string[];
  feedback: FeedbackItem[];
  evaluatorType: 'rule-based' | 'llm' | 'composite';
  modelUsed?: string;
  evaluatedAt?: string;
}

export interface Evaluator {
  readonly name: string;
  evaluate(context: EvaluationContext): Promise<EvaluationResult>;
}
