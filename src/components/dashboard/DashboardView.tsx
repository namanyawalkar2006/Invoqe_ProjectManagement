import React, { useState, useEffect } from 'react';
import { Project, User, Task } from '../../types/index.ts';
import { ProjectCard } from './ProjectCard.tsx';
import { PlanifyLogo } from '../common/PlanifyLogo.tsx';
import { api } from '../../services/api.ts';
import {
  FolderKanban,
  Plus,
  CheckCircle2,
  Clock,
  Users,
  Search,
  CheckSquare,
  AlertTriangle,
  ArrowRight,
  Circle,
} from 'lucide-react';
import { useToast } from '../../context/ToastContext.tsx';

interface DashboardViewProps {
  user: User | null;
  projects: Project[];
  loading: boolean;
  onOpenProject: (projectId: string) => void;
  onOpenNewProjectModal: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  user,
  projects,
  loading,
  onOpenProject,
  onOpenNewProjectModal,
}) => {
  const [activeTab, setActiveTab] = useState<'workspaces' | 'mytasks'>('workspaces');
  const [projectSearch, setProjectSearch] = useState('');
  const [myTasks, setMyTasks] = useState<Task[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const { showToast } = useToast();

  // Aggregate stats across all projects
  const totalTasks = projects.reduce((acc, p) => acc + (p.taskCount || 0), 0);
  const totalDone = projects.reduce((acc, p) => acc + (p.doneCount || 0), 0);
  const inProgress = Math.max(0, totalTasks - totalDone);

  // Filtered projects
  const filteredProjects = projects.filter((p) => {
    if (!projectSearch.trim()) return true;
    const q = projectSearch.toLowerCase();
    return p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q);
  });

  // Fetch my assigned tasks
  useEffect(() => {
    if (activeTab === 'mytasks') {
      setLoadingTasks(true);
      api
        .getMyTasks()
        .then(setMyTasks)
        .catch((err) => console.error('Failed to load my tasks:', err))
        .finally(() => setLoadingTasks(false));
    }
  }, [activeTab]);

  const handleToggleTaskStatus = async (task: Task) => {
    const nextStatus = task.status === 'DONE' ? 'TODO' : 'DONE';
    try {
      await api.updateTask(task.id, { status: nextStatus });
      setMyTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, status: nextStatus } : t))
      );
      showToast(
        nextStatus === 'DONE' ? 'Task completed' : 'Task reopened',
        'success'
      );
    } catch {
      showToast('Failed to update task', 'error');
    }
  };

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8 select-none">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 p-6 sm:p-7 rounded-2xl shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Welcome back, {user?.name?.split(' ')[0]}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-xl">
            You have access to <span className="text-slate-900 font-semibold">{projects.length} collaborative workspaces</span>. Coordinate tasks, manage team access, and sync in real-time.
          </p>
        </div>

        <button
          onClick={onOpenNewProjectModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Workspace</span>
        </button>
      </div>

      {/* KPI / Metric Counters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Workspaces</span>
            <FolderKanban className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 tabular-nums">{projects.length}</div>
          <div className="text-[11px] text-slate-400 mt-1">Active projects</div>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Tasks in Flight</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 tabular-nums">{inProgress}</div>
          <div className="text-[11px] text-slate-400 mt-1">Pending resolution</div>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Completed Deliverables</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 tabular-nums">{totalDone}</div>
          <div className="text-[11px] text-slate-400 mt-1">Across all boards</div>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Account Access</span>
            <Users className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 uppercase tracking-tight">{user?.role}</div>
          <div className="text-[11px] text-slate-400 mt-1">
            {user?.role === 'ADMIN' ? 'Administrator' : 'Standard Member'}
          </div>
        </div>
      </div>

      {/* View Switcher Tabs: Workspaces vs My Tasks */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 border border-slate-200 rounded-xl">
          <button
            onClick={() => setActiveTab('workspaces')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
              activeTab === 'workspaces'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FolderKanban className="w-3.5 h-3.5 text-slate-500" />
            <span>Workspaces ({projects.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('mytasks')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
              activeTab === 'mytasks'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5 text-slate-500" />
            <span>My Assigned Tasks</span>
          </button>
        </div>

        {activeTab === 'workspaces' && (
          <div className="relative w-48 sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={projectSearch}
              onChange={(e) => setProjectSearch(e.target.value)}
              placeholder="Search workspaces..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors shadow-xs"
            />
          </div>
        )}
      </div>

      {/* Tab 1: Workspaces Grid */}
      {activeTab === 'workspaces' && (
        <div className="space-y-4">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-48 bg-white border border-slate-200 rounded-2xl animate-pulse"
                />
              ))}
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl space-y-3 shadow-xs">
              <div className="flex justify-center mb-1">
                <PlanifyLogo size="lg" showText={false} />
              </div>
              <h3 className="text-sm font-bold text-slate-900">No workspaces found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {projectSearch
                  ? 'No workspaces matched your search keywords.'
                  : 'You are not a member of any workspaces yet. Create your first workspace to start organizing deliverables.'}
              </p>
              <button
                onClick={onOpenNewProjectModal}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Workspace</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredProjects.map((proj) => (
                <ProjectCard key={proj.id} project={proj} onOpen={onOpenProject} />
              ))}

              {/* Quick Create Card */}
              <div
                onClick={onOpenNewProjectModal}
                className="border-2 border-dashed border-slate-300 hover:border-blue-400 hover:bg-white bg-slate-50/50 rounded-2xl p-6 flex flex-col items-center justify-center text-center group cursor-pointer transition-all min-h-[220px]"
              >
                <div className="w-10 h-10 rounded-full bg-slate-100 group-hover:bg-blue-50 text-slate-400 group-hover:text-blue-600 flex items-center justify-center transition-colors mb-2">
                  <Plus className="w-5 h-5" />
                </div>
                <h4 className="text-xs font-bold text-slate-800 group-hover:text-blue-600">
                  Create Workspace
                </h4>
                <p className="text-[11px] text-slate-500 mt-1 max-w-[200px]">
                  Add a new project board with real-time sync & team roles.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: My Assigned Tasks */}
      {activeTab === 'mytasks' && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
          {loadingTasks ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              Loading your assigned tasks...
            </div>
          ) : myTasks.length === 0 ? (
            <div className="py-12 text-center text-slate-500 space-y-2">
              <CheckSquare className="w-8 h-8 mx-auto text-slate-300" />
              <p className="text-xs font-semibold text-slate-800">No tasks currently assigned to you</p>
              <p className="text-[11px] text-slate-400">
                You are all caught up! Tasks assigned to you across any workspace will appear here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    <th className="py-3 pl-4 pr-2 w-8"></th>
                    <th className="py-3 px-3">Task Name</th>
                    <th className="py-3 px-3 w-32">Status</th>
                    <th className="py-3 px-3 w-28">Priority</th>
                    <th className="py-3 px-3 w-36">Due Date</th>
                    <th className="py-3 pr-4 pl-2 w-24 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {myTasks.map((t) => {
                    const isDone = t.status === 'DONE';
                    const isOverdue = t.dueDate
                      ? new Date(t.dueDate) < new Date() && !isDone
                      : false;

                    const priorityDotColors = {
                      HIGH: 'bg-rose-500',
                      MEDIUM: 'bg-amber-500',
                      LOW: 'bg-slate-400',
                    }[t.priority];

                    const priorityTextColors = {
                      HIGH: 'text-rose-600',
                      MEDIUM: 'text-amber-600',
                      LOW: 'text-slate-500',
                    }[t.priority];

                    return (
                      <tr
                        key={t.id}
                        className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                        onClick={() => onOpenProject(t.projectId)}
                      >
                        <td className="py-3 pl-4 pr-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleTaskStatus(t);
                            }}
                            className="text-slate-400 hover:text-emerald-600 cursor-pointer"
                          >
                            {isDone ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 fill-emerald-100" />
                            ) : (
                              <Circle className="w-4 h-4 hover:border-emerald-500" />
                            )}
                          </button>
                        </td>

                        <td className="py-3 px-3">
                          <div className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                            <span className={isDone ? 'line-through text-slate-400' : ''}>
                              {t.title}
                            </span>
                          </div>
                          {t.description && (
                            <p className="text-[11px] text-slate-600 line-clamp-1 mt-0.5">
                              {t.description}
                            </p>
                          )}
                        </td>

                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 text-[11px] rounded bg-slate-100 border border-slate-200 font-medium text-slate-700">
                            {t.status.replace('_', ' ')}
                          </span>
                        </td>

                        <td className="py-3 px-3">
                          <div className="flex items-center gap-1.5">
                            <span className={`w-1.5 h-1.5 rounded-full ${priorityDotColors}`} />
                            <span className={`text-[11px] font-semibold uppercase tracking-wider ${priorityTextColors}`}>
                              {t.priority}
                            </span>
                          </div>
                        </td>

                        <td className="py-3 px-3 tabular-nums">
                          {t.dueDate ? (
                            <span
                              className={`flex items-center gap-1 text-[11px] ${
                                isOverdue ? 'text-rose-600 font-semibold' : 'text-slate-500'
                              }`}
                            >
                              {isOverdue && <AlertTriangle className="w-3 h-3 text-rose-500" />}
                              {new Date(t.dueDate).toLocaleDateString()}
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>

                        <td className="py-3 pr-4 pl-2 text-right">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenProject(t.projectId);
                            }}
                            className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-700 font-semibold cursor-pointer"
                          >
                            <span>Open Board</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
