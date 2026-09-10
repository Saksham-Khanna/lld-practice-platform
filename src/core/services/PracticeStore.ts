import { Problem, Submission, Attempt, Evaluation } from '../../types/lld';
import { PROBLEMS, MOCK_ATTEMPTS, MOCK_EVALUATIONS } from '../../data/mockData';

export interface PracticeStore {
  saveProblem(problem: Problem): Promise<void>;
  getProblem(id: string): Promise<Problem | null>;
  getProblems(): Promise<Problem[]>;

  saveSubmission(submission: Submission): Promise<void>;
  getSubmission(id: string): Promise<Submission | null>;
  getSubmissions(): Promise<Submission[]>;

  saveAttempt(attempt: Attempt): Promise<void>;
  getAttempt(id: string): Promise<Attempt | null>;
  getAttempts(): Promise<Attempt[]>;

  saveEvaluation(evaluation: Evaluation): Promise<void>;
  getEvaluation(id: string): Promise<Evaluation | null>;
  getEvaluationBySubmissionId(submissionId: string): Promise<Evaluation | null>;
  getEvaluations(): Promise<Evaluation[]>;
}

export class InMemoryPracticeStore implements PracticeStore {
  private problems: Map<string, Problem> = new Map();
  private submissions: Map<string, Submission> = new Map();
  private attempts: Map<string, Attempt> = new Map();
  private evaluations: Map<string, Evaluation> = new Map();

  constructor(seedWithMockData = true) {
    if (seedWithMockData) {
      this.seedDefaults();
    }
  }

  private seedDefaults(): void {
    for (const p of PROBLEMS) {
      this.problems.set(p.id, { ...p });
    }

    for (const att of MOCK_ATTEMPTS) {
      this.attempts.set(att.id, {
        id: att.id,
        problemId: att.problemId,
        status: att.status as any,
        date: att.date,
        score: att.score,
        evaluationId: att.evaluationId,
      });
    }

    for (const [id, ev] of Object.entries(MOCK_EVALUATIONS)) {
      this.evaluations.set(id, {
        id: ev.id,
        submissionId: ev.submissionId,
        overallScore: ev.overallScore,
        rubricScores: {
          requirementUnderstanding: ev.rubricScores.requirementUnderstanding,
          classResponsibilities: ev.rubricScores.classResponsibilities,
          encapsulationInterfaces: ev.rubricScores.encapsulationInterfaces,
          relationshipsCoupling: ev.rubricScores.couplingCohesion,
          extensibilityTradeoffs: ev.rubricScores.extensibility,
          edgeCasesTestability: ev.rubricScores.edgeCasesTestability,
          explanationQuality: ev.rubricScores.explanationQuality,
          couplingCohesion: ev.rubricScores.couplingCohesion,
          abstractionPatterns: ev.rubricScores.abstractionPatterns,
          extensibility: ev.rubricScores.extensibility,
        },
        strengths: ['Identified good separation of responsibilities', 'Appropriate design choices'],
        feedback: ev.feedback.map((f, i) => ({
          criterion: i === 0 ? 'Relationships & Coupling' : 'Edge Cases & Concurrency',
          score: 75,
          evidence: f.evidence,
          concern: f.concern,
          suggestion: f.suggestion,
          confidence: 0.9,
        })),
        createdAt: '2023-10-20T10:00:00Z',
      });
    }
  }

  async saveProblem(problem: Problem): Promise<void> {
    this.problems.set(problem.id, { ...problem });
  }

  async getProblem(id: string): Promise<Problem | null> {
    return this.problems.get(id) ? { ...this.problems.get(id)! } : null;
  }

  async getProblems(): Promise<Problem[]> {
    return Array.from(this.problems.values()).map(p => ({ ...p }));
  }

  async saveSubmission(submission: Submission): Promise<void> {
    this.submissions.set(submission.id, { ...submission });
  }

  async getSubmission(id: string): Promise<Submission | null> {
    return this.submissions.get(id) ? { ...this.submissions.get(id)! } : null;
  }

  async getSubmissions(): Promise<Submission[]> {
    return Array.from(this.submissions.values()).map(s => ({ ...s }));
  }

  async saveAttempt(attempt: Attempt): Promise<void> {
    this.attempts.set(attempt.id, { ...attempt });
  }

  async getAttempt(id: string): Promise<Attempt | null> {
    return this.attempts.get(id) ? { ...this.attempts.get(id)! } : null;
  }

  async getAttempts(): Promise<Attempt[]> {
    return Array.from(this.attempts.values())
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .map(a => ({ ...a }));
  }

  async saveEvaluation(evaluation: Evaluation): Promise<void> {
    this.evaluations.set(evaluation.id, { ...evaluation });
  }

  async getEvaluation(id: string): Promise<Evaluation | null> {
    return this.evaluations.get(id) ? { ...this.evaluations.get(id)! } : null;
  }

  async getEvaluationBySubmissionId(submissionId: string): Promise<Evaluation | null> {
    for (const ev of this.evaluations.values()) {
      if (ev.submissionId === submissionId) {
        return { ...ev };
      }
    }
    return null;
  }

  async getEvaluations(): Promise<Evaluation[]> {
    return Array.from(this.evaluations.values()).map(e => ({ ...e }));
  }
}
