import React, { useState, useMemo } from 'react';
import { Task, TaskStatus, Priority, ProjectMember } from '../../types/index.ts';
import { KanbanColumn } from './KanbanColumn.tsx';
import {
  Search,
  Filter,
  Plus,
  X,
  LayoutGrid,
  List,
  CheckCircle2,
  Circle,
  Calendar,
  MessageSquare,
  Download,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import { useToast } from '../../context/ToastContext.tsx';

interface KanbanBoardProps {
  tasks: Task[];
  members: ProjectMember[];
  onOpenTask: (task: Task) => void;
  onAddTask: (initialStatus?: TaskStatus) => void;
  onMoveTask: (taskId: string, targetStatus: TaskStatus) => void;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  tasks,
  members,
  onOpenTask,
  onAddTask,
  onMoveTask,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPriority, setSelectedPriority] = useState<string>('ALL');
  const [selectedAssignee, setSelectedAssignee] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');
  const { showToast } = useToast();

  // Quick complete toggle
  const handleToggleComplete = (task: Task) => {
    const nextStatus: TaskStatus = task.status === 'DONE' ? 'TODO' : 'DONE';
    onMoveTask(task.id, nextStatus);
    showToast(
      nextStatus === 'DONE' ? 'Task marked as Done' : 'Task reopened to To Do',
      'info'
    );
  };

  // Filter tasks based on search, priority, assignee (with duplicate ID safeguard)
  const filteredTasks = useMemo(() => {
    const seen = new Set<string>();
    return tasks.filter((task) => {
      if (!task || !task.id) return false;
      if (seen.has(task.id)) return false;
      seen.add(task.id);

      // Keyword search
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesTitle = task.title.toLowerCase().includes(query);
        const matchesDesc = task.description?.toLowerCase().includes(query);
        const matchesLabel = task.labels?.some((l) => l.toLowerCase().includes(query));
        if (!matchesTitle && !matchesDesc && !matchesLabel) return false;
      }

      // Priority
      if (selectedPriority !== 'ALL' && task.priority !== selectedPriority) {
        return false;
      }

      // Assignee
      if (selectedAssignee !== 'ALL') {
        if (selectedAssignee === 'UNASSIGNED') {
          if (task.assigneeId) return false;
        } else if (task.assigneeId !== selectedAssignee) {
          return false;
        }
      }

      return true;
    });
  }, [tasks, searchTerm, selectedPriority, selectedAssignee]);

  const todoTasks = useMemo(
    () => filteredTasks.filter((t) => t.status === 'TODO'),
    [filteredTasks]
  );
  const inProgressTasks = useMemo(
    () => filteredTasks.filter((t) => t.status === 'IN_PROGRESS'),
    [filteredTasks]
  );
  const doneTasks = useMemo(
    () => filteredTasks.filter((t) => t.status === 'DONE'),
    [filteredTasks]
  );

  const hasActiveFilters = searchTerm !== '' || selectedPriority !== 'ALL' || selectedAssignee !== 'ALL';

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedPriority('ALL');
    setSelectedAssignee('ALL');
  };

  // Export board tasks to CSV
  const handleExportCSV = () => {
    if (tasks.length === 0) {
      showToast('No tasks to export.', 'info');
      return;
    }
    const headers = ['ID', 'Title', 'Status', 'Priority', 'Assignee', 'Due Date'];
    const rows = tasks.map((t) => [
      t.id,
      `"${t.title.replace(/"/g, '""')}"`,
      t.status,
      t.priority,
      `"${t.assignee?.name || 'Unassigned'}"`,
      t.dueDate ? t.dueDate.split('T')[0] : 'None',
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `planify-tasks-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported tasks to CSV', 'success');
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Control Bar: Search & Filters & View Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-200 p-3 rounded-2xl select-none shadow-xs">
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
          {/* Search Input */}
          <div className="relative flex-1 max-w-xs">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter tasks..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Priority Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <span className="text-[11px] text-slate-400 hidden sm:inline">Priority:</span>
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="ALL">All Priorities</option>
              <option value="HIGH">High Priority</option>
              <option value="MEDIUM">Medium Priority</option>
              <option value="LOW">Low Priority</option>
            </select>
          </div>

          {/* Assignee Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <span className="text-[11px] text-slate-400 hidden sm:inline">Assignee:</span>
            <select
              value={selectedAssignee}
              onChange={(e) => setSelectedAssignee(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer max-w-[150px] truncate"
            >
              <option value="ALL">All Assignees</option>
              <option value="UNASSIGNED">Unassigned</option>
              {members.map((m) => (
                <option key={m.userId} value={m.userId}>
                  {m.user?.name || m.userId}
                </option>
              ))}
            </select>
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-700 px-2 py-1 rounded transition-colors cursor-pointer"
            >
              <Filter className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>

        {/* Right side controls: View Mode, Export, Add Task */}
        <div className="flex items-center gap-2">
          {/* View Mode Switcher */}
          <div className="flex p-0.5 bg-slate-100 border border-slate-200 rounded-lg">
            <button
              type="button"
              onClick={() => setViewMode('board')}
              title="Board view"
              className={`p-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                viewMode === 'board'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              title="Table view"
              className={`p-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Export CSV button */}
          <button
            type="button"
            onClick={handleExportCSV}
            title="Export CSV"
            className="p-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 rounded-lg transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          {/* New Task Button */}
          <button
            onClick={() => onAddTask('TODO')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Task</span>
          </button>
        </div>
      </div>

      {/* View Switch: Board vs List */}
      {viewMode === 'board' ? (
        /* 3 Responsive Columns */
        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 overflow-x-auto pb-4">
          <KanbanColumn
            status="TODO"
            title="To Do"
            tasks={todoTasks}
            onOpenTask={onOpenTask}
            onAddTaskToColumn={onAddTask}
            onMoveTask={onMoveTask}
            onToggleComplete={handleToggleComplete}
            onQuickMove={onMoveTask}
          />

          <KanbanColumn
            status="IN_PROGRESS"
            title="In Progress"
            tasks={inProgressTasks}
            onOpenTask={onOpenTask}
            onAddTaskToColumn={onAddTask}
            onMoveTask={onMoveTask}
            onToggleComplete={handleToggleComplete}
            onQuickMove={onMoveTask}
          />

          <KanbanColumn
            status="DONE"
            title="Done"
            tasks={doneTasks}
            onOpenTask={onOpenTask}
            onAddTaskToColumn={onAddTask}
            onMoveTask={onMoveTask}
            onToggleComplete={handleToggleComplete}
            onQuickMove={onMoveTask}
          />
        </div>
      ) : (
        /* List / Table View */
        <div className="flex-1 bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col shadow-xs">
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  <th className="py-3 pl-4 pr-2 w-8"></th>
                  <th className="py-3 px-3">Task Name</th>
                  <th className="py-3 px-3 w-32">Status</th>
                  <th className="py-3 px-3 w-28">Priority</th>
                  <th className="py-3 px-3 w-40">Assignee</th>
                  <th className="py-3 px-3 w-32">Due Date</th>
                  <th className="py-3 pr-4 pl-2 w-16 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredTasks.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-400">
                      No tasks matching your current filters.
                    </td>
                  </tr>
                ) : (
                  filteredTasks.map((t) => {
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
                        onClick={() => onOpenTask(t)}
                        className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                      >
                        <td className="py-3 pl-4 pr-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleComplete(t);
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

                        <td className="py-3 px-3 font-medium">
                          <div className="flex items-center gap-2">
                            <span
                              className={`${
                                isDone ? 'line-through text-slate-400' : 'text-slate-900 group-hover:text-blue-600'
                              }`}
                            >
                              {t.title}
                            </span>
                            {t.labels && t.labels.length > 0 && (
                              <div className="hidden sm:flex items-center gap-1.5 text-[10px] text-slate-400 font-medium">
                                {t.labels.slice(0, 2).map((l, i) => (
                                  <span key={i}>#{l.toLowerCase()}</span>
                                ))}
                              </div>
                            )}
                          </div>
                        </td>

                        <td className="py-3 px-3">
                          <select
                            value={t.status}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => {
                              e.stopPropagation();
                              onMoveTask(t.id, e.target.value as TaskStatus);
                            }}
                            className="text-[11px] py-1 px-2 bg-slate-50 border border-slate-200 rounded font-medium text-slate-700 cursor-pointer focus:outline-none"
                          >
                            <option value="TODO">To Do</option>
                            <option value="IN_PROGRESS">In Progress</option>
                            <option value="DONE">Done</option>
                          </select>
                        </td>

                        <td className="py-3 px-3">
                          <div className="flex items-center gap-1.5">
                            <span className={`w-1.5 h-1.5 rounded-full ${priorityDotColors}`} />
                            <span className={`text-[11px] font-semibold uppercase tracking-wider ${priorityTextColors}`}>
                              {t.priority}
                            </span>
                          </div>
                        </td>

                        <td className="py-3 px-3">
                          {t.assignee ? (
                            <div className="flex items-center gap-1.5">
                              {t.assignee.avatarUrl ? (
                                <img
                                  src={t.assignee.avatarUrl}
                                  alt={t.assignee.name}
                                  className="w-5 h-5 rounded-full object-cover border border-slate-200"
                                />
                              ) : (
                                <div className="w-5 h-5 rounded-full bg-blue-600 text-white text-[9px] font-bold flex items-center justify-center">
                                  {t.assignee.name.slice(0, 2).toUpperCase()}
                                </div>
                              )}
                              <span className="text-slate-700 truncate max-w-[100px]">{t.assignee.name}</span>
                            </div>
                          ) : (
                            <span className="text-slate-400">Unassigned</span>
                          )}
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
                          <div className="flex items-center justify-end gap-1.5 text-slate-400">
                            {t.commentCount !== undefined && t.commentCount > 0 && (
                              <div className="flex items-center gap-1 text-[11px]" title="Comments">
                                <MessageSquare className="w-3 h-3 text-slate-400" />
                                <span className="tabular-nums text-slate-500">{t.commentCount}</span>
                              </div>
                            )}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenTask(t);
                              }}
                              className="p-1 hover:text-slate-900"
                            >
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
