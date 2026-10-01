import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { SocketProvider } from './context/SocketContext.tsx';
import { ToastProvider } from './context/ToastContext.tsx';
import { Navbar } from './components/layout/Navbar.tsx';
import { DashboardView } from './components/dashboard/DashboardView.tsx';
import { WorkspaceView } from './components/workspace/WorkspaceView.tsx';
import { AuthModal } from './components/auth/AuthModal.tsx';
import { NewProjectModal } from './components/dashboard/NewProjectModal.tsx';
import { Project } from './types/index.ts';
import { api } from './services/api.ts';

function MainApp() {
  const { user, isLoading } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  // Initialize active project from URL pathname if present (e.g. /projects/prj-1)
  const [activeProjectId, setActiveProjectId] = useState<string | null>(() => {
    const match = window.location.pathname.match(/\/projects\/([^/]+)/);
    return match ? match[1] : null;
  });
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);

  // Sync URL history state
  const navigateToProject = (id: string | null) => {
    setActiveProjectId(id);
    const targetUrl = id ? `/projects/${id}` : '/dashboard';
    if (window.location.pathname !== targetUrl) {
      window.history.pushState({ projectId: id }, '', targetUrl);
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      const match = window.location.pathname.match(/\/projects\/([^/]+)/);
      setActiveProjectId(match ? match[1] : null);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const fetchProjects = useCallback(async () => {
    if (!user) return;
    setLoadingProjects(true);
    try {
      const data = await api.getProjects();
      setProjects(data);
    } catch (err) {
      console.error('Failed to load projects:', err);
    } finally {
      setLoadingProjects(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchProjects();
    }
  }, [user, fetchProjects]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
          <span className="text-xs font-semibold text-slate-600">Initializing Planify...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthModal />;
  }

  const activeProject = projects.find((p) => p.id === activeProjectId);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased selection:bg-blue-600 selection:text-white">
      <Navbar
        currentView={activeProjectId ? 'workspace' : 'dashboard'}
        projectTitle={activeProject?.title}
        onNavigateDashboard={() => navigateToProject(null)}
        onOpenMembersModal={() => setIsMembersModalOpen(true)}
      />

      <main className="flex-1 flex flex-col overflow-hidden">
        {activeProjectId ? (
          <WorkspaceView
            projectId={activeProjectId}
            onBackToDashboard={() => {
              navigateToProject(null);
              fetchProjects();
            }}
            isMembersModalOpen={isMembersModalOpen}
            onOpenMembersModal={() => setIsMembersModalOpen(true)}
            onCloseMembersModal={() => setIsMembersModalOpen(false)}
          />
        ) : (
          <DashboardView
            user={user}
            projects={projects}
            loading={loadingProjects}
            onOpenProject={(id) => navigateToProject(id)}
            onOpenNewProjectModal={() => setIsNewProjectModalOpen(true)}
          />
        )}
      </main>

      {/* New Project Modal */}
      <NewProjectModal
        isOpen={isNewProjectModalOpen}
        onClose={() => setIsNewProjectModalOpen(false)}
        onProjectCreated={(newProj) => {
          setProjects((prev) => {
            if (prev.some((p) => p.id === newProj.id)) return prev;
            return [newProj, ...prev];
          });
          navigateToProject(newProj.id);
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <ToastProvider>
          <MainApp />
        </ToastProvider>
      </SocketProvider>
    </AuthProvider>
  );
}
