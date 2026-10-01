import React, { useState, useEffect, useCallback } from 'react';
import { Project, Task, TaskStatus, Role } from '../../types/index.ts';
import { api } from '../../services/api.ts';
import { useSocket } from '../../context/SocketContext.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import { KanbanBoard } from '../kanban/KanbanBoard.tsx';
import { TaskModal } from '../modals/TaskModal.tsx';
import { NewTaskModal } from '../modals/NewTaskModal.tsx';
import { ProjectMembersModal } from '../modals/ProjectMembersModal.tsx';
import { ActivityFeed } from '../activity/ActivityFeed.tsx';
import {
  Users,
  Plus,
  ArrowLeft,
  Kanban,
  Activity as ActivityIcon,
  Shield,
  Circle,
} from 'lucide-react';

interface WorkspaceViewProps {
  projectId: string;
  onBackToDashboard: () => void;
  isMembersModalOpen?: boolean;
  onOpenMembersModal?: () => void;
  onCloseMembersModal?: () => void;
}

export const WorkspaceView: React.FC<WorkspaceViewProps> = ({
  projectId,
  onBackToDashboard,
  isMembersModalOpen: propMembersModalOpen,
  onOpenMembersModal,
  onCloseMembersModal,
}) => {
  const { user } = useAuth();
  const {
    joinProject,
    leaveProject,
    onTaskCreated,
    onTaskUpdated,
    onTaskMoved,
    onTaskDeleted,
    onMembersUpdated,
    activeUserIds,
  } = useSocket();

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals & Navigation state
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [newTaskInitialStatus, setNewTaskInitialStatus] = useState<TaskStatus>('TODO');
  const [localMembersModalOpen, setLocalMembersModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'board' | 'activity'>('board');

  const isMembersModalOpen =
    propMembersModalOpen !== undefined ? propMembersModalOpen : localMembersModalOpen;
  const openMembersModal = onOpenMembersModal || (() => setLocalMembersModalOpen(true));
  const closeMembersModal = onCloseMembersModal || (() => setLocalMembersModalOpen(false));

  // Load project details and tasks
  const loadProjectData = useCallback(async () => {
    try {
      const projData = await api.getProject(projectId);
      setProject(projData);

      // Deduplicate tasks defensively
      const rawTasks = projData.tasks || [];
      const seen = new Set<string>();
      const uniqueTasks: Task[] = [];
      for (const t of rawTasks) {
        if (t?.id && !seen.has(t.id)) {
          seen.add(t.id);
          uniqueTasks.push(t);
        }
      }
      setTasks(uniqueTasks);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load project.');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadProjectData();
    joinProject(projectId);

    return () => {
      leaveProject(projectId);
    };
  }, [projectId, loadProjectData, joinProject, leaveProject]);

  // Wire Socket.io real-time listeners with idempotent updates
  useEffect(() => {
    const unsubCreated = onTaskCreated((newTask) => {
      if (newTask.projectId === projectId) {
        setTasks((prev) => {
          if (prev.some((t) => t.id === newTask.id)) return prev;
          return [...prev, newTask];
        });
      }
    });

    const unsubUpdated = onTaskUpdated((updatedTask) => {
      if (updatedTask.projectId === projectId) {
        setTasks((prev) =>
          prev.map((t) => (t.id === updatedTask.id ? { ...t, ...updatedTask } : t))
        );
        setSelectedTask((curr) => (curr?.id === updatedTask.id ? { ...curr, ...updatedTask } : curr));
      }
    });

    const unsubMoved = onTaskMoved(({ taskId, status, task }) => {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId ? { ...t, ...task, status: status as TaskStatus } : t
        )
      );
      setSelectedTask((curr) =>
        curr?.id === taskId ? { ...curr, ...task, status: status as TaskStatus } : curr
      );
    });

    const unsubDeleted = onTaskDeleted(({ taskId, projectId: deletedInProject }) => {
      if (deletedInProject === projectId) {
        setTasks((prev) => prev.filter((t) => t.id !== taskId));
        if (selectedTask?.id === taskId) {
          setIsTaskModalOpen(false);
          setSelectedTask(null);
        }
      }
    });

    const unsubMembers = onMembersUpdated(({ projectId: updatedProjId }) => {
      if (updatedProjId === projectId) {
        loadProjectData();
      }
    });

    return () => {
      unsubCreated();
      unsubUpdated();
      unsubMoved();
      unsubDeleted();
      unsubMembers();
    };
  }, [
    projectId,
    onTaskCreated,
    onTaskUpdated,
    onTaskMoved,
    onTaskDeleted,
    onMembersUpdated,
    loadProjectData,
    selectedTask,
  ]);

  // Optimistic Move Handler for Drag & Drop
  const handleMoveTask = async (taskId: string, targetStatus: TaskStatus) => {
    const current = tasks.find((t) => t.id === taskId);
    if (!current || current.status === targetStatus) return;

    // Optimistically update local state immediately
    const prevTasks = [...tasks];
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: targetStatus } : t))
    );

    try {
      await api.updateTask(taskId, { status: targetStatus });
    } catch (err) {
      console.error('Failed to move task, rolling back:', err);
      // Rollback on failure
      setTasks(prevTasks);
    }
  };

  const handleOpenTask = (task: Task) => {
    setSelectedTask(task);
    setIsTaskModalOpen(true);
  };

  const handleAddTask = (initialStatus: TaskStatus = 'TODO') => {
    setNewTaskInitialStatus(initialStatus);
    setIsNewTaskModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
          <p className="text-xs text-slate-500 font-medium">Loading project workspace...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="flex-1 max-w-xl mx-auto p-8 text-center space-y-4">
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">
          {error || 'Project not found.'}
        </div>
        <button
          onClick={onBackToDashboard}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Dashboard</span>
        </button>
      </div>
    );
  }

  const myRole = project.myRole || (user?.role === 'ADMIN' ? 'ADMIN' : 'MEMBER');
  const members = project.members || [];

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-3.5rem)] overflow-hidden select-none">
      {/* Workspace Header */}
      <div className="px-4 sm:px-6 py-4 bg-white/95 border-b border-slate-200 backdrop-blur-md shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Title & Info */}
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <button
                onClick={onBackToDashboard}
                className="hover:text-slate-900 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Workspaces</span>
              </button>
              <span className="text-slate-300">/</span>
              <span className="flex items-center gap-1 text-blue-600 font-semibold">
                <Shield className="w-3 h-3" />
                <span>{myRole}</span>
              </span>
            </div>

            <div className="flex items-center gap-3">
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                {project.title}
              </h1>
            </div>

            {project.description && (
              <p className="text-xs text-slate-600 mt-0.5 line-clamp-1 max-w-2xl font-normal">
                {project.description}
              </p>
            )}
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Team Members Avatar Stack */}
            <button
              onClick={openMembersModal}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer group"
              title="Manage project members & roles"
            >
              <div className="flex items-center -space-x-1.5 overflow-hidden">
                {members.slice(0, 4).map((m) => {
                  const isOnline = activeUserIds.includes(m.userId);
                  return (
                    <div
                      key={m.id}
                      className="relative w-6 h-6 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-[10px] text-slate-700 font-bold overflow-hidden"
                      title={`${m.user?.name} (${m.role}) ${isOnline ? '• Online now' : ''}`}
                    >
                      {m.user?.avatarUrl ? (
                        <img src={m.user.avatarUrl} alt={m.user.name} className="w-full h-full object-cover" />
                      ) : (
                        <span>{m.user?.name?.slice(0, 2).toUpperCase() || 'M'}</span>
                      )}
                      {isOnline && (
                        <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 ring-1 ring-white" />
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="text-xs font-semibold text-slate-700 group-hover:text-slate-900 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-slate-400" />
                <span className="tabular-nums">{members.length}</span>
              </div>
            </button>

            {/* View Switcher Tabs */}
            <div className="flex p-0.5 bg-slate-100 border border-slate-200 rounded-lg">
              <button
                onClick={() => setActiveTab('board')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                  activeTab === 'board'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Kanban className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Task Board</span>
              </button>

              <button
                onClick={() => setActiveTab('activity')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                  activeTab === 'activity'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <ActivityIcon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Activity</span>
              </button>
            </div>

            {/* Add Task Button */}
            <button
              onClick={() => handleAddTask('TODO')}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Task</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Workspace Body */}
      <div className="flex-1 p-4 sm:p-6 overflow-hidden flex flex-col">
        {activeTab === 'board' ? (
          <KanbanBoard
            tasks={tasks}
            members={members}
            onOpenTask={handleOpenTask}
            onAddTask={handleAddTask}
            onMoveTask={handleMoveTask}
          />
        ) : (
          <div className="flex-1 max-w-4xl mx-auto w-full overflow-hidden">
            <ActivityFeed projectId={projectId} />
          </div>
        )}
      </div>

      {/* Task Modal for details, editing, comments */}
      <TaskModal
        task={selectedTask}
        members={members}
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setSelectedTask(null);
        }}
        onTaskUpdated={(updated) => {
          setTasks((prev) =>
            prev.map((t) => (t.id === updated.id ? { ...t, ...updated } : t))
          );
          setSelectedTask(updated);
        }}
        onTaskDeleted={(deletedId) => {
          setTasks((prev) => prev.filter((t) => t.id !== deletedId));
          setIsTaskModalOpen(false);
          setSelectedTask(null);
        }}
      />

      {/* New Task Modal */}
      <NewTaskModal
        projectId={projectId}
        initialStatus={newTaskInitialStatus}
        members={members}
        isOpen={isNewTaskModalOpen}
        onClose={() => setIsNewTaskModalOpen(false)}
        onTaskCreated={(newTask) => {
          setTasks((prev) => {
            if (prev.some((t) => t.id === newTask.id)) return prev;
            return [...prev, newTask];
          });
        }}
      />

      {/* Project Members Modal */}
      <ProjectMembersModal
        projectId={projectId}
        projectTitle={project.title}
        members={members}
        myRole={myRole as Role}
        isOpen={isMembersModalOpen}
        onClose={closeMembersModal}
        onMembersChanged={loadProjectData}
        onProjectDeleted={onBackToDashboard}
      />
    </div>
  );
};
