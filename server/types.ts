export type Role = 'ADMIN' | 'MEMBER';
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH';

export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  role: Role;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectMember {
  id: string;
  userId: string;
  projectId: string;
  role: Role;
  createdAt: string;
  user?: User;
}

export interface ChecklistItem {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: Priority;
  dueDate?: string | null;
  order: number;
  projectId: string;
  assigneeId?: string | null;
  labels?: string[];
  checklist?: ChecklistItem[];
  createdAt: string;
  updatedAt: string;
  assignee?: User | null;
  commentCount?: number;
}

export interface Comment {
  id: string;
  content: string;
  taskId: string;
  authorId: string;
  createdAt: string;
  author?: User;
}

export interface Activity {
  id: string;
  action: string;
  details: string;
  projectId: string;
  userId: string;
  taskId?: string | null;
  createdAt: string;
  user?: User;
  task?: { id: string; title: string } | null;
}
