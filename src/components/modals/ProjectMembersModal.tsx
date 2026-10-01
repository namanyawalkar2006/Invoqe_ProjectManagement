import React, { useState, useEffect } from 'react';
import { ProjectMember, Role, User } from '../../types/index.ts';
import { api } from '../../services/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { X, UserPlus, Trash2, AlertCircle, Check, ShieldAlert } from 'lucide-react';

interface ProjectMembersModalProps {
  projectId: string;
  projectTitle: string;
  members: ProjectMember[];
  myRole: Role;
  isOpen: boolean;
  onClose: () => void;
  onMembersChanged: () => void;
  onProjectDeleted: () => void;
}

export const ProjectMembersModal: React.FC<ProjectMembersModalProps> = ({
  projectId,
  projectTitle,
  members,
  myRole,
  isOpen,
  onClose,
  onMembersChanged,
  onProjectDeleted,
}) => {
  const { user } = useAuth();
  const [selectedEmail, setSelectedEmail] = useState('');
  const [newRole, setNewRole] = useState<Role>('MEMBER');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [confirmProjectDelete, setConfirmProjectDelete] = useState(false);
  const [allUsers, setAllUsers] = useState<User[]>([]);

  const isAdmin = myRole === 'ADMIN';

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setSuccess(null);
      setConfirmProjectDelete(false);
      api
        .getUsers()
        .then(setAllUsers)
        .catch((err) => console.error('Failed to load users:', err));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Filter out users who are already members
  const memberUserIds = new Set(members.map((m) => m.userId));
  const candidateUsers = allUsers.filter((u) => !memberUserIds.has(u.id));

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmail.trim()) return;

    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      await api.addProjectMember(projectId, {
        email: selectedEmail.trim(),
        role: newRole,
      });
      setSuccess(`Added member successfully.`);
      setSelectedEmail('');
      onMembersChanged();
    } catch (err: any) {
      setError(err.message || 'Failed to add member.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProject = async () => {
    try {
      await api.deleteProject(projectId);
      onProjectDeleted();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to delete workspace.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs select-none">
      <div className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50/80">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Workspace Members & Access Control</h2>
            <p className="text-xs text-slate-500 mt-0.5 truncate max-w-sm">{projectTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-md transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-5 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{success}</span>
            </div>
          )}

          {/* Current Members List */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Current Members ({members.length})
              </span>
              <span className="text-[11px] text-slate-500">
                Your role: <strong className="text-blue-600 font-semibold">{myRole}</strong>
              </span>
            </div>

            <div className="space-y-2">
              {members.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    {m.user?.avatarUrl ? (
                      <img
                        src={m.user.avatarUrl}
                        alt={m.user.name}
                        className="w-7 h-7 rounded-full object-cover border border-slate-200"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">
                        {m.user?.name?.slice(0, 2).toUpperCase() || 'M'}
                      </div>
                    )}
                    <div>
                      <div className="font-semibold text-slate-900">
                        {m.user?.name || m.userId}
                        {m.userId === user?.id && <span className="text-slate-400 font-normal ml-1">(You)</span>}
                      </div>
                      <div className="text-[11px] text-slate-500">{m.user?.email}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded border ${
                        m.role === 'ADMIN'
                          ? 'text-blue-700 bg-blue-50 border-blue-200'
                          : 'text-slate-600 bg-slate-100 border-slate-200'
                      }`}
                    >
                      {m.role}
                    </span>

                    {isAdmin && m.userId !== user?.id && (
                      <button
                        type="button"
                        onClick={async () => {
                          if (confirm(`Remove ${m.user?.name || 'this member'} from the workspace?`)) {
                            try {
                              await api.removeProjectMember(projectId, m.userId);
                              onMembersChanged();
                            } catch (err: any) {
                              setError(err.message || 'Failed to remove member.');
                            }
                          }
                        }}
                        title="Remove member"
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Invite Form (RBAC: Admin Only) */}
          {isAdmin ? (
            <div className="pt-4 border-t border-slate-200">
              <div className="flex items-center gap-2 mb-3">
                <UserPlus className="w-4 h-4 text-blue-600" />
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Invite / Add Team Member
                </h3>
              </div>

              <form onSubmit={handleAddMember} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="sm:col-span-2">
                    <input
                      type="email"
                      value={selectedEmail}
                      onChange={(e) => setSelectedEmail(e.target.value)}
                      placeholder="Enter colleague's email address..."
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white"
                    />
                  </div>
                  <div>
                    <select
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value as Role)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-blue-500 focus:bg-white cursor-pointer"
                    >
                      <option value="MEMBER">MEMBER</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  </div>
                </div>

                {candidateUsers.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500">
                    <span className="text-slate-400">Quick add:</span>
                    {candidateUsers.map((u) => (
                      <button
                        type="button"
                        key={u.id}
                        onClick={() => setSelectedEmail(u.email)}
                        className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] transition-colors cursor-pointer"
                      >
                        {u.name}
                      </button>
                    ))}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting || !selectedEmail.trim()}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer shadow-xs"
                >
                  {submitting ? 'Adding...' : 'Add Member to Workspace'}
                </button>
              </form>
            </div>
          ) : (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-2.5 text-xs text-slate-600">
              <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <span>
                You have <strong>MEMBER</strong> permissions on this workspace. Only workspace <strong>ADMINs</strong> can add or remove members and configure roles.
              </span>
            </div>
          )}

          {/* Delete Workspace Danger Zone (RBAC: Admin Only) */}
          {isAdmin && (
            <div className="pt-4 border-t border-slate-200">
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-rose-50 border border-rose-200">
                <div>
                  <h4 className="text-xs font-bold text-rose-800">Delete this Workspace</h4>
                  <p className="text-[11px] text-rose-600 mt-0.5">
                    Permanently delete this workspace, all tasks, and activity logs.
                  </p>
                </div>

                {confirmProjectDelete ? (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={handleDeleteProject}
                      className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-semibold rounded transition-colors cursor-pointer"
                    >
                      Confirm Delete
                    </button>
                    <button
                      onClick={() => setConfirmProjectDelete(false)}
                      className="px-2 py-1 text-slate-500 hover:text-slate-800 text-[11px] cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmProjectDelete(true)}
                    className="px-3 py-1.5 bg-white border border-rose-300 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer shadow-xs"
                  >
                    Delete Workspace
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
