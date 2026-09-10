import { SubmissionContent, Submission, Attempt, Evaluation } from '../types/lld';
import { MOCK_EVALUATIONS } from '../data/mockData';

export interface SubmitResponse {
  success: boolean;
  submission: Submission;
  attempt: Attempt;
  evaluation?: Evaluation;
  error?: string;
  errorCode?: string;
}

export interface RetryResponse {
  success: boolean;
  evaluation?: Evaluation;
  attempt?: Attempt;
  error?: string;
  errorCode?: string;
}

export const apiClient = {
  async checkHealth(): Promise<{ status: string; geminiConfigured: boolean }> {
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // ignore
    }
    return { status: 'unknown', geminiConfigured: false };
  },

  async submitSolution(problemId: string, content: SubmissionContent): Promise<SubmitResponse> {
    const res = await fetch('/api/submissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ problemId, content }),
    });

    const data = await res.json();
    if (!res.ok && !data.submission) {
      throw new Error(data.error || `Server error: ${res.statusText}`);
    }
    return data;
  },

  async retryEvaluation(submissionId: string): Promise<RetryResponse> {
    const res = await fetch(`/api/evaluations/${submissionId}/retry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    const data = await res.json();
    return data;
  },

  async getEvaluation(idOrProblemId: string): Promise<Evaluation | null> {
    try {
      // First try by ID / submission ID
      let res = await fetch(`/api/evaluations/${idOrProblemId}`);
      if (res.ok) {
        return await res.json();
      }

      // Next try by problem ID
      res = await fetch(`/api/evaluations/by-problem/${idOrProblemId}`);
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // ignore network errors and fallback
    }

    // Fallback to mock evaluation if API unavailable
    const fallback = Object.values(MOCK_EVALUATIONS).find(e => e.submissionId.includes(idOrProblemId)) || Object.values(MOCK_EVALUATIONS)[0];
    return fallback ? (fallback as any) : null;
  },

  async getAttempts(): Promise<Attempt[]> {
    try {
      const res = await fetch('/api/attempts');
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // ignore
    }
    return [];
  },
};
