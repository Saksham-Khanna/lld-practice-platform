import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Layers, Target, GitBranch, CheckCircle2, BookOpen, ChevronRight } from 'lucide-react';
import { PROBLEMS } from '../data/mockData';
import { cn } from '../lib/utils';

const Home = () => {
  return (
    <div className="pt-16 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 lg:py-28">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/90 border border-slate-200 text-slate-700 text-xs font-medium mb-6 shadow-xs">
              <Layers className="w-3.5 h-3.5 text-slate-700" />
              <span>Low-Level Design Practice Platform</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 mb-6 leading-tight">
              Master Low-Level Design <br />
              <span className="text-slate-700 font-bold">Through Deliberate Practice</span>
            </h1>

            <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
              A structured workspace for engineers to design class hierarchies, isolate responsibilities,
              evaluate trade-offs, and receive comprehensive rubric-based architectural reviews.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link to="/problems" className="btn-primary text-base px-6 py-2.5 rounded-lg shadow-sm">
                Browse Problems <ArrowRight className="w-4 h-4 ml-1.5" />
              </Link>
              <Link to="/practice" className="btn-secondary text-base px-6 py-2.5 rounded-lg">
                View Practice History
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 border-y border-slate-200/60 bg-white/40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Designed for System Architects & Engineers</h2>
            <p className="text-slate-500 text-sm max-w-xl mx-auto">
              Focus on domain modeling, encapsulation, and clean boundaries without boilerplate distractions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: Target,
                title: 'Realistic Problem Scenarios',
                description: 'Real-world problem statements including Parking Lot, Elevator Dispatching, and Vending Machines with functional constraints.'
              },
              {
                icon: GitBranch,
                title: 'Structured Design Workspace',
                description: 'Decompose architectures systematically: Requirements, Classes, Responsibilities, Relationships, Trade-offs, and Concurrency.'
              },
              {
                icon: CheckCircle2,
                title: 'Rubric-Based Evaluation',
                description: 'Receive multi-dimensional scoring across Cohesion, Coupling, Extensibility, and Edge Cases with concrete suggestions.'
              }
            ].map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.08 }}
                className="card p-7 hover:border-slate-300 transition-all group"
              >
                <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center mb-5 text-slate-800 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                  <feature.icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2">{feature.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Problems Preview Section */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-10 gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-1">Practice Challenges</h2>
              <p className="text-slate-500 text-sm">Select a system design problem to begin an evaluation session.</p>
            </div>
            <Link to="/problems" className="text-sm font-semibold text-slate-900 hover:text-slate-700 flex items-center gap-1">
              View All Problems <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {PROBLEMS.slice(0, 4).map((problem) => (
              <div key={problem.id} className="card p-6 flex flex-col justify-between hover:border-slate-300 transition-all">
                <div>
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <span className={cn(
                      "text-[11px] font-semibold px-2 py-0.5 rounded border uppercase tracking-wider",
                      problem.difficulty === 'Easy' ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                      problem.difficulty === 'Medium' ? "bg-amber-50 text-amber-700 border-amber-200" :
                      "bg-rose-50 text-rose-700 border-rose-200"
                    )}>
                      {problem.difficulty}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      {problem.requirements.length} Requirements
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 mb-2">{problem.title}</h3>
                  <p className="text-slate-600 text-sm mb-5 leading-relaxed line-clamp-2">
                    {problem.description}
                  </p>

                  <div className="flex flex-wrap gap-1.5 mb-6">
                    {problem.tags.map((tag) => (
                      <span key={tag} className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200/80">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Domain Architecture</span>
                  </div>
                  <Link
                    to={`/practice/${problem.id}`}
                    className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1"
                  >
                    Open Workspace <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
