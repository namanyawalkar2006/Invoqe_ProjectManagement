import React, { useState } from 'react';
import { Task, TaskStatus } from '../../types/index.ts';
import { TaskCard } from './TaskCard.tsx';
import { Plus } from 'lucide-react';

interface KanbanColumnProps {
  status: TaskStatus;
  title: string;
  tasks: Task[];
  onOpenTask: (task: Task) => void;
  onAddTaskToColumn: (status: TaskStatus) => void;
  onMoveTask: (taskId: string, targetStatus: TaskStatus) => void;
  onToggleComplete?: (task: Task) => void;
  onQuickMove?: (taskId: string, targetStatus: TaskStatus) => void;
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({
  status,
  title,
  tasks,
  onOpenTask,
  onAddTaskToColumn,
  onMoveTask,
  onToggleComplete,
  onQuickMove,
}) => {
  const [isOver, setIsOver] = useState(false);
  const [, setDraggedTaskId] = useState<string | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (!isOver) setIsOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsOver(false);
    const taskId = e.dataTransfer.getData('text/plain');
    if (taskId) {
      onMoveTask(taskId, status);
    }
  };

  const statusDotColors = {
    TODO: 'bg-slate-400',
    IN_PROGRESS: 'bg-amber-500',
    DONE: 'bg-emerald-500',
  }[status];

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`flex flex-col flex-1 min-w-[310px] max-w-md bg-slate-100/70 border rounded-2xl transition-all duration-200 overflow-hidden ${
        isOver
          ? 'border-blue-500 bg-blue-50/50 ring-2 ring-blue-500/20'
          : 'border-slate-200/90 hover:border-slate-300'
      }`}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-200 bg-white/70 backdrop-blur-xs select-none">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${statusDotColors}`} />
          <h3 className="text-xs font-bold text-slate-800 tracking-wide uppercase">
            {title}
          </h3>
          <span className="text-xs text-slate-500 font-medium tabular-nums ml-1">
            {tasks.length}
          </span>
        </div>

        <button
          onClick={() => onAddTaskToColumn(status)}
          title={`Add task to ${title}`}
          className="w-6 h-6 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 flex items-center justify-center transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Task Cards Container */}
      <div className="flex-1 p-3 space-y-2.5 overflow-y-auto max-h-[calc(100vh-250px)] min-h-[320px]">
        {tasks.length === 0 ? (
          <div
            onClick={() => onAddTaskToColumn(status)}
            className="h-28 border border-dashed border-slate-300 hover:border-slate-400 rounded-xl flex flex-col items-center justify-center text-center p-3 text-slate-500 hover:text-slate-700 transition-colors cursor-pointer bg-white/40"
          >
            <p className="text-xs font-semibold">No tasks in {title.toLowerCase()}</p>
            <p className="text-[11px] mt-0.5 text-slate-400">Click to create or drag cards here</p>
          </div>
        ) : (
          tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onOpen={onOpenTask}
              onDragStart={(_e, t) => setDraggedTaskId(t.id)}
              onDragEnd={() => setDraggedTaskId(null)}
              onToggleComplete={onToggleComplete}
              onQuickMove={onQuickMove}
            />
          ))
        )}
      </div>
    </div>
  );
};
