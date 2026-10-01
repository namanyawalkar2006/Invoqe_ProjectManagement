import React, { useState } from 'react';
import { TaskStatus, Priority, ProjectMember, Task } from '../../types/index.ts';
import { api } from '../../services/api.ts';
import { useToast } from '../../context/ToastContext.tsx';
import { X, PlusCircle, Tag } from 'lucide-react';

interface NewTaskModalProps {
  projectId: string;
  initialStatus?: TaskStatus;
  members: ProjectMember[];
  isOpen: boolean;
  onClose: () => void;
  onTaskCreated: (task: Task) => void;
}

const AVAILABLE_LABELS = ['Frontend', 'Backend', 'API', 'Bug', 'Feature', 'DevOps', 'Design'];

export const NewTaskModal: React.FC<NewTaskModalProps> = ({
  projectId,
  initialStatus = 'TODO',
  members,
  isOpen,
  onClose,
  onTaskCreated,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>(initialStatus);
  const [priority, setPriority] = useState<Priority>('MEDIUM');
  const [assigneeId, setAssigneeId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();

  if (!isOpen) return null;

  const toggleLabel = (label: string) => {
    setSelectedLabels((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
    );
  };

  const setQuickDate = (daysFromNow: number) => {
    const target = new Date();
    target.setDate(target.getDate() + daysFromNow);
    setDueDate(target.toISOString().split('T')[0]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setSubmitting(true);
    setError(null);
    try {
      const created = await api.createTask(projectId, {
        title: title.trim(),
        description: description.trim(),
        status,
        priority,
        assigneeId: assigneeId || null,
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
        labels: selectedLabels,
      });

      onTaskCreated(created);
      showToast(`Task created in ${status.replace('_', ' ')}`, 'success');
      setTitle('');
      setDescription('');
      setSelectedLabels([]);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create task.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs select-none">
      <div className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50/80">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <PlusCircle className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-bold text-slate-900">Create New Task</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-md transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mx-5 mt-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Task Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Implement WebSocket Room Heartbeat & Presence"
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detail the technical specifications, scope, or acceptance criteria..."
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white resize-none leading-relaxed transition-colors"
            />
          </div>

          {/* Labels Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-slate-500" />
              <span>Labels & Tags</span>
            </label>
            <div className="flex flex-wrap items-center gap-1.5">
              {AVAILABLE_LABELS.map((lbl) => {
                const isSelected = selectedLabels.includes(lbl);
                return (
                  <button
                    type="button"
                    key={lbl}
                    onClick={() => toggleLabel(lbl)}
                    className={`px-2.5 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer border ${
                      isSelected
                        ? 'bg-blue-50 text-blue-700 border-blue-200 font-semibold'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    {lbl} {isSelected && '✓'}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Status Column</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-blue-500 focus:bg-white cursor-pointer"
              >
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="DONE">Done</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-blue-500 focus:bg-white cursor-pointer"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Assignee</label>
              <select
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-blue-500 focus:bg-white cursor-pointer"
              >
                <option value="">Unassigned</option>
                {members.map((m) => (
                  <option key={m.userId} value={m.userId}>
                    {m.user?.name || m.userId} ({m.role})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                <span>Due Date</span>
                <span className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                  <button
                    type="button"
                    onClick={() => setQuickDate(0)}
                    className="hover:text-blue-600 cursor-pointer"
                  >
                    Today
                  </button>
                  <span>·</span>
                  <button
                    type="button"
                    onClick={() => setQuickDate(1)}
                    className="hover:text-blue-600 cursor-pointer"
                  >
                    Tmr
                  </button>
                  <span>·</span>
                  <button
                    type="button"
                    onClick={() => setQuickDate(7)}
                    className="hover:text-blue-600 cursor-pointer"
                  >
                    +1w
                  </button>
                </span>
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-blue-500 focus:bg-white cursor-pointer"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !title.trim()}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg transition-colors shadow-xs cursor-pointer"
            >
              {submitting ? 'Creating...' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
