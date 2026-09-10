import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  FileText, 
  Layers, 
  GitBranch, 
  Settings, 
  Zap, 
  RotateCcw,
  FileCode2
} from 'lucide-react';
import { PROBLEMS } from '../data/mockData';
import { STARTER_TEMPLATES } from '../data/starterTemplates';
import { apiClient } from '../services/apiClient';

const DEFAULT_STARTER_POINTS = {
  requirements: '1. Core functional requirement: \n2. Scale / throughput assumption: \n3. Scope boundary / constraint: ',
  classes: '1. class \n2. interface \n3. enum ',
  responsibilities: '1. ClassName: \n2. ClassName: \n3. ClassName: ',
  relationships: '1. ClassA HAS-A ClassB (composition)\n2. ClassC IS-A ClassD (inheritance)\n3. ClassE USES ClassF (dependency)',
  decisions: '1. Architectural pattern: \n2. Design trade-off: \n3. Extensibility point: ',
  edgeCases: '1. Concurrency / race condition: \n2. Boundary / null condition: \n3. Failure / recovery handling: ',
};

const PracticeWorkspace = () => {
  const { problemId } = useParams();
  const navigate = useNavigate();
  const problem = PROBLEMS.find(p => p.id === problemId);

  const [content, setContent] = useState<typeof DEFAULT_STARTER_POINTS>({
    ...DEFAULT_STARTER_POINTS,
  });

  const [status, setStatus] = useState<'Idle' | 'Submitting' | 'Evaluating' | 'Completed' | 'Failed'>('Idle');
  const [currentSubmissionId, setCurrentSubmissionId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [validationWarning, setValidationWarning] = useState<string | null>(null);

  if (!problem) {
    return (
      <div className="h-screen flex items-center justify-center text-slate-800 text-base">
        Problem not found. <Link to="/problems" className="ml-2 text-slate-900 underline font-semibold">Go back to problems</Link>
      </div>
    );
  }

  const handleResetToStarterPoints = () => {
    setContent({ ...DEFAULT_STARTER_POINTS });
    setValidationWarning(null);
    setErrorMessage(null);
  };

  const handleLoadTemplate = () => {
    const template = STARTER_TEMPLATES[problem.id];
    if (template) {
      setContent({ ...template });
      setValidationWarning(null);
      setErrorMessage(null);
    }
  };


  const checkHasMeaningfulInput = (data: typeof DEFAULT_STARTER_POINTS) => {
    const skeletonPatterns = [
      /1\.\s*Core functional requirement:\s*/gi,
      /2\.\s*Scale \/ throughput assumption:\s*/gi,
      /3\.\s*Scope boundary \/ constraint:\s*/gi,
      /1\.\s*class\s*/gi,
      /2\.\s*interface\s*/gi,
      /3\.\s*enum\s*/gi,
      /\d+\.\s*ClassName:\s*/gi,
      /1\.\s*ClassA HAS-A ClassB \(composition\)\s*/gi,
      /2\.\s*ClassC IS-A ClassD \(inheritance\)\s*/gi,
      /3\.\s*ClassE USES ClassF \(dependency\)\s*/gi,
      /1\.\s*Architectural pattern:\s*/gi,
      /2\.\s*Design trade-off:\s*/gi,
      /3\.\s*Extensibility point:\s*/gi,
      /1\.\s*Concurrency \/ race condition:\s*/gi,
      /2\.\s*Boundary \/ null condition:\s*/gi,
      /3\.\s*Failure \/ recovery handling:\s*/gi,
    ];

    let userSpecifiedLength = 0;
    for (const val of Object.values(data)) {
      let clean = val || '';
      for (const pattern of skeletonPatterns) {
        clean = clean.replace(pattern, '');
      }
      userSpecifiedLength += clean.trim().length;
    }

    return userSpecifiedLength >= 20;
  };

  const handleSubmit = async () => {
    if (!checkHasMeaningfulInput(content)) {
      setValidationWarning(
        'Please enter your design details for the points (or click "Load Sample Template") before submitting. Define your classes, responsibilities, and architecture so the evaluation engine can analyze your solution.'
      );
      return;
    }

    setValidationWarning(null);
    setStatus('Submitting');
    setErrorMessage(null);

    try {
      const res = await apiClient.submitSolution(problem.id, content);
      if (res.submission) {
        setCurrentSubmissionId(res.submission.id);
      }

      if (res.success && res.evaluation) {
        setStatus('Completed');
      } else {
        setErrorMessage(res.error || 'Evaluation failed. Your design has been safely persisted.');
        setStatus('Failed');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to submit solution. Please check your network connection.');
      setStatus('Failed');
    }
  };

  const handleRetry = async () => {
    if (!currentSubmissionId) {
      return handleSubmit();
    }

    setStatus('Evaluating');
    setErrorMessage(null);

    try {
      const res = await apiClient.retryEvaluation(currentSubmissionId);
      if (res.success && res.evaluation) {
        setStatus('Completed');
      } else {
        setErrorMessage(res.error || 'Retry evaluation failed.');
        setStatus('Failed');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Retry failed.');
      setStatus('Failed');
    }
  };

  // Free-version skeleton guard: never allow "1. " / "2. " / "3. " prefixes to be deleted
  const handleContentChange = (sectionId: string, newValue: string) => {
    // If user select-all + delete -> restore skeleton for that section
    if (newValue.trim() === '') {
      setContent(prev => ({ ...prev, [sectionId]: (DEFAULT_STARTER_POINTS as any)[sectionId] }));
      return;
    }
    // If first line lost its numbered prefix (e.g. became "" then "2. ..."), restore "1. "
    // This fixes the bug shown in screenshot where line 1 becomes blank
    const lines = newValue.split('\n');
    // detect blank first line followed by "2. " -> user deleted "1. ..."
    if (lines.length >= 2 && lines[0].trim() === '' && /^\s*2\.\s/.test(lines[1])) {
      const defaultFirstLine = (DEFAULT_STARTER_POINTS as any)[sectionId].split('\n')[0] || '1. ';
      lines[0] = defaultFirstLine;
      newValue = lines.join('\n');
    } else if (lines[0] !== undefined && lines[0].trim() !== '' && !/^\s*\d+\.\s/.test(lines[0])) {
      // first line has content but no "1." prefix -> prepend "1. "
      lines[0] = `1. ${lines[0].trimStart()}`;
      newValue = lines.join('\n');
    }
    setContent(prev => ({ ...prev, [sectionId]: newValue }));
    if (validationWarning) setValidationWarning(null);
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLTextAreaElement>,
    sectionId: string
  ) => {
    // --- Protect numbered prefix from Backspace / Delete (free version, no extra deps) ---
    if (e.key === 'Backspace' || e.key === 'Delete') {
      const textarea = e.currentTarget;
      const { selectionStart, selectionEnd, value } = textarea;

      // If range selection would delete a prefix, block it and let handleContentChange restore
      // For single cursor, block if cursor is inside/adjacent to the prefix
      if (selectionStart === selectionEnd) {
        const isBackspace = e.key === 'Backspace';
        const cursorPos = selectionStart;
        const textBeforeCursor = value.substring(0, cursorPos);
        const lastNewline = textBeforeCursor.lastIndexOf('\n');
        const lineStart = lastNewline === -1 ? 0 : lastNewline + 1;
        const textAfterCursor = value.substring(cursorPos);
        const nextNewline = textAfterCursor.indexOf('\n');
        const lineEnd = nextNewline === -1 ? value.length : cursorPos + nextNewline;
        const currentLine = value.substring(lineStart, lineEnd);
        const prefixMatch = currentLine.match(/^(\s*)(\d+)\.\s*/);

        if (prefixMatch) {
          const prefixLen = prefixMatch[0].length;
          const cursorInLine = cursorPos - lineStart;

          // Backspace: if cursor is at or inside prefix (e.g. "1.| " or "1. |"), block
          if (isBackspace && cursorInLine <= prefixLen) {
            e.preventDefault();
            return;
          }
          // Delete: if cursor is before prefix end, block (deleting prefix char)
          if (!isBackspace && cursorInLine < prefixLen) {
            e.preventDefault();
            return;
          }
        }

        // Also block Backspace at column 0 that would merge lines and break numbering
        // e.g. cursor at start of "2. ..." pressing Backspace would join with "1. ..." and lose "1."
        if (isBackspace && cursorPos === lineStart && lineStart > 0) {
          e.preventDefault();
          return;
        }
      } else {
        // Range delete: if selection covers the "1." prefix of first line, prevent complete wipe
        const selectedText = value.substring(selectionStart, selectionEnd);
        // if user tries to delete the whole content, handleContentChange will restore, so allow
        // but if selection starts at 0 and includes "1.", we still want to keep it -> block
        if (selectionStart === 0 && /^\s*\d+\.\s/.test(value) && selectedText.length >= 2) {
          // allow deletion of content after prefix, but keep prefix - we handle via onChange restore
          // don't block entirely, let onChange fix
        }
      }
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      const textarea = e.currentTarget;
      const { selectionStart, selectionEnd, value } = textarea;

      if (selectionStart === selectionEnd) {
        const textBeforeCursor = value.substring(0, selectionStart);
        const lastNewlineIndex = textBeforeCursor.lastIndexOf('\n');
        const currentLineStart = lastNewlineIndex === -1 ? 0 : lastNewlineIndex + 1;
        const currentLine = textBeforeCursor.substring(currentLineStart);

        const numberedMatch = currentLine.match(/^(\s*)(\d+)\.\s*(.*)$/);
        const bulletMatch = currentLine.match(/^(\s*)([-*])\s*(.*)$/);

        if (numberedMatch) {
          e.preventDefault();
          const indent = numberedMatch[1];
          const currentNum = parseInt(numberedMatch[2], 10);
          const itemContent = numberedMatch[3];

          if (itemContent.trim() === '') {
            // Protect skeleton 1./2./3. from being removed via Enter on empty item
            // Only allow "exit list" for items beyond the initial 3 skeleton points (free version)
            if (currentNum <= 3) {
              e.preventDefault();
              return;
            }
            // User pressed Enter on an empty list item (e.g. "4. ") -> exit list by clearing the marker
            const newValue =
              value.substring(0, currentLineStart) +
              value.substring(selectionStart);
            setContent(prev => ({ ...prev, [sectionId]: newValue }));
            requestAnimationFrame(() => {
              textarea.selectionStart = currentLineStart;
              textarea.selectionEnd = currentLineStart;
            });
          } else {
            // User has typed content -> create next numbered line: "\n(num + 1). "
            const nextPrefix = `\n${indent}${currentNum + 1}. `;
            const textAfterCursor = value.substring(selectionEnd);
            const newValue = textBeforeCursor + nextPrefix + textAfterCursor;
            setContent(prev => ({ ...prev, [sectionId]: newValue }));

            const newCursorPos = selectionStart + nextPrefix.length;
            requestAnimationFrame(() => {
              textarea.selectionStart = newCursorPos;
              textarea.selectionEnd = newCursorPos;
            });
          }
          return;
        }

        if (bulletMatch) {
          e.preventDefault();
          const indent = bulletMatch[1];
          const bulletChar = bulletMatch[2];
          const itemContent = bulletMatch[3];

          if (itemContent.trim() === '') {
            const newValue =
              value.substring(0, currentLineStart) +
              value.substring(selectionStart);
            setContent(prev => ({ ...prev, [sectionId]: newValue }));
            requestAnimationFrame(() => {
              textarea.selectionStart = currentLineStart;
              textarea.selectionEnd = currentLineStart;
            });
          } else {
            const nextPrefix = `\n${indent}${bulletChar} `;
            const textAfterCursor = value.substring(selectionEnd);
            const newValue = textBeforeCursor + nextPrefix + textAfterCursor;
            setContent(prev => ({ ...prev, [sectionId]: newValue }));

            const newCursorPos = selectionStart + nextPrefix.length;
            requestAnimationFrame(() => {
              textarea.selectionStart = newCursorPos;
              textarea.selectionEnd = newCursorPos;
            });
          }
          return;
        }
      }
    }

    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = e.currentTarget;
      const { selectionStart, selectionEnd, value } = textarea;
      const newValue = value.substring(0, selectionStart) + '  ' + value.substring(selectionEnd);
      setContent(prev => ({ ...prev, [sectionId]: newValue }));
      requestAnimationFrame(() => {
        textarea.selectionStart = selectionStart + 2;
        textarea.selectionEnd = selectionStart + 2;
      });
    }
  };

  const sections = [
    { id: 'requirements', label: 'Requirements & Assumptions', icon: FileText },
    { id: 'classes', label: 'Core Classes & Interfaces', icon: Layers },
    { id: 'responsibilities', label: 'Class Responsibilities', icon: Settings },
    { id: 'relationships', label: 'Relationships (Composition / Inheritance)', icon: GitBranch },
    { id: 'decisions', label: 'Design Decisions & Trade-offs', icon: Zap },
    { id: 'edgeCases', label: 'Edge Cases & Concurrency', icon: AlertCircle },
  ] as const;

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Top Bar */}
      <header className="h-16 border-b border-slate-200/90 px-6 flex items-center justify-between bg-white/90 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/problems')}
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 hover:text-slate-900 transition-colors"
            title="Back to problems"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2.5">
            <h1 className="text-base font-bold text-slate-900">{problem.title}</h1>
            <span className="text-[11px] uppercase tracking-wider font-semibold px-2.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
              Workspace
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleResetToStarterPoints}
            className="btn-secondary py-2 px-3 text-sm flex items-center gap-1.5 text-slate-700 hover:text-slate-900 font-medium"
            title="Reset sections to basic numbered skeleton"
          >
            <RotateCcw className="w-4 h-4 text-slate-500" />
            Reset Skeleton
          </button>

          <button
            onClick={handleLoadTemplate}
            className="btn-secondary py-2 px-3.5 text-sm flex items-center gap-2 text-slate-700 hover:text-slate-900 font-medium"
            title="Load comprehensive sample architecture"
          >
            <FileCode2 className="w-4 h-4 text-slate-600" />
            Load Sample Template
          </button>

          {status === 'Failed' && currentSubmissionId ? (
            <button 
              onClick={handleRetry}
              className="btn-secondary py-2 px-4 text-sm flex items-center gap-2 border-rose-300 text-rose-700 bg-rose-50 hover:bg-rose-100 font-medium"
            >
              <RotateCcw className="w-4 h-4" />
              Retry Evaluation
            </button>
          ) : (
            <button 
              onClick={handleSubmit}
              disabled={status === 'Submitting' || status === 'Evaluating'}
              className="btn-primary py-2 px-5 text-sm flex items-center gap-2 font-semibold"
            >
              {status === 'Submitting' || status === 'Evaluating' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {status === 'Submitting' ? 'Submitting...' : 
               status === 'Evaluating' ? 'Evaluating Design...' : 
               status === 'Completed' ? 'Evaluated!' : 'Submit for Review'}
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel: Problem Description */}
        <div className="w-2/5 max-w-lg border-r border-slate-200/90 overflow-y-auto p-7 bg-white/70 backdrop-blur-sm">
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-3 tracking-tight">Problem Specification</h2>
              <p className="text-sm text-slate-700 leading-relaxed font-normal">
                {problem.description}
              </p>
            </div>

            <div>
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Functional Requirements</h3>
              <ul className="space-y-2.5">
                {problem.requirements.map((req, i) => (
                  <li key={i} className="flex gap-3 text-sm text-slate-800 leading-relaxed">
                    <CheckCircle2 className="w-4 h-4 text-slate-700 shrink-0 mt-0.5" />
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-4.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Design Context & Constraints</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                {problem.context}
              </p>
            </div>
          </div>
        </div>

        {/* Right Panel: Editor */}
        <div className="flex-1 overflow-y-auto bg-slate-50/40 p-8">
          <div className="max-w-4xl mx-auto space-y-7">
            {/* Validation Warning Alert */}
            {validationWarning && (
              <motion.div 
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between gap-4 text-amber-900 text-sm"
              >
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 shrink-0 text-amber-600" />
                  <div>
                    <p className="font-semibold text-amber-950">Design Input Required</p>
                    <p className="text-amber-800 text-xs mt-0.5 leading-relaxed">{validationWarning}</p>
                  </div>
                </div>
                <button
                  onClick={handleLoadTemplate}
                  className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 shrink-0 transition-colors"
                >
                  Load Sample Template
                </button>
              </motion.div>
            )}

            {/* Failure Alert Banner */}
            {status === 'Failed' && (
              <motion.div 
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-between gap-4 text-rose-900 text-sm"
              >
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
                  <div>
                    <p className="font-semibold text-rose-950">Evaluation Unsuccessful</p>
                    <p className="text-rose-800 text-xs mt-0.5 leading-relaxed">
                      {errorMessage || 'An error occurred during evaluation. Your design content is preserved.'}
                    </p>
                  </div>
                </div>
                {currentSubmissionId && (
                  <button
                    onClick={handleRetry}
                    className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-900 border border-rose-300 shrink-0 transition-colors"
                  >
                    Retry Review
                  </button>
                )}
              </motion.div>
            )}

            {sections.map((section) => (
              <div key={section.id} className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm font-bold text-slate-800 uppercase tracking-wider">
                    <section.icon className="w-4 h-4 text-slate-700" />
                    {section.label}
                  </label>
                  <span className="text-xs text-slate-400 font-medium">
                    Press Enter for next point &bull; Tab to indent
                  </span>
                </div>
                <textarea 
                  className="w-full min-h-[170px] bg-white border border-slate-300 rounded-xl p-4 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/15 focus:border-slate-500 transition-all resize-y font-mono text-[15px] leading-relaxed shadow-xs placeholder:text-slate-400"
                  placeholder={`Specify your ${section.label.toLowerCase()} here...`}
                  value={(content as any)[section.id]}
                  onKeyDown={(e) => handleKeyDown(e, section.id)}
                  onChange={(e) => handleContentChange(section.id, e.target.value)}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Submission Overlay */}
      {status === 'Completed' && (
        <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="card max-w-md w-full p-8 text-center shadow-xl bg-white border border-slate-200"
          >
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-200">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Evaluation Complete</h2>
            <p className="text-slate-600 text-sm mb-6 leading-relaxed">
              Your architectural design has been evaluated against system requirements and clean object-oriented principles.
            </p>
            <div className="flex gap-3 justify-center">
              <button 
                onClick={() => navigate(`/feedback/${problem.id}`)}
                className="btn-primary px-7 text-sm py-2.5 font-semibold"
              >
                View Architectural Report
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default PracticeWorkspace;
