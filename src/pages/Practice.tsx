import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Calendar, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  ExternalLink, 
  ArrowRight,
  Layers,
  RotateCcw,
  Loader2
} from 'lucide-react';
import { PROBLEMS, MOCK_ATTEMPTS } from '../data/mockData';
import { apiClient } from '../services/apiClient';
import { Attempt } from '../types/lld';
import { cn } from '../lib/utils';

const Practice = () => {
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    apiClient.getAttempts().then((data) => {
      if (isMounted) {
        if (data && data.length > 0) {
          setAttempts(data);
        } else {
          setAttempts(MOCK_ATTEMPTS as any);
        }
        setLoading(false);
      }
    }).catch(() => {
      if (isMounted) {
        setAttempts(MOCK_ATTEMPTS as any);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="pt-24 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-slate-900 mb-2 tracking-tight">Practice History</h1>
        <p className="text-slate-600 text-sm">Review previous design submissions, rubric scores, and architectural iterations.</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {loading ? (
          <div className="card p-12 text-center flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-slate-700" />
            <p className="text-slate-500 text-xs font-medium">Loading practice sessions...</p>
          </div>
        ) : attempts.length > 0 ? (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-6 py-3.5 text-[11px] uppercase tracking-wider font-bold text-slate-500">Problem</th>
                    <th className="px-6 py-3.5 text-[11px] uppercase tracking-wider font-bold text-slate-500">Date</th>
                    <th className="px-6 py-3.5 text-[11px] uppercase tracking-wider font-bold text-slate-500">Status</th>
                    <th className="px-6 py-3.5 text-[11px] uppercase tracking-wider font-bold text-slate-500">Score</th>
                    <th className="px-6 py-3.5 text-[11px] uppercase tracking-wider font-bold text-slate-500 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white/70">
                  {attempts.map((attempt) => {
                    const problem = PROBLEMS.find(p => p.id === attempt.problemId);
                    return (
                      <tr key={attempt.id} className="hover:bg-slate-50/70 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700">
                              <Layers className="w-4 h-4" />
                            </div>
                            <span className="text-slate-900 font-semibold text-sm">{problem?.title || attempt.problemId}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                            <Calendar className="w-3.5 h-3.5" />
                            {attempt.date}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className={cn(
                            "flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded border w-fit",
                            attempt.status === 'Completed' ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                            attempt.status === 'Evaluating' ? "bg-slate-100 text-slate-700 border-slate-200" :
                            attempt.status === 'In Progress' || attempt.status === 'Submitted' ? "bg-sky-50 text-sky-700 border-sky-200" :
                            "bg-rose-50 text-rose-700 border-rose-200"
                          )}>
                            {attempt.status === 'Completed' && <CheckCircle2 className="w-3 h-3" />}
                            {attempt.status === 'Evaluating' && <Loader2 className="w-3 h-3 animate-spin" />}
                            {(attempt.status === 'In Progress' || attempt.status === 'Submitted') && <Clock className="w-3 h-3" />}
                            {attempt.status === 'Failed' && <XCircle className="w-3 h-3" />}
                            {attempt.status}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {typeof attempt.score === 'number' ? (
                            <span className="text-slate-900 font-mono font-bold text-sm">{attempt.score}/100</span>
                          ) : (
                            <span className="text-slate-400 text-sm">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-3">
                            {attempt.status === 'Failed' ? (
                              <Link 
                                to={`/practice/${attempt.problemId}`} 
                                className="text-rose-600 hover:text-rose-700 text-xs font-semibold flex items-center gap-1 transition-colors"
                              >
                                Retry Design <RotateCcw className="w-3 h-3" />
                              </Link>
                            ) : attempt.status === 'In Progress' || attempt.status === 'Submitted' || attempt.status === 'Evaluating' ? (
                              <Link 
                                to={`/practice/${attempt.problemId}`} 
                                className="text-slate-900 hover:text-slate-700 text-xs font-semibold flex items-center gap-1 transition-colors"
                              >
                                Open Workspace <ArrowRight className="w-3 h-3" />
                              </Link>
                            ) : attempt.evaluationId ? (
                              <Link 
                                to={`/feedback/${attempt.problemId}${attempt.submissionId ? `?submissionId=${attempt.submissionId}` : ''}`} 
                                className="text-slate-700 hover:text-slate-900 text-xs font-semibold flex items-center gap-1 transition-colors"
                              >
                                View Report <ExternalLink className="w-3 h-3" />
                              </Link>
                            ) : (
                              <span className="text-slate-400 text-xs">No actions</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="text-center py-16 card">
            <div className="inline-flex w-12 h-12 items-center justify-center rounded-xl bg-slate-100 mb-3 text-slate-500">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">No practice records yet</h3>
            <p className="text-slate-500 text-xs mb-6">Start your first system design challenge to see it recorded here.</p>
            <Link to="/problems" className="btn-primary text-xs py-2 px-4">
              Explore Problems
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Practice;
