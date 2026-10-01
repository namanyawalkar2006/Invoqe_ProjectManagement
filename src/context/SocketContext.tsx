import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext.tsx';
import { Task, Comment, Activity, Project } from '../types/index.ts';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  activeProjectRoom: string | null;
  activeUserIds: string[];
  joinProject: (projectId: string) => void;
  leaveProject: (projectId: string) => void;
  onTaskCreated: (cb: (task: Task) => void) => () => void;
  onTaskUpdated: (cb: (task: Task) => void) => () => void;
  onTaskMoved: (cb: (data: { taskId: string; status: string; task: Task }) => void) => () => void;
  onTaskDeleted: (cb: (data: { taskId: string; projectId: string }) => void) => () => void;
  onCommentCreated: (cb: (comment: Comment) => void) => () => void;
  onActivityCreated: (cb: (activity: Activity) => void) => () => void;
  onProjectUpdated: (cb: (project: Project) => void) => () => void;
  onMembersUpdated: (cb: (data: { projectId: string }) => void) => () => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, token } = useAuth();
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [activeProjectRoom, setActiveProjectRoom] = useState<string | null>(null);
  const [activeUserIds, setActiveUserIds] = useState<string[]>([]);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Connect to websocket server
    const socketInstance = io(window.location.origin, {
      transports: ['websocket', 'polling'],
      auth: { token: token || '' },
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socketRef.current = socketInstance;

    socketInstance.on('connect', () => {
      setIsConnected(true);
      if (activeProjectRoom && user) {
        socketInstance.emit('join_project', { projectId: activeProjectRoom, userId: user.id });
      }
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
    });

    socketInstance.on('presence:updated', (data: { projectId: string; activeUserIds: string[] }) => {
      if (data.projectId === activeProjectRoom) {
        setActiveUserIds(data.activeUserIds);
      }
    });

    return () => {
      socketInstance.disconnect();
    };
  }, [token]);

  const joinProject = useCallback((projectId: string) => {
    setActiveProjectRoom(projectId);
    if (socketRef.current?.connected && user) {
      socketRef.current.emit('join_project', { projectId, userId: user.id });
    }
  }, [user]);

  const leaveProject = useCallback((projectId: string) => {
    if (socketRef.current?.connected && user) {
      socketRef.current.emit('leave_project', { projectId, userId: user.id });
    }
    setActiveProjectRoom(null);
    setActiveUserIds([]);
  }, [user]);

  const onTaskCreated = useCallback((cb: (task: Task) => void) => {
    const s = socketRef.current;
    if (!s) return () => {};
    s.on('task:created', cb);
    return () => { s.off('task:created', cb); };
  }, []);

  const onTaskUpdated = useCallback((cb: (task: Task) => void) => {
    const s = socketRef.current;
    if (!s) return () => {};
    s.on('task:updated', cb);
    return () => { s.off('task:updated', cb); };
  }, []);

  const onTaskMoved = useCallback((cb: (data: { taskId: string; status: string; task: Task }) => void) => {
    const s = socketRef.current;
    if (!s) return () => {};
    s.on('task:moved', cb);
    return () => { s.off('task:moved', cb); };
  }, []);

  const onTaskDeleted = useCallback((cb: (data: { taskId: string; projectId: string }) => void) => {
    const s = socketRef.current;
    if (!s) return () => {};
    s.on('task:deleted', cb);
    return () => { s.off('task:deleted', cb); };
  }, []);

  const onCommentCreated = useCallback((cb: (comment: Comment) => void) => {
    const s = socketRef.current;
    if (!s) return () => {};
    s.on('comment:created', cb);
    return () => { s.off('comment:created', cb); };
  }, []);

  const onActivityCreated = useCallback((cb: (activity: Activity) => void) => {
    const s = socketRef.current;
    if (!s) return () => {};
    s.on('activity:created', cb);
    return () => { s.off('activity:created', cb); };
  }, []);

  const onProjectUpdated = useCallback((cb: (project: Project) => void) => {
    const s = socketRef.current;
    if (!s) return () => {};
    s.on('project:updated', cb);
    return () => { s.off('project:updated', cb); };
  }, []);

  const onMembersUpdated = useCallback((cb: (data: { projectId: string }) => void) => {
    const s = socketRef.current;
    if (!s) return () => {};
    s.on('members:updated', cb);
    return () => { s.off('members:updated', cb); };
  }, []);

  return (
    <SocketContext.Provider
      value={{
        socket: socketRef.current,
        isConnected,
        activeProjectRoom,
        activeUserIds,
        joinProject,
        leaveProject,
        onTaskCreated,
        onTaskUpdated,
        onTaskMoved,
        onTaskDeleted,
        onCommentCreated,
        onActivityCreated,
        onProjectUpdated,
        onMembersUpdated,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
