import React from 'react';
import { Project } from '../../types/index.ts';
import { ArrowUpRight, CheckCircle2, Clock } from 'lucide-react';

interface ProjectCardProps {
  project: Project;
  onOpen: (projectId: string) => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project, onOpen }) => {
  const taskCount = project.taskCount || 0;
  const doneCount = project.doneCount || 0;
  const percentage = taskCount > 0 ? Math.round((doneCount / taskCount) * 100) : 0;
  const members = project.members || [];

  return (
    <div
      onClick={() => onOpen(project.id)}
      className="group relative flex flex-col justify-between p-5 bg-white hover:bg-slate-50/50 border border-slate-200 hover:border-slate-300 rounded-2xl transition-all duration-200 shadow-xs hover:shadow-md cursor-pointer select-none"
    >
      <div>
        {/* Header line with role marker and open arrow */}
        <div className="flex items-center justify-between text-xs text-slate-400 mb-2.5">
          <div className="flex items-center gap-1.5 font-medium text-[11px]">
            <span className="text-blue-600 font-semibold uppercase tracking-wider text-[10px]">
              {project.myRole === 'ADMIN' ? 'Admin' : 'Member'}
            </span>
            <span className="text-slate-300">·</span>
            <span className="text-slate-400">Updated {new Date(project.updatedAt).toLocaleDateString()}</span>
          </div>
          <div className="w-6 h-6 rounded-md bg-slate-100 flex items-center justify-center text-slate-400 group-hover:text-white group-hover:bg-blue-600 transition-colors">
            <ArrowUpRight className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Title */}
        <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors tracking-tight line-clamp-1">
          {project.title}
        </h3>

        {/* Description */}
        <p className="mt-1 text-xs text-slate-600 line-clamp-2 leading-relaxed font-normal">
          {project.description || 'No description provided for this workspace.'}
        </p>
      </div>

      <div className="mt-6 pt-4 border-t border-slate-100">
        {/* Progress Bar & Numeric stats */}
        <div className="flex items-center justify-between text-xs text-slate-500 mb-2 font-medium">
          <div className="flex items-center gap-1.5 text-[11px]">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span className="tabular-nums text-slate-900 font-semibold">{doneCount}/{taskCount}</span>
            <span className="text-slate-500">completed</span>
          </div>
          <span className="tabular-nums font-bold text-slate-900 text-xs">{percentage}%</span>
        </div>

        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-600 to-emerald-500 rounded-full transition-all duration-300"
            style={{ width: `${percentage}%` }}
          />
        </div>

        {/* Team Members Avatar Stack */}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center -space-x-1.5 overflow-hidden">
            {members.slice(0, 4).map((m, idx) => (
              <div
                key={m.id || idx}
                title={m.user?.name || 'Member'}
                className="w-6 h-6 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] text-slate-700 font-bold overflow-hidden"
              >
                {m.user?.avatarUrl ? (
                  <img src={m.user.avatarUrl} alt={m.user.name} className="w-full h-full object-cover" />
                ) : (
                  <span>{m.user?.name?.slice(0, 2).toUpperCase() || 'M'}</span>
                )}
              </div>
            ))}
            {members.length > 4 && (
              <div className="w-6 h-6 rounded-full border-2 border-white bg-slate-100 text-[10px] text-slate-500 flex items-center justify-center font-bold">
                +{members.length - 4}
              </div>
            )}
          </div>

          <div className="flex items-center gap-1 text-[11px] text-slate-400 font-medium">
            <Clock className="w-3 h-3 text-slate-400" />
            <span>Active</span>
          </div>
        </div>
      </div>
    </div>
  );
};
