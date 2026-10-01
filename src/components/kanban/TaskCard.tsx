import React, { useState } from 'react';
import { Task, TaskStatus } from '../../types/index.ts';
import {
  Calendar,
  MessageSquare,
  AlertTriangle,
  GripVertical,
  CheckCircle2,
  Circle,
  CheckSquare,
  MoreHorizontal,
  Copy,
  ArrowRight,
} from 'lucide-react';
import { useToast } from '../../context/ToastContext.tsx';

interface TaskCardProps {
  task: Task;
  onOpen: (task: Task) => void;
  onDragStart: (e: React.DragEvent, task: Task) => void;
  onDragEnd: (e: React.DragEvent) => void;
  onToggleComplete?: (task: Task) => void;
  onQuickMove?: (taskId: string, targetStatus: TaskStatus) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onOpen,
  onDragStart,
  onDragEnd,
  onToggleComplete,
  onQuickMove,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const { showToast } = useToast();

  const handleDragStart = (e: React.DragEvent) => {
    setIsDragging(true);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', task.id);
    onDragStart(e, task);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    setIsDragging(false);
    onDragEnd(e);
  };

  const isDone = task.status === 'DONE';

  const isOverdue = task.dueDate
    ? new Date(task.dueDate) < new Date() && !isDone
    : false;

  const formattedDueDate = task.dueDate
    ? new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    : null;

  const priorityDotColors = {
    HIGH: 'bg-rose-500',
    MEDIUM: 'bg-amber-500',
    LOW: 'bg-slate-400',
  }[task.priority] || 'bg-slate-400';

  const priorityTextColors = {
    HIGH: 'text-rose-600',
    MEDIUM: 'text-amber-600',
    LOW: 'text-slate-500',
  }[task.priority] || 'text-slate-500';

  const completedChecklistCount = task.checklist?.filter((c) => c.completed).length || 0;
  const totalChecklistCount = task.checklist?.length || 0;

  const handleCopyLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(`${window.location.origin}/tasks/${task.id}`);
    showToast('Task identifier copied', 'info');
    setShowMenu(false);
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={() => onOpen(task)}
      className={`group relative p-3.5 bg-white border rounded-xl transition-all duration-150 cursor-grab active:cursor-grabbing select-none ${
        isDragging
          ? 'opacity-40 border-dashed border-blue-500 scale-95 shadow-none'
          : isDone
          ? 'border-slate-200 bg-slate-50/70 opacity-80 hover:opacity-100 shadow-xs'
          : 'border-slate-200 hover:border-slate-300 shadow-xs hover:shadow-md'
      }`}
    >
      {/* Top Header: Checkbox + Title + More Menu */}
      <div className="flex items-start gap-2.5">
        {onToggleComplete && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleComplete(task);
            }}
            title={isDone ? 'Mark incomplete' : 'Mark completed'}
            className="mt-0.5 text-slate-400 hover:text-emerald-600 transition-colors cursor-pointer shrink-0"
          >
            {isDone ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 fill-emerald-100" />
            ) : (
              <Circle className="w-4 h-4 text-slate-300 hover:text-emerald-600 hover:scale-105 transition-all" />
            )}
          </button>
        )}

        <div className="flex-1 min-w-0">
          <h4
            className={`text-xs font-semibold leading-snug line-clamp-2 transition-colors ${
              isDone
                ? 'line-through text-slate-400'
                : 'text-slate-900 group-hover:text-blue-600'
            }`}
          >
            {task.title}
          </h4>

          {task.description && (
            <p className="mt-1 text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
              {task.description}
            </p>
          )}
        </div>

        {/* Action icons on hover */}
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="relative">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              title="Task actions"
              className="p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded transition-colors cursor-pointer"
            >
              <MoreHorizontal className="w-3.5 h-3.5" />
            </button>

            {showMenu && (
              <div
                onClick={(e) => e.stopPropagation()}
                onMouseLeave={() => setShowMenu(false)}
                className="absolute right-0 mt-1 w-44 rounded-lg bg-white border border-slate-200 shadow-xl py-1.5 z-40 text-xs text-slate-700"
              >
                <div className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Move to Column
                </div>
                {task.status !== 'TODO' && onQuickMove && (
                  <button
                    onClick={() => {
                      onQuickMove(task.id, 'TODO');
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-2.5 py-1 text-slate-700 hover:bg-slate-50 flex items-center justify-between"
                  >
                    <span>To Do</span>
                    <ArrowRight className="w-3 h-3 text-slate-400" />
                  </button>
                )}
                {task.status !== 'IN_PROGRESS' && onQuickMove && (
                  <button
                    onClick={() => {
                      onQuickMove(task.id, 'IN_PROGRESS');
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-2.5 py-1 text-slate-700 hover:bg-slate-50 flex items-center justify-between"
                  >
                    <span>In Progress</span>
                    <ArrowRight className="w-3 h-3 text-slate-400" />
                  </button>
                )}
                {task.status !== 'DONE' && onQuickMove && (
                  <button
                    onClick={() => {
                      onQuickMove(task.id, 'DONE');
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-2.5 py-1 text-slate-700 hover:bg-slate-50 flex items-center justify-between"
                  >
                    <span>Done</span>
                    <ArrowRight className="w-3 h-3 text-slate-400" />
                  </button>
                )}

                <div className="border-t border-slate-100 my-1" />
                <button
                  onClick={handleCopyLink}
                  className="w-full text-left px-2.5 py-1 text-slate-700 hover:bg-slate-50 flex items-center gap-1.5"
                >
                  <Copy className="w-3 h-3 text-slate-400" />
                  <span>Copy Reference</span>
                </button>
              </div>
            )}
          </div>

          <div className="text-slate-400">
            <GripVertical className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>

      {/* Labels: Quiet unboxed inline indicators */}
      {task.labels && task.labels.length > 0 && (
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-[10px] text-slate-500 font-medium">
          {task.labels.map((label, idx) => (
            <span
              key={idx}
              className="text-slate-500 hover:text-slate-700"
            >
              #{label.toLowerCase()}
            </span>
          ))}
        </div>
      )}

      {/* Bottom Metadata: Zero-Pill Unboxed Text with Separators */}
      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
        {/* Left unboxed metadata items */}
        <div className="flex items-center gap-2">
          {/* Priority indicator dot + label */}
          <div className="flex items-center gap-1.5" title={`Priority: ${task.priority}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${priorityDotColors}`} />
            <span className={`text-[10px] font-semibold uppercase tracking-wider ${priorityTextColors}`}>
              {task.priority}
            </span>
          </div>

          {/* Due date */}
          {formattedDueDate && (
            <>
              <span className="text-slate-300">·</span>
              <div
                className={`flex items-center gap-1 ${
                  isOverdue ? 'text-rose-600 font-semibold' : 'text-slate-500'
                }`}
                title={isOverdue ? 'Past due date!' : `Due ${formattedDueDate}`}
              >
                {isOverdue && <AlertTriangle className="w-3 h-3 text-rose-500" />}
                <span className="tabular-nums">{formattedDueDate}</span>
              </div>
            </>
          )}

          {/* Subtasks checklist count */}
          {totalChecklistCount > 0 && (
            <>
              <span className="text-slate-300">·</span>
              <div
                className="flex items-center gap-1 text-slate-500"
                title={`${completedChecklistCount} of ${totalChecklistCount} subtasks completed`}
              >
                <CheckSquare className="w-3 h-3 text-slate-400" />
                <span className="tabular-nums">
                  {completedChecklistCount}/{totalChecklistCount}
                </span>
              </div>
            </>
          )}

          {/* Comments count */}
          {task.commentCount !== undefined && task.commentCount > 0 && (
            <>
              <span className="text-slate-300">·</span>
              <div className="flex items-center gap-1 text-slate-500" title={`${task.commentCount} comments`}>
                <MessageSquare className="w-3 h-3 text-slate-400" />
                <span className="tabular-nums">{task.commentCount}</span>
              </div>
            </>
          )}
        </div>

        {/* Right side: Assignee Avatar */}
        {task.assignee ? (
          <div
            title={`Assigned to ${task.assignee.name}`}
            className="w-5 h-5 rounded-full overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center text-[9px] text-slate-700 font-bold"
          >
            {task.assignee.avatarUrl ? (
              <img src={task.assignee.avatarUrl} alt={task.assignee.name} className="w-full h-full object-cover" />
            ) : (
              <span>{task.assignee.name.slice(0, 2).toUpperCase()}</span>
            )}
          </div>
        ) : (
          <div
            title="Unassigned"
            className="text-[11px] text-slate-300"
          >
            ·
          </div>
        )}
      </div>
    </div>
  );
};
