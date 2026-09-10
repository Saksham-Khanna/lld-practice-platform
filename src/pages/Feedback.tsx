import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  RotateCcw, 
  CheckCircle2, 
  AlertCircle, 
  ChevronRight,
  Loader2,
  Award,
  Sliders
} from 'lucide-react';
import { PROBLEMS } from '../data/mockData';
import { apiClient } from '../services/apiClient';
import { Evaluation } from '../types/lld';
import { cn } from '../lib/utils';

interface RubricItemConfig {
  key: string;
  label: string;
  fallbackKey?: string;
}

const Feedback = () => {
  const { problemId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const problem = PROBLEMS.find(p => p.id === problemId);
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const submissionId = searchParams.get('submissionId');
    const targetId = submissionId || problemId || '';

    apiClient.getEvaluation(targetId).then((data) => {
      if (isMounted) {
        setEvaluation(data);
        setLoading(false);
      }
    }).catch(() => {
      if (isMounted) {
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [problemId, searchParams]);

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center text-slate-800 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-slate-700" />
        <p className="text-slate-600 text-sm font-medium">Loading evaluation scorecard...</p>
      </div>
    );
  }

  if (!problem || !evaluation) {
    return (
      <div className="h-screen flex items-center justify-center text-slate-800">
        Evaluation not found. <Link to="/problems" className="ml-2 text-slate-900 underline font-semibold">Return to problems</Link>
      </div>
    );
  }

  const rubricItems: RubricItemConfig[] = [
    { key: 'requirementUnderstanding', label: 'Requirement Understanding' },
    { key: 'classResponsibilities', label: 'Class Responsibilities' },
    { key: 'encapsulationInterfaces', label: 'Encapsulation & Interfaces' },
    { key: 'relationshipsCoupling', label: 'Relationships & Coupling', fallbackKey: 'couplingCohesion' },
    { key: 'extensibilityTradeoffs', label: 'Extensibility & Trade-offs', fallbackKey: 'extensibility' },
    { key: 'edgeCasesTestability', label: 'Edge Cases & Testability' },
    { key: 'explanationQuality', label: 'Quality of Explanation' },
  ];

  return (
    <div className="pt-24 pb-20 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between mb-8">
        <button 
          onClick={() => navigate('/problems')}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Problems
        </button>
        <button 
          onClick={() => navigate(`/practice/${problemId}`)}
          className="btn-secondary py-2 px-4 text-sm flex items-center gap-2 font-medium"
        >
          <RotateCcw className="w-4 h-4" />
          Iterate / Redesign
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-7">
        {/* Summary Column */}
        <div className="lg:col-span-1 space-y-6">
          <div className="card p-7 text-center">
            <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto mb-3 text-slate-800">
              <Award className="w-6 h-6" />
            </div>
            <h2 className="text-slate-500 text-xs uppercase tracking-wider font-bold mb-1">Architecture Score</h2>
            <div className="text-6xl font-black text-slate-900 mb-3 tracking-tight">
              {evaluation.overallScore}<span className="text-2xl text-slate-400 font-normal">/100</span>
            </div>
            <div className={cn(
              "inline-block px-3.5 py-1 rounded-full text-xs font-semibold border",
              evaluation.overallScore >= 80 ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
              evaluation.overallScore >= 60 ? "bg-sky-50 text-sky-700 border-sky-200" :
              "bg-amber-50 text-amber-700 border-amber-200"
            )}>
              {evaluation.overallScore >= 80 ? 'Exemplary Architecture' : evaluation.overallScore >= 60 ? 'Proficient Design' : 'Needs Structural Iteration'}
            </div>
          </div>

          <div className="card p-6">
            <h3 className="text-slate-900 font-bold text-base mb-5 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-slate-700" />
              Rubric Assessment
            </h3>
            <div className="space-y-4">
              {rubricItems.map(item => {
                const rawScore = (evaluation.rubricScores as any)[item.key];
                const fallbackScore = item.fallbackKey ? (evaluation.rubricScores as any)[item.fallbackKey] : undefined;
                const score = typeof rawScore === 'number' ? rawScore : (typeof fallbackScore === 'number' ? fallbackScore : 70);

                return (
                  <div key={item.key} className="space-y-1.5">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-700 font-medium">{item.label}</span>
                      <span className="text-slate-900 font-mono font-bold">{score}/100</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${score}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className={cn(
                          "h-full rounded-full",
                          score >= 80 ? "bg-emerald-600" : score >= 60 ? "bg-slate-800" : "bg-amber-500"
                        )}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Detailed Feedback Column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-2xl font-bold text-slate-900">Architectural Evaluation</h2>
            <span className="text-xs px-3 py-1 rounded bg-slate-100 text-slate-700 border border-slate-200 font-semibold uppercase tracking-wider">
              Scorecard
            </span>
          </div>

          {/* Strengths section */}
          {evaluation.strengths && evaluation.strengths.length > 0 && (
            <div className="card p-6 bg-emerald-50/40 border border-emerald-200/80">
              <h3 className="text-xs font-bold text-emerald-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                Key Architectural Strengths
              </h3>
              <ul className="space-y-2">
                {evaluation.strengths.map((str, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-sm text-slate-800 leading-relaxed">
                    <span className="text-emerald-600 font-bold">•</span>
                    <span>{str}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Feedback items */}
          {evaluation.feedback.length > 0 ? (
            <div className="space-y-4">
              {evaluation.feedback.map((item, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.06 }}
                  className="card p-6 border-l-4 border-l-slate-900"
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div className="p-2 rounded-lg bg-slate-100 text-slate-700 shrink-0 mt-0.5">
                      <AlertCircle className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <h4 className="text-slate-900 font-bold text-base">{item.concern}</h4>
                        {item.criterion && (
                          <span className="text-[11px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                            {item.criterion}
                          </span>
                        )}
                      </div>
                      <p className="text-slate-700 text-sm leading-relaxed">
                        <span className="text-slate-900 font-semibold">Evidence: </span>
                        {item.evidence}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                    <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                      Recommended Refactoring
                    </h5>
                    <p className="text-sm text-slate-700 leading-relaxed">
                      {item.suggestion}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="card p-12 text-center">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-3" />
              <h3 className="text-xl font-bold text-slate-900 mb-1">Pristine Architecture!</h3>
              <p className="text-slate-600 text-sm">No significant design defects or coupling violations were identified.</p>
            </div>
          )}

          <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-slate-900 font-bold text-base mb-1">Ready for the next challenge?</h3>
              <p className="text-slate-600 text-sm">Explore more problems or iterate on this design to achieve higher cohesion.</p>
            </div>
            <button 
              onClick={() => navigate('/problems')}
              className="btn-primary text-sm py-2.5 px-5 flex items-center gap-2 shrink-0 font-semibold"
            >
              Browse Problems <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Feedback;
