import React, { useState, useEffect } from 'react';
import { Task, Comment, ProjectMember, TaskStatus, Priority, ChecklistItem } from '../../types/index.ts';
import { api } from '../../services/api.ts';
import { useSocket } from '../../context/SocketContext.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import { useToast } from '../../context/ToastContext.tsx';
import {
  X,
  Trash2,
  Send,
  MessageSquare,
  Clock,
  Calendar,
  User as UserIcon,
  CheckCircle2,
  AlertCircle,
  CheckSquare,
  Plus,
  Tag,
  Check,
} from 'lucide-react';

interface TaskModalProps {
  task: Task | null;
  members: ProjectMember[];
  isOpen: boolean;
  onClose: () => void;
  onTaskUpdated: (task: Task) => void;
  onTaskDeleted: (taskId: string) => void;
}

const AVAILABLE_LABELS = ['Frontend', 'Backend', 'API', 'Bug', 'Feature', 'DevOps', 'Design'];

export const TaskModal: React.FC<TaskModalProps> = ({
  task,
  members,
  isOpen,
  onClose,
  onTaskUpdated,
  onTaskDeleted,
}) => {
  const { user } = useAuth();
  const { onCommentCreated } = useSocket();
  const { showToast } = useToast();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>('TODO');
  const [priority, setPriority] = useState<Priority>('MEDIUM');
  const [assigneeId, setAssigneeId] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>('');
  const [labels, setLabels] = useState<string[]>([]);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [newChecklistText, setNewChecklistText] = useState('');

  const [comments, setComments] = useState<(Comment & { author: any })[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);

  const [activeTab, setActiveTab] = useState<'details' | 'checklist' | 'comments'>('details');
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize form when task changes
  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setStatus(task.status);
      setPriority(task.priority);
      setAssigneeId(task.assigneeId || '');
      setDueDate(task.dueDate ? task.dueDate.split('T')[0] : '');
      setLabels(task.labels || []);
      setChecklist(task.checklist || []);
      setConfirmDelete(false);
      setError(null);

      // Fetch comments
      loadComments(task.id);
    }
  }, [task]);

  const loadComments = async (taskId: string) => {
    setLoadingComments(true);
    try {
      const data = await api.getComments(taskId);
      setComments(data);
    } catch (err: any) {
      console.error('Failed to load comments:', err);
    } finally {
      setLoadingComments(false);
    }
  };

  // Real-time socket comment listener
  useEffect(() => {
    if (!task) return;
    const unsubscribe = onCommentCreated((comment) => {
      if (comment.taskId === task.id) {
        setComments((prev) => {
          if (prev.some((c) => c.id === comment.id)) return prev;
          return [...prev, comment as any];
        });
      }
    });
    return () => unsubscribe();
  }, [task, onCommentCreated]);

  if (!isOpen || !task) return null;

  const handleSaveDetails = async (overrides?: Partial<Task>) => {
    if (!title.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const payload: Partial<Task> = {
        title: title.trim(),
        description: description.trim(),
        status,
        priority,
        assigneeId: assigneeId || null,
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
        labels,
        checklist,
        ...overrides,
      };

      const updated = await api.updateTask(task.id, payload);
      onTaskUpdated(updated);
    } catch (err: any) {
      setError(err.message || 'Failed to save changes.');
    } finally {
      setSaving(false);
    }
  };

  // Checklist actions
  const handleAddChecklistItem = () => {
    if (!newChecklistText.trim()) return;
    const newItem: ChecklistItem = {
      id: `chk-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: newChecklistText.trim(),
      completed: false,
    };
    const updated = [...checklist, newItem];
    setChecklist(updated);
    setNewChecklistText('');
    handleSaveDetails({ checklist: updated });
    showToast('Subtask added', 'info');
  };

  const handleToggleChecklistItem = (itemId: string) => {
    const updated = checklist.map((item) =>
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );
    setChecklist(updated);
    handleSaveDetails({ checklist: updated });
  };

  const handleRemoveChecklistItem = (itemId: string) => {
    const updated = checklist.filter((item) => item.id !== itemId);
    setChecklist(updated);
    handleSaveDetails({ checklist: updated });
  };

  // Labels toggle
  const handleToggleLabel = (label: string) => {
    const nextLabels = labels.includes(label)
      ? labels.filter((l) => l !== label)
      : [...labels, label];
    setLabels(nextLabels);
    handleSaveDetails({ labels: nextLabels });
  };

  // Quick Date Setters
  const setQuickDate = (daysFromNow: number) => {
    const target = new Date();
    target.setDate(target.getDate() + daysFromNow);
    const dateStr = target.toISOString().split('T')[0];
    setDueDate(dateStr);
    handleSaveDetails({ dueDate: new Date(dateStr).toISOString() });
    showToast(`Due date updated to ${dateStr}`, 'info');
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || submittingComment) return;

    setSubmittingComment(true);
    try {
      const comment = await api.createComment(task.id, newComment.trim());
      setComments((prev) => {
        if (prev.some((c) => c.id === comment.id)) return prev;
        return [...prev, comment];
      });
      setNewComment('');
      onTaskUpdated({
        ...task,
        commentCount: (task.commentCount || 0) + 1,
      });
      showToast('Comment posted', 'success');
    } catch (err: any) {
      setError(err.message || 'Failed to post comment.');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteTask = async () => {
    try {
      await api.deleteTask(task.id);
      onTaskDeleted(task.id);
      showToast('Task permanently deleted', 'info');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to delete task.');
    }
  };

  const completedChecklistCount = checklist.filter((c) => c.completed).length;
  const checklistPercentage =
    checklist.length > 0
      ? Math.round((completedChecklistCount / checklist.length) * 100)
      : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs select-none">
      <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50/80">
          <div className="flex items-center gap-2 text-xs">
            <span
              className={`w-2 h-2 rounded-full ${
                priority === 'HIGH'
                  ? 'bg-rose-500'
                  : priority === 'MEDIUM'
                  ? 'bg-amber-500'
                  : 'bg-slate-400'
              }`}
            />
            <span
              className={`text-[11px] font-bold uppercase tracking-wider ${
                priority === 'HIGH'
                  ? 'text-rose-600'
                  : priority === 'MEDIUM'
                  ? 'text-amber-600'
                  : 'text-slate-500'
              }`}
            >
              {priority} Priority
            </span>
            <span className="text-slate-300">·</span>
            <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
              {status.replace('_', ' ')}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {confirmDelete ? (
              <div className="flex items-center gap-1.5 bg-rose-50 border border-rose-200 px-2 py-1 rounded-md">
                <span className="text-[11px] text-rose-700 font-semibold">Delete?</span>
                <button
                  onClick={handleDeleteTask}
                  className="px-2 py-0.5 text-[11px] font-semibold bg-rose-600 text-white rounded hover:bg-rose-700 cursor-pointer"
                >
                  Yes, Delete
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="px-1.5 py-0.5 text-[11px] text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                title="Delete task"
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {error && (
          <div className="mx-5 mt-3 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 px-5 pt-2 bg-white">
          <button
            onClick={() => setActiveTab('details')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'details'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Details & Fields
          </button>
          <button
            onClick={() => setActiveTab('checklist')}
            className={`flex items-center gap-1.5 pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'checklist'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span>Subtasks</span>
            {checklist.length > 0 && (
              <span className="tabular-nums ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 text-slate-700 font-semibold">
                {completedChecklistCount}/{checklist.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('comments')}
            className={`flex items-center gap-1.5 pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'comments'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Comments</span>
            <span className="tabular-nums ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 text-slate-700 font-semibold">
              {comments.length}
            </span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {activeTab === 'details' && (
            <div className="space-y-4">
              {/* Title Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={() => handleSaveDetails()}
                  className="w-full px-3 py-2 text-sm font-semibold bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                />
              </div>

              {/* Description Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  onBlur={() => handleSaveDetails()}
                  placeholder="Detail the technical specifications, acceptance criteria, or deliverables..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white resize-none leading-relaxed transition-colors"
                />
              </div>

              {/* Labels / Tags */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-slate-500" />
                  <span>Labels & Category Tags</span>
                </label>
                <div className="flex flex-wrap items-center gap-1.5">
                  {AVAILABLE_LABELS.map((lbl) => {
                    const isSelected = labels.includes(lbl);
                    return (
                      <button
                        type="button"
                        key={lbl}
                        onClick={() => handleToggleLabel(lbl)}
                        className={`px-2.5 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer border ${
                          isSelected
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                        }`}
                      >
                        {lbl} {isSelected && '✓'}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Properties Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                {/* Status Selector */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-slate-500" />
                    <span>Status</span>
                  </label>
                  <select
                    value={status}
                    onChange={(e) => {
                      const next = e.target.value as TaskStatus;
                      setStatus(next);
                      handleSaveDetails({ status: next });
                    }}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white cursor-pointer"
                  >
                    <option value="TODO">To Do</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="DONE">Done</option>
                  </select>
                </div>

                {/* Priority Selector */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>Priority</span>
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => {
                      const next = e.target.value as Priority;
                      setPriority(next);
                      handleSaveDetails({ priority: next });
                    }}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white cursor-pointer"
                  >
                    <option value="LOW">Low Priority</option>
                    <option value="MEDIUM">Medium Priority</option>
                    <option value="HIGH">High Priority</option>
                  </select>
                </div>

                {/* Assignee Selector */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                    <UserIcon className="w-3.5 h-3.5 text-slate-500" />
                    <span>Assignee</span>
                  </label>
                  <select
                    value={assigneeId}
                    onChange={(e) => {
                      const next = e.target.value;
                      setAssigneeId(next);
                      handleSaveDetails({ assigneeId: next || null });
                    }}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white cursor-pointer"
                  >
                    <option value="">Unassigned</option>
                    {members.map((m) => (
                      <option key={m.userId} value={m.userId}>
                        {m.user?.name || m.userId} ({m.role})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Due Date */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      <span>Due Date</span>
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-slate-400">
                      <button
                        type="button"
                        onClick={() => setQuickDate(0)}
                        className="hover:text-blue-600 cursor-pointer font-medium"
                      >
                        Today
                      </button>
                      <span>·</span>
                      <button
                        type="button"
                        onClick={() => setQuickDate(1)}
                        className="hover:text-blue-600 cursor-pointer font-medium"
                      >
                        Tomorrow
                      </button>
                      <span>·</span>
                      <button
                        type="button"
                        onClick={() => setQuickDate(7)}
                        className="hover:text-blue-600 cursor-pointer font-medium"
                      >
                        +1w
                      </button>
                    </span>
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => {
                      const next = e.target.value;
                      setDueDate(next);
                      handleSaveDetails({ dueDate: next ? new Date(next).toISOString() : null });
                    }}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white cursor-pointer"
                  />
                </div>
              </div>

              {/* Save feedback indicator */}
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => handleSaveDetails()}
                  disabled={saving}
                  className="px-4 py-2 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition-colors cursor-pointer shadow-xs"
                >
                  {saving ? 'Saved' : 'Save Details'}
                </button>
              </div>
            </div>
          )}

          {/* Subtasks / Checklist Tab */}
          {activeTab === 'checklist' && (
            <div className="space-y-4">
              {/* Progress Bar */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="flex items-center justify-between text-xs text-slate-700 font-semibold mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <CheckSquare className="w-3.5 h-3.5 text-blue-600" />
                    <span>Subtask Checklist</span>
                  </span>
                  <span className="tabular-nums font-bold text-slate-900">
                    {completedChecklistCount}/{checklist.length} ({checklistPercentage}%)
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full transition-all duration-300"
                    style={{ width: `${checklistPercentage}%` }}
                  />
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {checklist.length === 0 ? (
                  <div className="py-8 text-center text-slate-400">
                    <CheckSquare className="w-6 h-6 mx-auto mb-2 text-slate-300" />
                    <p className="text-xs font-semibold text-slate-600">No subtasks created</p>
                    <p className="text-[11px] text-slate-400">
                      Break this task down into bite-sized actionable deliverables.
                    </p>
                  </div>
                ) : (
                  checklist.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-lg group"
                    >
                      <button
                        type="button"
                        onClick={() => handleToggleChecklistItem(item.id)}
                        className="flex items-center gap-2.5 text-xs text-left cursor-pointer flex-1"
                      >
                        <span
                          className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                            item.completed
                              ? 'bg-emerald-600 border-emerald-600 text-white'
                              : 'border-slate-300 bg-white text-transparent'
                          }`}
                        >
                          <Check className="w-3 h-3" />
                        </span>
                        <span
                          className={`font-medium ${
                            item.completed ? 'line-through text-slate-400' : 'text-slate-800'
                          }`}
                        >
                          {item.title}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRemoveChecklistItem(item.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 transition-opacity cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Add Checklist Item Form */}
              <div className="flex gap-2 pt-2 border-t border-slate-200">
                <input
                  type="text"
                  value={newChecklistText}
                  onChange={(e) => setNewChecklistText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddChecklistItem();
                    }
                  }}
                  placeholder="Add a new deliverable or subtask..."
                  className="flex-1 px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white"
                />
                <button
                  type="button"
                  onClick={handleAddChecklistItem}
                  disabled={!newChecklistText.trim()}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </div>
            </div>
          )}

          {/* Comments Tab */}
          {activeTab === 'comments' && (
            <div className="flex flex-col h-full space-y-4">
              {/* Comment Thread List */}
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {loadingComments ? (
                  <p className="text-xs text-slate-400 text-center py-6">Loading discussion...</p>
                ) : comments.length === 0 ? (
                  <div className="py-8 text-center text-slate-400">
                    <MessageSquare className="w-6 h-6 mx-auto mb-2 text-slate-300" />
                    <p className="text-xs font-semibold text-slate-600">No comments yet</p>
                    <p className="text-[11px] text-slate-400">Start the discussion below.</p>
                  </div>
                ) : (
                  comments.map((c) => (
                    <div
                      key={c.id}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          {c.author?.avatarUrl ? (
                            <img
                              src={c.author.avatarUrl}
                              alt={c.author.name}
                              className="w-5 h-5 rounded-full object-cover border border-slate-200"
                            />
                          ) : (
                            <div className="w-5 h-5 rounded-full bg-blue-600 text-white text-[9px] font-bold flex items-center justify-center">
                              {c.author?.name?.slice(0, 2).toUpperCase() || 'U'}
                            </div>
                          )}
                          <span className="font-semibold text-slate-900">{c.author?.name}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 tabular-nums">
                          {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ·{' '}
                          {new Date(c.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed pl-7">{c.content}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Post New Comment Input */}
              <form onSubmit={handlePostComment} className="pt-3 border-t border-slate-200 flex gap-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder={`Comment as ${user?.name}...`}
                  className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white"
                />
                <button
                  type="submit"
                  disabled={submittingComment || !newComment.trim()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg transition-colors flex items-center justify-center cursor-pointer shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
