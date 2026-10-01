import fs from 'node:fs';
import path from 'node:path';
import bcrypt from 'bcryptjs';
import { User, Project, ProjectMember, Task, Comment, Activity } from './types.ts';

interface DatabaseSchema {
  users: User[];
  projects: Project[];
  projectMembers: ProjectMember[];
  tasks: Task[];
  comments: Comment[];
  activities: Activity[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

const defaultPasswordHash = bcrypt.hashSync('password123', 10);

const initialData: DatabaseSchema = {
  users: [
    {
      id: 'usr-1',
      email: 'sarah@planify.io',
      password: defaultPasswordHash,
      name: 'Sarah Chen',
      role: 'ADMIN',
      avatarUrl: '/src/assets/images/avatar_admin_sarah_1790791341910.jpg',
      createdAt: '2026-09-01T08:00:00.000Z',
      updatedAt: '2026-09-01T08:00:00.000Z'
    },
    {
      id: 'usr-2',
      email: 'alex@planify.io',
      password: defaultPasswordHash,
      name: 'Alex Rivera',
      role: 'MEMBER',
      avatarUrl: '/src/assets/images/avatar_member_alex_1790791354355.jpg',
      createdAt: '2026-09-02T09:30:00.000Z',
      updatedAt: '2026-09-02T09:30:00.000Z'
    },
    {
      id: 'usr-3',
      email: 'elena@planify.io',
      password: defaultPasswordHash,
      name: 'Elena Rostova',
      role: 'MEMBER',
      avatarUrl: '/src/assets/images/avatar_member_elena_1790791367563.jpg',
      createdAt: '2026-09-03T11:15:00.000Z',
      updatedAt: '2026-09-03T11:15:00.000Z'
    }
  ],
  projects: [
    {
      id: 'prj-1',
      title: 'Planify Core Cloud Platform',
      description: 'Next-generation project management platform with real-time sync, RBAC, and responsive kanban workflows.',
      createdAt: '2026-09-10T10:00:00.000Z',
      updatedAt: '2026-09-28T14:30:00.000Z'
    },
    {
      id: 'prj-2',
      title: 'Mobile App Architecture v2',
      description: 'Redesigning cross-platform offline client architecture and push notification system.',
      createdAt: '2026-09-15T12:00:00.000Z',
      updatedAt: '2026-09-29T16:45:00.000Z'
    }
  ],
  projectMembers: [
    {
      id: 'pm-1',
      userId: 'usr-1',
      projectId: 'prj-1',
      role: 'ADMIN',
      createdAt: '2026-09-10T10:00:00.000Z'
    },
    {
      id: 'pm-2',
      userId: 'usr-2',
      projectId: 'prj-1',
      role: 'MEMBER',
      createdAt: '2026-09-10T10:05:00.000Z'
    },
    {
      id: 'pm-3',
      userId: 'usr-3',
      projectId: 'prj-1',
      role: 'MEMBER',
      createdAt: '2026-09-10T10:10:00.000Z'
    },
    {
      id: 'pm-4',
      userId: 'usr-1',
      projectId: 'prj-2',
      role: 'ADMIN',
      createdAt: '2026-09-15T12:00:00.000Z'
    },
    {
      id: 'pm-5',
      userId: 'usr-2',
      projectId: 'prj-2',
      role: 'MEMBER',
      createdAt: '2026-09-15T12:05:00.000Z'
    }
  ],
  tasks: [
    {
      id: 'tsk-101',
      title: 'Implement WebSocket Real-time Broadcast Gateway',
      description: 'Wire Socket.io room joins on project channels and emit delta mutations for tasks, comments, and member actions.',
      status: 'DONE',
      priority: 'HIGH',
      dueDate: '2026-10-02T18:00:00.000Z',
      order: 0,
      projectId: 'prj-1',
      assigneeId: 'usr-2',
      createdAt: '2026-09-20T09:00:00.000Z',
      updatedAt: '2026-09-25T11:20:00.000Z'
    },
    {
      id: 'tsk-102',
      title: 'Build Drag-and-Drop Column Reordering with Visual Indicators',
      description: 'Implement seamless HTML5 drag-and-drop mechanics between columns with optimistic UI updates and backend sync.',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      dueDate: '2026-10-05T18:00:00.000Z',
      order: 0,
      projectId: 'prj-1',
      assigneeId: 'usr-3',
      createdAt: '2026-09-22T10:30:00.000Z',
      updatedAt: '2026-09-28T16:00:00.000Z'
    },
    {
      id: 'tsk-103',
      title: 'Role-Based Access Control (RBAC) Guard Enforcements',
      description: 'Enforce that project deletions and member invites can only be performed by project ADMINs. Members can update tasks and post comments.',
      status: 'IN_PROGRESS',
      priority: 'MEDIUM',
      dueDate: '2026-10-08T18:00:00.000Z',
      order: 1,
      projectId: 'prj-1',
      assigneeId: 'usr-1',
      createdAt: '2026-09-24T14:15:00.000Z',
      updatedAt: '2026-09-28T17:30:00.000Z'
    },
    {
      id: 'tsk-104',
      title: 'Audit Logging & Activity Stream for Workspace Events',
      description: 'Capture fine-grained activity history whenever tasks change status, comments are posted, or members join.',
      status: 'TODO',
      priority: 'LOW',
      dueDate: '2026-10-12T18:00:00.000Z',
      order: 0,
      projectId: 'prj-1',
      assigneeId: 'usr-2',
      createdAt: '2026-09-26T11:00:00.000Z',
      updatedAt: '2026-09-26T11:00:00.000Z'
    },
    {
      id: 'tsk-105',
      title: 'Database Index Optimization for Task Queries',
      description: 'Analyze query plan for task retrieval by status and priority to guarantee sub-10ms response times.',
      status: 'TODO',
      priority: 'MEDIUM',
      dueDate: '2026-10-15T18:00:00.000Z',
      order: 1,
      projectId: 'prj-1',
      assigneeId: 'usr-1',
      createdAt: '2026-09-27T08:45:00.000Z',
      updatedAt: '2026-09-27T08:45:00.000Z'
    },
    {
      id: 'tsk-201',
      title: 'Offline Sync Engine & Conflict Resolution',
      description: 'Design local client cache with Last-Write-Wins and queue replay on connection restoration.',
      status: 'TODO',
      priority: 'HIGH',
      dueDate: '2026-10-20T18:00:00.000Z',
      order: 0,
      projectId: 'prj-2',
      assigneeId: 'usr-2',
      createdAt: '2026-09-25T15:00:00.000Z',
      updatedAt: '2026-09-25T15:00:00.000Z'
    }
  ],
  comments: [
    {
      id: 'cmt-1',
      content: 'Socket.io connection pool and room partitioning have been validated across multiple concurrent browser windows.',
      taskId: 'tsk-101',
      authorId: 'usr-2',
      createdAt: '2026-09-25T11:15:00.000Z'
    },
    {
      id: 'cmt-2',
      content: 'Excellent! Verified that task movement broadcasts fire in under 15ms.',
      taskId: 'tsk-101',
      authorId: 'usr-1',
      createdAt: '2026-09-25T11:20:00.000Z'
    },
    {
      id: 'cmt-3',
      content: 'Tested drag gestures with ghost preview. Adding keyboard navigation accessibility hooks next.',
      taskId: 'tsk-102',
      authorId: 'usr-3',
      createdAt: '2026-09-28T16:00:00.000Z'
    }
  ],
  activities: [
    {
      id: 'act-1',
      action: 'CREATED_PROJECT',
      details: 'Created project "Planify Core Cloud Platform"',
      projectId: 'prj-1',
      userId: 'usr-1',
      taskId: null,
      createdAt: '2026-09-10T10:00:00.000Z'
    },
    {
      id: 'act-2',
      action: 'INVITED_MEMBER',
      details: 'Added Alex Rivera to project as MEMBER',
      projectId: 'prj-1',
      userId: 'usr-1',
      taskId: null,
      createdAt: '2026-09-10T10:05:00.000Z'
    },
    {
      id: 'act-3',
      action: 'INVITED_MEMBER',
      details: 'Added Elena Rostova to project as MEMBER',
      projectId: 'prj-1',
      userId: 'usr-1',
      taskId: null,
      createdAt: '2026-09-10T10:10:00.000Z'
    },
    {
      id: 'act-4',
      action: 'CHANGED_STATUS',
      details: 'Moved task "Implement WebSocket Real-time Broadcast Gateway" to DONE',
      projectId: 'prj-1',
      userId: 'usr-2',
      taskId: 'tsk-101',
      createdAt: '2026-09-25T11:20:00.000Z'
    },
    {
      id: 'act-5',
      action: 'POSTED_COMMENT',
      details: 'Commented on "Implement WebSocket Real-time Broadcast Gateway"',
      projectId: 'prj-1',
      userId: 'usr-1',
      taskId: 'tsk-101',
      createdAt: '2026-09-25T11:20:00.000Z'
    },
    {
      id: 'act-6',
      action: 'CHANGED_STATUS',
      details: 'Moved task "Build Drag-and-Drop Column Reordering with Visual Indicators" to IN_PROGRESS',
      projectId: 'prj-1',
      userId: 'usr-3',
      taskId: 'tsk-102',
      createdAt: '2026-09-28T16:00:00.000Z'
    }
  ]
};

class Database {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.loadData();
  }

  private loadData(): DatabaseSchema {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        return {
          users: parsed.users || initialData.users,
          projects: parsed.projects || initialData.projects,
          projectMembers: parsed.projectMembers || initialData.projectMembers,
          tasks: parsed.tasks || initialData.tasks,
          comments: parsed.comments || initialData.comments,
          activities: parsed.activities || initialData.activities
        };
      }
    } catch (err) {
      console.error('Failed to load db file, initializing default:', err);
    }
    this.saveData(initialData);
    return JSON.parse(JSON.stringify(initialData));
  }

  private saveData(data: DatabaseSchema) {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const tmpFile = `${DB_FILE}.tmp`;
      fs.writeFileSync(tmpFile, JSON.stringify(data, null, 2), 'utf-8');
      fs.renameSync(tmpFile, DB_FILE);
    } catch (err) {
      console.error('Error saving db file:', err);
    }
  }

  private persist() {
    this.saveData(this.data);
  }

  // Users
  getUsers(): User[] {
    return this.data.users;
  }

  getUserById(id: string): User | undefined {
    return this.data.users.find(u => u.id === id);
  }

  getUserByEmail(email: string): User | undefined {
    return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): User {
    const id = `usr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    const newUser: User = {
      ...userData,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.data.users.push(newUser);
    this.persist();
    return newUser;
  }

  // Projects
  getProjects(userId: string): Project[] {
    const userMemberProjectIds = this.data.projectMembers
      .filter(pm => pm.userId === userId)
      .map(pm => pm.projectId);
    return this.data.projects.filter(p => userMemberProjectIds.includes(p.id));
  }

  getAllProjects(): Project[] {
    return this.data.projects;
  }

  getProjectById(id: string): Project | undefined {
    return this.data.projects.find(p => p.id === id);
  }

  createProject(title: string, description: string, creatorId: string): Project {
    const id = `prj-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    const newProject: Project = {
      id,
      title,
      description,
      createdAt: now,
      updatedAt: now
    };
    this.data.projects.push(newProject);

    // Creator is automatically ADMIN
    const memberId = `pm-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newMember: ProjectMember = {
      id: memberId,
      userId: creatorId,
      projectId: id,
      role: 'ADMIN',
      createdAt: now
    };
    this.data.projectMembers.push(newMember);

    // Log Activity
    this.logActivity({
      action: 'CREATED_PROJECT',
      details: `Created project "${title}"`,
      projectId: id,
      userId: creatorId
    });

    this.persist();
    return newProject;
  }

  deleteProject(id: string): boolean {
    const index = this.data.projects.findIndex(p => p.id === id);
    if (index === -1) return false;

    this.data.projects.splice(index, 1);
    this.data.projectMembers = this.data.projectMembers.filter(pm => pm.projectId !== id);
    this.data.tasks = this.data.tasks.filter(t => t.projectId !== id);
    this.data.activities = this.data.activities.filter(a => a.projectId !== id);
    this.persist();
    return true;
  }

  // Project Members
  getProjectMembers(projectId: string): (ProjectMember & { user: User })[] {
    const members = this.data.projectMembers.filter(pm => pm.projectId === projectId);
    return members.map(pm => {
      const user = this.getUserById(pm.userId);
      return {
        ...pm,
        user: user ? { ...user, password: '' } : undefined as any
      };
    });
  }

  getProjectMember(projectId: string, userId: string): ProjectMember | undefined {
    return this.data.projectMembers.find(pm => pm.projectId === projectId && pm.userId === userId);
  }

  addProjectMember(projectId: string, userId: string, role: 'ADMIN' | 'MEMBER' = 'MEMBER'): ProjectMember {
    const existing = this.getProjectMember(projectId, userId);
    if (existing) {
      existing.role = role;
      this.persist();
      return existing;
    }
    const id = `pm-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newMember: ProjectMember = {
      id,
      userId,
      projectId,
      role,
      createdAt: new Date().toISOString()
    };
    this.data.projectMembers.push(newMember);
    this.persist();
    return newMember;
  }

  removeProjectMember(projectId: string, userId: string, actorId?: string): boolean {
    const index = this.data.projectMembers.findIndex(pm => pm.projectId === projectId && pm.userId === userId);
    if (index === -1) return false;
    const removedMember = this.data.projectMembers[index];
    const removedUser = this.getUserById(userId);
    this.data.projectMembers.splice(index, 1);

    if (actorId) {
      this.logActivity({
        action: 'REMOVED_MEMBER',
        details: `Removed ${removedUser?.name || 'member'} from project`,
        projectId,
        userId: actorId
      });
    }

    this.persist();
    return true;
  }

  // Tasks
  getMyAssignedTasks(userId: string): Task[] {
    const tasks = this.data.tasks.filter(t => t.assigneeId === userId);
    return tasks.map(t => {
      const assignee = this.getUserById(userId);
      const commentCount = this.data.comments.filter(c => c.taskId === t.id).length;
      return {
        ...t,
        assignee: assignee ? { ...assignee, password: '' } : null,
        commentCount
      };
    });
  }

  getTasksByProject(projectId: string): Task[] {
    const tasks = this.data.tasks.filter(t => t.projectId === projectId);
    return tasks.map(t => {
      const assignee = t.assigneeId ? this.getUserById(t.assigneeId) : null;
      const commentCount = this.data.comments.filter(c => c.taskId === t.id).length;
      return {
        ...t,
        assignee: assignee ? { ...assignee, password: '' } : null,
        commentCount
      };
    });
  }

  getTaskById(id: string): Task | undefined {
    const task = this.data.tasks.find(t => t.id === id);
    if (!task) return undefined;
    const assignee = task.assigneeId ? this.getUserById(task.assigneeId) : null;
    const commentCount = this.data.comments.filter(c => c.taskId === task.id).length;
    return {
      ...task,
      assignee: assignee ? { ...assignee, password: '' } : null,
      commentCount
    };
  }

  createTask(taskData: {
    title: string;
    description: string;
    status: 'TODO' | 'IN_PROGRESS' | 'DONE';
    priority: 'LOW' | 'MEDIUM' | 'HIGH';
    dueDate?: string | null;
    projectId: string;
    assigneeId?: string | null;
    labels?: string[];
    checklist?: { id: string; title: string; completed: boolean }[];
    creatorId: string;
  }): Task {
    const id = `tsk-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    const existingInCol = this.data.tasks.filter(t => t.projectId === taskData.projectId && t.status === taskData.status);

    const newTask: Task = {
      id,
      title: taskData.title,
      description: taskData.description,
      status: taskData.status,
      priority: taskData.priority,
      dueDate: taskData.dueDate || null,
      order: existingInCol.length,
      projectId: taskData.projectId,
      assigneeId: taskData.assigneeId || null,
      labels: taskData.labels || [],
      checklist: taskData.checklist || [],
      createdAt: now,
      updatedAt: now
    };

    this.data.tasks.push(newTask);

    this.logActivity({
      action: 'CREATED_TASK',
      details: `Created task "${taskData.title}" in ${taskData.status}`,
      projectId: taskData.projectId,
      userId: taskData.creatorId,
      taskId: id
    });

    this.persist();

    const assignee = newTask.assigneeId ? this.getUserById(newTask.assigneeId) : null;
    return {
      ...newTask,
      assignee: assignee ? { ...assignee, password: '' } : null,
      commentCount: 0
    };
  }

  updateTask(id: string, updates: Partial<Task>, actorId: string): Task | null {
    const task = this.data.tasks.find(t => t.id === id);
    if (!task) return null;

    const oldStatus = task.status;
    const oldAssigneeId = task.assigneeId;

    Object.assign(task, updates, { updatedAt: new Date().toISOString() });

    if (updates.status && updates.status !== oldStatus) {
      this.logActivity({
        action: 'CHANGED_STATUS',
        details: `Moved task "${task.title}" to ${updates.status}`,
        projectId: task.projectId,
        userId: actorId,
        taskId: task.id
      });
    }

    if (updates.assigneeId !== undefined && updates.assigneeId !== oldAssigneeId) {
      const newAssignee = updates.assigneeId ? this.getUserById(updates.assigneeId) : null;
      this.logActivity({
        action: 'ASSIGNED_TASK',
        details: newAssignee
          ? `Assigned task "${task.title}" to ${newAssignee.name}`
          : `Unassigned task "${task.title}"`,
        projectId: task.projectId,
        userId: actorId,
        taskId: task.id
      });
    }

    this.persist();

    const assignee = task.assigneeId ? this.getUserById(task.assigneeId) : null;
    const commentCount = this.data.comments.filter(c => c.taskId === task.id).length;

    return {
      ...task,
      assignee: assignee ? { ...assignee, password: '' } : null,
      commentCount
    };
  }

  deleteTask(id: string, actorId: string): boolean {
    const index = this.data.tasks.findIndex(t => t.id === id);
    if (index === -1) return false;

    const [deleted] = this.data.tasks.splice(index, 1);
    this.data.comments = this.data.comments.filter(c => c.taskId !== id);

    this.logActivity({
      action: 'DELETED_TASK',
      details: `Deleted task "${deleted.title}"`,
      projectId: deleted.projectId,
      userId: actorId,
      taskId: null
    });

    this.persist();
    return true;
  }

  // Comments
  getCommentsByTask(taskId: string): (Comment & { author: User })[] {
    const comments = this.data.comments.filter(c => c.taskId === taskId);
    return comments.map(c => {
      const author = this.getUserById(c.authorId);
      return {
        ...c,
        author: author ? { ...author, password: '' } : undefined as any
      };
    });
  }

  createComment(taskId: string, content: string, authorId: string): Comment & { author: User } {
    const task = this.getTaskById(taskId);
    if (!task) throw new Error('Task not found');

    const id = `cmt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const newComment: Comment = {
      id,
      content,
      taskId,
      authorId,
      createdAt: now
    };

    this.data.comments.push(newComment);

    this.logActivity({
      action: 'POSTED_COMMENT',
      details: `Commented on "${task.title}"`,
      projectId: task.projectId,
      userId: authorId,
      taskId: task.id
    });

    this.persist();

    const author = this.getUserById(authorId)!;
    return {
      ...newComment,
      author: { ...author, password: '' }
    };
  }

  // Activities
  getActivitiesByProject(projectId: string): Activity[] {
    const activities = this.data.activities
      .filter(a => a.projectId === projectId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return activities.map(a => {
      const user = this.getUserById(a.userId);
      const task = a.taskId ? this.data.tasks.find(t => t.id === a.taskId) : null;
      return {
        ...a,
        user: user ? { ...user, password: '' } : undefined,
        task: task ? { id: task.id, title: task.title } : null
      };
    });
  }

  logActivity(activityData: {
    action: string;
    details: string;
    projectId: string;
    userId: string;
    taskId?: string | null;
  }): Activity {
    const id = `act-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    const newActivity: Activity = {
      id,
      action: activityData.action,
      details: activityData.details,
      projectId: activityData.projectId,
      userId: activityData.userId,
      taskId: activityData.taskId || null,
      createdAt: now
    };
    this.data.activities.unshift(newActivity);
    this.persist();
    return newActivity;
  }
}

export const db = new Database();
