import { Link, useLocation } from 'react-router-dom';
import { Layers, BookOpen, Clock, ArrowRight } from 'lucide-react';
import { cn } from '../../lib/utils';

const Navbar = () => {
  const location = useLocation();

  const navLinks = [
    { name: 'Problems', path: '/problems', icon: BookOpen },
    { name: 'Practice History', path: '/practice', icon: Clock },
  ];

  return (
    <nav className="fixed top-0 w-full z-50 border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white shadow-xs group-hover:bg-slate-800 transition-colors">
                <Layers className="w-4 h-4" />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-bold tracking-tight text-slate-900">Arena</span>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                  LLD
                </span>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-1">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.path;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={cn(
                      "flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors",
                      isActive 
                        ? "text-slate-900 bg-slate-100/90 font-semibold" 
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                    )}
                  >
                    <link.icon className="w-4 h-4 text-slate-500" />
                    {link.name}
                  </Link>
                );
              })}
            </div>

            <Link to="/problems" className="btn-primary text-xs py-1.5 px-3.5 flex items-center gap-1.5">
              Start Practicing <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
