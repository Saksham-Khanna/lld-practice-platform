import { EvaluationResult } from './Evaluator';
import { RubricScores, FeedbackItem } from '../../types/lld';
import { MalformedEvaluationError } from './errors';

const REQUIRED_RUBRIC_KEYS: (keyof Omit<RubricScores, 'couplingCohesion' | 'abstractionPatterns' | 'extensibility'>)[] = [
  'requirementUnderstanding',
  'classResponsibilities',
  'encapsulationInterfaces',
  'relationshipsCoupling',
  'extensibilityTradeoffs',
  'edgeCasesTestability',
  'explanationQuality',
];

export function validateEvaluationResponse(raw: any, modelUsed = 'gemini'): EvaluationResult {
  if (!raw || typeof raw !== 'object') {
    throw new MalformedEvaluationError('Response must be a non-null JSON object');
  }

  // 1. Validate overallScore
  if (typeof raw.overallScore !== 'number' || Number.isNaN(raw.overallScore) || raw.overallScore < 0 || raw.overallScore > 100) {
    throw new MalformedEvaluationError(`Invalid or missing overallScore: must be a number between 0 and 100 (got ${raw.overallScore})`);
  }

  // 2. Validate rubricScores
  if (!raw.rubricScores || typeof raw.rubricScores !== 'object') {
    throw new MalformedEvaluationError('Missing rubricScores object');
  }

  for (const key of REQUIRED_RUBRIC_KEYS) {
    const val = raw.rubricScores[key];
    if (typeof val !== 'number' || Number.isNaN(val) || val < 0 || val > 100) {
      throw new MalformedEvaluationError(`Invalid or missing rubricScore for '${key}': must be between 0 and 100 (got ${val})`);
    }
  }

  // 3. Validate strengths
  if (!Array.isArray(raw.strengths)) {
    throw new MalformedEvaluationError('Missing or invalid strengths: must be an array of strings');
  }
  const strengths = raw.strengths.filter((s: any) => typeof s === 'string' && s.trim().length > 0);
  if (strengths.length === 0) {
    throw new MalformedEvaluationError('Strengths array must contain at least one valid string');
  }

  // 4. Validate feedback
  if (!Array.isArray(raw.feedback) || raw.feedback.length === 0) {
    throw new MalformedEvaluationError('Feedback must be a non-empty array of feedback items');
  }

  const feedbackItems: FeedbackItem[] = [];
  for (let i = 0; i < raw.feedback.length; i++) {
    const item = raw.feedback[i];
    if (!item || typeof item !== 'object') {
      throw new MalformedEvaluationError(`Feedback item at index ${i} is not an object`);
    }

    if (typeof item.criterion !== 'string' || !item.criterion.trim()) {
      throw new MalformedEvaluationError(`Feedback item at index ${i} is missing valid criterion`);
    }

    if (typeof item.score !== 'number' || Number.isNaN(item.score) || item.score < 0 || item.score > 100) {
      throw new MalformedEvaluationError(`Feedback item at index ${i} has invalid score (must be 0-100, got ${item.score})`);
    }

    if (typeof item.evidence !== 'string' || !item.evidence.trim()) {
      throw new MalformedEvaluationError(`Feedback item at index ${i} is missing evidence`);
    }

    if (typeof item.concern !== 'string' || !item.concern.trim()) {
      throw new MalformedEvaluationError(`Feedback item at index ${i} is missing concern`);
    }

    if (typeof item.suggestion !== 'string' || !item.suggestion.trim()) {
      throw new MalformedEvaluationError(`Feedback item at index ${i} is missing suggestion`);
    }

    const confidence = typeof item.confidence === 'number' && item.confidence >= 0 && item.confidence <= 1
      ? item.confidence
      : 0.9;

    feedbackItems.push({
      criterion: item.criterion.trim(),
      score: Math.round(item.score),
      evidence: item.evidence.trim(),
      concern: item.concern.trim(),
      suggestion: item.suggestion.trim(),
      confidence,
    });
  }

  const rubricScores: RubricScores = {
    requirementUnderstanding: Math.round(raw.rubricScores.requirementUnderstanding),
    classResponsibilities: Math.round(raw.rubricScores.classResponsibilities),
    encapsulationInterfaces: Math.round(raw.rubricScores.encapsulationInterfaces),
    relationshipsCoupling: Math.round(raw.rubricScores.relationshipsCoupling),
    extensibilityTradeoffs: Math.round(raw.rubricScores.extensibilityTradeoffs),
    edgeCasesTestability: Math.round(raw.rubricScores.edgeCasesTestability),
    explanationQuality: Math.round(raw.rubricScores.explanationQuality),
    // Aliases for UI backwards-compatibility
    couplingCohesion: Math.round(raw.rubricScores.relationshipsCoupling),
    extensibility: Math.round(raw.rubricScores.extensibilityTradeoffs),
    abstractionPatterns: Math.round((raw.rubricScores.encapsulationInterfaces + raw.rubricScores.extensibilityTradeoffs) / 2),
  };

  return {
    overallScore: Math.round(raw.overallScore),
    rubricScores,
    strengths,
    feedback: feedbackItems,
    evaluatorType: 'llm',
    modelUsed,
    evaluatedAt: new Date().toISOString(),
  };
}
