import { User, Project, ProjectMember, Task, Comment, Activity } from '../types/index.ts';

const API_BASE = '/api';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('planify_token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorMessage = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      if (data && data.error) {
        errorMessage = data.error;
      }
    } catch {
      // ignore
    }
    throw new Error(errorMessage);
  }
  return res.json();
}

export const api = {
  // Auth
  async signup(data: { name: string; email: string; password: string; role?: 'ADMIN' | 'MEMBER' }) {
    const res = await fetch(`${API_BASE}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<{ user: User; token: string }>(res);
  },

  async login(data: { email: string; password: string }) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<{ user: User; token: string }>(res);
  },

  async getMe() {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<{ user: User }>(res);
  },

  async getUsers() {
    const res = await fetch(`${API_BASE}/users`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<User[]>(res);
  },

  // Projects
  async getProjects() {
    const res = await fetch(`${API_BASE}/projects`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Project[]>(res);
  },

  async getProject(id: string) {
    const res = await fetch(`${API_BASE}/projects/${id}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Project>(res);
  },

  async createProject(data: { title: string; description: string }) {
    const res = await fetch(`${API_BASE}/projects`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<Project>(res);
  },

  async deleteProject(id: string) {
    const res = await fetch(`${API_BASE}/projects/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse<{ message: string }>(res);
  },

  async addProjectMember(projectId: string, data: { userId?: string; email?: string; role?: 'ADMIN' | 'MEMBER' }) {
    const res = await fetch(`${API_BASE}/projects/${projectId}/members`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<ProjectMember>(res);
  },

  async removeProjectMember(projectId: string, userId: string) {
    const res = await fetch(`${API_BASE}/projects/${projectId}/members/${userId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse<{ message: string }>(res);
  },

  // Tasks
  async getMyTasks() {
    const res = await fetch(`${API_BASE}/tasks/my`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Task[]>(res);
  },

  async getTasks(projectId: string) {
    const res = await fetch(`${API_BASE}/projects/${projectId}/tasks`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Task[]>(res);
  },

  async createTask(projectId: string, data: {
    title: string;
    description: string;
    status: 'TODO' | 'IN_PROGRESS' | 'DONE';
    priority: 'LOW' | 'MEDIUM' | 'HIGH';
    dueDate?: string | null;
    assigneeId?: string | null;
    labels?: string[];
    checklist?: { id: string; title: string; completed: boolean }[];
  }) {
    const res = await fetch(`${API_BASE}/projects/${projectId}/tasks`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<Task>(res);
  },

  async updateTask(id: string, updates: Partial<Task>) {
    const res = await fetch(`${API_BASE}/tasks/${id}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates),
    });
    return handleResponse<Task>(res);
  },

  async deleteTask(id: string) {
    const res = await fetch(`${API_BASE}/tasks/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse<{ message: string }>(res);
  },

  // Comments
  async getComments(taskId: string) {
    const res = await fetch(`${API_BASE}/tasks/${taskId}/comments`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<(Comment & { author: User })[]>(res);
  },

  async createComment(taskId: string, content: string) {
    const res = await fetch(`${API_BASE}/tasks/${taskId}/comments`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ content }),
    });
    return handleResponse<Comment & { author: User }>(res);
  },

  // Activity
  async getActivities(projectId: string) {
    const res = await fetch(`${API_BASE}/projects/${projectId}/activity`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Activity[]>(res);
  }
};
