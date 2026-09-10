export interface Problem {
  id: string;
  title: string;
  description: string;
  requirements: string[];
  difficulty: 'Easy' | 'Medium' | 'Hard';
  tags: string[];
  context: string;
}

export interface SubmissionContent {
  requirements: string;
  classes: string;
  responsibilities: string;
  relationships: string;
  decisions: string;
  edgeCases: string;
}

export interface Submission {
  id: string;
  attemptId: string;
  problemId: string;
  content: SubmissionContent;
  createdAt: string;
}

export interface RubricScores {
  requirementUnderstanding: number;
  classResponsibilities: number;
  encapsulationInterfaces: number;
  relationshipsCoupling: number;
  extensibilityTradeoffs: number;
  edgeCasesTestability: number;
  explanationQuality: number;
  // Aliases for compatibility with existing UI components
  couplingCohesion?: number;
  abstractionPatterns?: number;
  extensibility?: number;
}

export interface FeedbackItem {
  criterion: string;
  score: number;
  evidence: string;
  concern: string;
  suggestion: string;
  confidence: number;
}

export interface Evaluation {
  id: string;
  submissionId: string;
  overallScore: number;
  rubricScores: RubricScores;
  strengths: string[];
  feedback: FeedbackItem[];
  createdAt: string;
  evaluatorType?: 'rule-based' | 'llm' | 'composite';
  modelUsed?: string;
}

export type AttemptStatus = 'Submitted' | 'Evaluating' | 'Completed' | 'Failed' | 'In Progress';

export interface Attempt {
  id: string;
  problemId: string;
  status: AttemptStatus;
  date: string;
  score?: number;
  evaluationId?: string;
  errorReason?: string;
  submissionId?: string;
}
