import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'node:http';
import { verifyToken } from './auth.ts';
import { Task, Comment, Activity, Project } from './types.ts';

let io: SocketIOServer | null = null;

// Track active users by project room
const projectPresence = new Map<string, Set<string>>();

export function initSocketIO(httpServer: HttpServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PATCH', 'DELETE']
    },
    transports: ['websocket', 'polling']
  });

  io.on('connection', (socket: Socket) => {
    let currentUserId: string | null = null;
    let currentProjectId: string | null = null;

    // Optional auth handshake
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace('Bearer ', '');
    if (token) {
      const decoded = verifyToken(token);
      if (decoded?.id) {
        currentUserId = decoded.id;
      }
    }

    socket.on('join_project', ({ projectId, userId }: { projectId: string; userId?: string }) => {
      const uid = userId || currentUserId;
      if (currentProjectId && currentProjectId !== projectId) {
        socket.leave(`project:${currentProjectId}`);
        if (uid && projectPresence.has(currentProjectId)) {
          projectPresence.get(currentProjectId)?.delete(uid);
          emitPresence(currentProjectId);
        }
      }

      currentProjectId = projectId;
      socket.join(`project:${projectId}`);

      if (uid) {
        if (!projectPresence.has(projectId)) {
          projectPresence.set(projectId, new Set());
        }
        projectPresence.get(projectId)?.add(uid);
        emitPresence(projectId);
      }
    });

    socket.on('leave_project', ({ projectId, userId }: { projectId: string; userId?: string }) => {
      const uid = userId || currentUserId;
      socket.leave(`project:${projectId}`);
      if (uid && projectPresence.has(projectId)) {
        projectPresence.get(projectId)?.delete(uid);
        emitPresence(projectId);
      }
      if (currentProjectId === projectId) {
        currentProjectId = null;
      }
    });

    socket.on('disconnect', () => {
      if (currentProjectId && currentUserId && projectPresence.has(currentProjectId)) {
        projectPresence.get(currentProjectId)?.delete(currentUserId);
        emitPresence(currentProjectId);
      }
    });
  });

  function emitPresence(projectId: string) {
    if (!io) return;
    const activeUserIds = Array.from(projectPresence.get(projectId) || []);
    io.to(`project:${projectId}`).emit('presence:updated', { projectId, activeUserIds });
  }

  return io;
}

export function getIO(): SocketIOServer | null {
  return io;
}

// Real-time broadcast helpers
export function emitTaskCreated(projectId: string, task: Task) {
  if (!io) return;
  io.to(`project:${projectId}`).emit('task:created', task);
  io.emit('global:task:created', { projectId, task });
}

export function emitTaskUpdated(projectId: string, task: Task) {
  if (!io) return;
  io.to(`project:${projectId}`).emit('task:updated', task);
  io.emit('global:task:updated', { projectId, task });
}

export function emitTaskMoved(projectId: string, payload: { taskId: string; status: string; task: Task }) {
  if (!io) return;
  io.to(`project:${projectId}`).emit('task:moved', payload);
  io.to(`project:${projectId}`).emit('task:updated', payload.task);
}

export function emitTaskDeleted(projectId: string, taskId: string) {
  if (!io) return;
  io.to(`project:${projectId}`).emit('task:deleted', { taskId, projectId });
  io.emit('global:task:deleted', { taskId, projectId });
}

export function emitCommentCreated(projectId: string, comment: Comment) {
  if (!io) return;
  io.to(`project:${projectId}`).emit('comment:created', comment);
}

export function emitActivityCreated(projectId: string, activity: Activity) {
  if (!io) return;
  io.to(`project:${projectId}`).emit('activity:created', activity);
}

export function emitProjectUpdated(projectId: string, project: Project) {
  if (!io) return;
  io.to(`project:${projectId}`).emit('project:updated', project);
  io.emit('global:project:updated', project);
}

export function emitMembersUpdated(projectId: string) {
  if (!io) return;
  io.to(`project:${projectId}`).emit('members:updated', { projectId });
}
