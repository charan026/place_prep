import { Menu, Bell, Search } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Navbar = ({ onToggleSidebar, sidebarCollapsed }) => {
  const { user } = useAuth();

  return (
    <header className={`fixed top-0 right-0 z-30 h-16 bg-surface-950/80 backdrop-blur-xl border-b border-surface-800/50 transition-all duration-300 ${sidebarCollapsed ? 'left-20' : 'left-64'}`}>
      <div className="flex items-center justify-between h-full px-6">
        {/* Left side */}
        <div className="flex items-center gap-4">
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-lg text-surface-400 hover:text-surface-200 hover:bg-surface-800 transition-colors"
          >
            <Menu size={20} />
          </button>

          {/* Search bar */}
          <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-surface-800/50 rounded-xl border border-surface-700/50 w-80">
            <Search size={16} className="text-surface-500" />
            <input
              type="text"
              placeholder="Search questions, companies..."
              className="bg-transparent text-sm text-surface-300 placeholder-surface-500 focus:outline-none w-full"
            />
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4">
          <button className="p-2 rounded-lg text-surface-400 hover:text-surface-200 hover:bg-surface-800 transition-colors relative">
            <Bell size={20} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary-500" />
          </button>

          <div className="flex items-center gap-3 pl-4 border-l border-surface-800">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-surface-200">{user?.name}</p>
              <p className="text-xs text-surface-500">{user?.target_role || 'Student'}</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-accent-violet flex items-center justify-center">
              <span className="text-sm font-bold text-white">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
