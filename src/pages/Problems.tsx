import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, BookOpen, ChevronRight } from 'lucide-react';
import { PROBLEMS } from '../data/mockData';
import { cn } from '../lib/utils';

const Problems = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<'All' | 'Easy' | 'Medium' | 'Hard'>('All');

  const filteredProblems = useMemo(() => {
    return PROBLEMS.filter(p => {
      const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            p.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesDifficulty = difficultyFilter === 'All' || p.difficulty === difficultyFilter;
      return matchesSearch && matchesDifficulty;
    });
  }, [searchQuery, difficultyFilter]);

  return (
    <div className="pt-24 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-slate-900 mb-2 tracking-tight">System Design Problems</h1>
        <p className="text-slate-600 text-sm">Select an architectural challenge to design class structures, contracts, and interaction lifecycles.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-3 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search problems, patterns, or tags..." 
            className="input-field w-full pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-1.5 bg-white p-1 rounded-xl border border-slate-200/80 shadow-xs">
          {['All', 'Easy', 'Medium', 'Hard'].map((diff) => (
            <button
              key={diff}
              onClick={() => setDifficultyFilter(diff as any)}
              className={cn(
                "px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all",
                difficultyFilter === diff 
                  ? "bg-slate-900 text-white font-semibold shadow-xs" 
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              )}
            >
              {diff}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3.5">
        {filteredProblems.length > 0 ? (
          filteredProblems.map((problem) => (
            <div 
              key={problem.id} 
              className="card p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 hover:border-slate-300 transition-all"
            >
              <div className="flex items-start gap-4 flex-1">
                <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200/80 flex items-center justify-center shrink-0 text-slate-700 mt-0.5">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <h3 className="text-base font-bold text-slate-900">
                      {problem.title}
                    </h3>
                    <span className={cn(
                      "text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded border",
                      problem.difficulty === 'Easy' ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                      problem.difficulty === 'Medium' ? "bg-amber-50 text-amber-700 border-amber-200" :
                      "bg-rose-50 text-rose-700 border-rose-200"
                    )}>
                      {problem.difficulty}
                    </span>
                  </div>
                  <p className="text-slate-600 text-xs leading-relaxed line-clamp-2 max-w-2xl">
                    {problem.description}
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {problem.tags.map(tag => (
                      <span key={tag} className="text-[11px] px-2 py-0.5 rounded bg-slate-100/90 text-slate-600 border border-slate-200/60 font-medium">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="shrink-0 w-full md:w-auto">
                <Link 
                  to={`/practice/${problem.id}`} 
                  className="btn-primary text-xs py-2 px-4 w-full md:w-auto flex items-center justify-center gap-1.5"
                >
                  Start Design <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))
        ) : (
          <div className="card text-center py-16">
            <div className="inline-flex w-12 h-12 items-center justify-center rounded-xl bg-slate-100 mb-3 text-slate-400">
              <Search className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">No matching problems found</h3>
            <p className="text-slate-500 text-xs">Try adjusting your search query or filter settings.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Problems;
