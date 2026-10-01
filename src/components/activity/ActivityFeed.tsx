import React, { useState, useEffect } from 'react';
import { Activity } from '../../types/index.ts';
import { api } from '../../services/api.ts';
import { useSocket } from '../../context/SocketContext.tsx';
import { Activity as ActivityIcon, MessageSquare, CheckCircle, PlusCircle, UserCheck, RefreshCw } from 'lucide-react';

interface ActivityFeedProps {
  projectId: string;
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({ projectId }) => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(false);
  const { onActivityCreated } = useSocket();

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const data = await api.getActivities(projectId);
      setActivities(data);
    } catch (err) {
      console.error('Failed to load activities:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [projectId]);

  useEffect(() => {
    const unsubscribe = onActivityCreated((newAct) => {
      if (newAct.projectId === projectId) {
        setActivities((prev) => {
          if (prev.some((a) => a.id === newAct.id)) return prev;
          return [newAct, ...prev];
        });
      }
    });
    return () => unsubscribe();
  }, [projectId, onActivityCreated]);

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'CREATED_TASK':
        return <PlusCircle className="w-3.5 h-3.5 text-blue-600" />;
      case 'CHANGED_STATUS':
        return <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />;
      case 'POSTED_COMMENT':
        return <MessageSquare className="w-3.5 h-3.5 text-amber-500" />;
      case 'INVITED_MEMBER':
        return <UserCheck className="w-3.5 h-3.5 text-indigo-600" />;
      default:
        return <ActivityIcon className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col h-full select-none shadow-xs">
      <div className="flex items-center justify-between pb-3.5 border-b border-slate-200 mb-4">
        <div className="flex items-center gap-2">
          <ActivityIcon className="w-4 h-4 text-blue-600" />
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Live Workspace Activity Stream
          </h3>
        </div>
        <button
          onClick={fetchActivities}
          disabled={loading}
          title="Refresh activity"
          className="text-slate-400 hover:text-slate-700 p-1 rounded-md transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-[520px]">
        {loading && activities.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-8 font-medium">Loading stream...</p>
        ) : activities.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-8 font-medium">No activity recorded yet in this workspace.</p>
        ) : (
          activities.map((act) => (
            <div
              key={act.id}
              className="flex items-start gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs transition-colors hover:bg-slate-100/50"
            >
              <div className="mt-0.5 p-1 rounded-md bg-white border border-slate-200 shadow-2xs shrink-0">
                {getActionIcon(act.action)}
              </div>
              <div className="flex-1 leading-snug">
                <p className="text-slate-600 font-normal">
                  <span className="font-semibold text-slate-900">{act.user?.name || 'A team member'}</span>{' '}
                  <span className="text-slate-600">{act.details}</span>
                </p>
                <span className="text-[10px] text-slate-400 tabular-nums block mt-1 font-medium">
                  {new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ·{' '}
                  {new Date(act.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
