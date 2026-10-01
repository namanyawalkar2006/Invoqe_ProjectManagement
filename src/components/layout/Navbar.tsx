import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useSocket } from '../../context/SocketContext.tsx';
import { PlanifyLogo } from '../common/PlanifyLogo.tsx';
import { LogOut, Users, ChevronDown, Check, FolderKanban } from 'lucide-react';

interface NavbarProps {
  currentView: 'dashboard' | 'workspace';
  projectTitle?: string;
  onNavigateDashboard: () => void;
  onOpenMembersModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  projectTitle,
  onNavigateDashboard,
  onOpenMembersModal,
}) => {
  const { user, logout, switchUser } = useAuth();
  const { isConnected } = useSocket();
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const demoUsers = [
    { email: 'sarah@planify.io', name: 'Sarah Chen', role: 'ADMIN', roleLabel: 'Project Admin' },
    { email: 'alex@planify.io', name: 'Alex Rivera', role: 'MEMBER', roleLabel: 'Senior Engineer' },
    { email: 'elena@planify.io', name: 'Elena Rostova', role: 'MEMBER', roleLabel: 'Product Designer' },
  ];

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-14 px-4 sm:px-6 bg-white/95 border-b border-slate-200 text-slate-800 select-none backdrop-blur-md shadow-xs">
      {/* Zone 1: Wordmark & Workspace context */}
      <div className="flex items-center gap-3">
        <button
          onClick={onNavigateDashboard}
          className="group text-left cursor-pointer focus:outline-none"
        >
          <PlanifyLogo size="md" showText={true} />
        </button>

        {projectTitle && currentView === 'workspace' && (
          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
            <span className="text-slate-300">/</span>
            <span className="max-w-[200px] md:max-w-xs truncate font-medium text-slate-700">
              {projectTitle}
            </span>
          </div>
        )}
      </div>

      {/* Zone 2: Navigation Links */}
      <nav className="flex items-center gap-1 sm:gap-2">
        <button
          onClick={onNavigateDashboard}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
            currentView === 'dashboard'
              ? 'bg-slate-100 text-slate-900 shadow-xs font-semibold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <FolderKanban className="w-3.5 h-3.5 text-slate-500" />
          <span>Workspaces</span>
        </button>

        {currentView === 'workspace' && onOpenMembersModal && (
          <button
            onClick={onOpenMembersModal}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <Users className="w-3.5 h-3.5 text-slate-500" />
            <span>Team & Roles</span>
          </button>
        )}

        {/* Live Socket Status */}
        <div
          title={isConnected ? 'Real-time WebSocket connected' : 'Connecting to real-time server...'}
          className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] text-slate-500"
        >
          <span
            className={`w-2 h-2 rounded-full transition-colors ${
              isConnected ? 'bg-emerald-500 shadow-xs shadow-emerald-500/50' : 'bg-amber-400'
            }`}
          />
          <span className="hidden md:inline tabular-nums">
            {isConnected ? 'Live' : 'Connecting'}
          </span>
        </div>
      </nav>

      {/* Zone 3: Account & Multi-user Switcher */}
      <div className="relative">
        <button
          onClick={() => setShowUserDropdown(!showUserDropdown)}
          className="flex items-center gap-2 py-1 px-2.5 rounded-lg hover:bg-slate-100 transition-colors text-left cursor-pointer border border-transparent hover:border-slate-200"
        >
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.name}
              className="w-7 h-7 rounded-full object-cover border border-slate-200"
            />
          ) : (
            <div className="w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-semibold flex items-center justify-center">
              {user?.name?.slice(0, 2).toUpperCase() || 'U'}
            </div>
          )}
          <div className="hidden sm:block leading-tight">
            <div className="text-xs font-semibold text-slate-900 max-w-[120px] truncate">{user?.name}</div>
            <div className="text-[10px] text-slate-500 flex items-center gap-1">
              <span>{user?.role}</span>
            </div>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
        </button>

        {showUserDropdown && (
          <div
            className="absolute right-0 mt-2 w-64 rounded-xl bg-white border border-slate-200 shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
            onMouseLeave={() => setShowUserDropdown(false)}
          >
            <div className="px-3.5 py-2 border-b border-slate-100">
              <p className="text-xs font-semibold text-slate-900">{user?.name}</p>
              <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
              <div className="mt-1 flex items-center gap-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-blue-600">
                  Global Role: {user?.role}
                </span>
              </div>
            </div>

            <div className="px-3.5 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Switch Test Account
            </div>

            {demoUsers.map((demo) => {
              const isCurrent = user?.email === demo.email;
              return (
                <button
                  key={demo.email}
                  onClick={async () => {
                    await switchUser(demo.email);
                    setShowUserDropdown(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2 text-xs text-left transition-colors cursor-pointer ${
                    isCurrent ? 'bg-slate-100 text-slate-900 font-semibold' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div>
                    <div className="font-medium text-slate-900">{demo.name}</div>
                    <div className="text-[10px] text-slate-400">{demo.roleLabel} · {demo.role}</div>
                  </div>
                  {isCurrent && <Check className="w-3.5 h-3.5 text-blue-600" />}
                </button>
              );
            })}

            <div className="border-t border-slate-100 mt-2 pt-1">
              <button
                onClick={() => {
                  setShowUserDropdown(false);
                  logout();
                }}
                className="w-full flex items-center gap-2 px-3.5 py-2 text-xs text-rose-600 hover:bg-rose-50 transition-colors text-left cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
