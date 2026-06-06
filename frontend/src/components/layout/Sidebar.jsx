import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Code2, FileText, MessageSquare,
  Building2, BarChart3, User, LogOut, Sparkles
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/dsa-tracker', icon: Code2, label: 'DSA Tracker' },
  { to: '/resume', icon: FileText, label: 'Resume Analyzer' },
  { to: '/interview', icon: MessageSquare, label: 'Mock Interview' },
  { to: '/experiences', icon: Building2, label: 'Experiences' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
];

const Sidebar = ({ collapsed, onToggle }) => {
  const { user, logout } = useAuth();

  return (
    <aside className={`fixed left-0 top-0 h-full bg-surface-900/80 backdrop-blur-xl border-r border-surface-800/50 z-40 transition-all duration-300 flex flex-col ${collapsed ? 'w-20' : 'w-64'}`}>
      {/* Logo */}
      <div className="p-6 flex items-center gap-3 border-b border-surface-800/50">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-cyan flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <div className="animate-fade-in">
            <h1 className="text-lg font-bold gradient-text">PlacePrep</h1>
            <p className="text-xs text-surface-500">AI-Powered</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group
              ${isActive
                ? 'bg-primary-500/15 text-primary-400 border border-primary-500/25'
                : 'text-surface-400 hover:text-surface-200 hover:bg-surface-800/50 border border-transparent'
              }`
            }
          >
            <Icon size={20} className="flex-shrink-0" />
            {!collapsed && <span className="text-sm font-medium animate-fade-in">{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User section */}
      <div className="p-4 border-t border-surface-800/50">
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'} mb-3`}>
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-accent-violet flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-bold text-white">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </span>
          </div>
          {!collapsed && (
            <div className="animate-fade-in overflow-hidden">
              <p className="text-sm font-medium text-surface-200 truncate">{user?.name}</p>
              <p className="text-xs text-surface-500 truncate">{user?.email}</p>
            </div>
          )}
        </div>
        <button
          onClick={logout}
          className={`flex items-center gap-2 w-full px-3 py-2 rounded-lg text-surface-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all ${collapsed ? 'justify-center' : ''}`}
        >
          <LogOut size={18} />
          {!collapsed && <span className="text-sm">Logout</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
