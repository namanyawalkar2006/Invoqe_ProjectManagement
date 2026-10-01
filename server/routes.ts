import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { db } from './db.ts';
import {
  AuthenticatedRequest,
  generateToken,
  requireAuth
} from './auth.ts';
import {
  validateSignupDto,
  validateLoginDto,
  validateCreateProjectDto,
  validateAddMemberDto,
  validateCreateTaskDto,
  validateUpdateTaskDto,
  validateCreateCommentDto
} from './dto.ts';
import {
  emitTaskCreated,
  emitTaskUpdated,
  emitTaskMoved,
  emitTaskDeleted,
  emitCommentCreated,
  emitActivityCreated,
  emitProjectUpdated,
  emitMembersUpdated
} from './socket.ts';

export const apiRouter = Router();

// ==========================================
// 1. AUTH MODULE
// ==========================================

apiRouter.post('/auth/signup', (req, res: Response) => {
  try {
    const validation = validateSignupDto(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validation.errors
      });
    }

    const { email, password, name, role } = req.body;
    const existing = db.getUserByEmail(email);
    if (existing) {
      return res.status(409).json({ error: 'A user with this email address already exists.' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const newUser = db.createUser({
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      name: name.trim(),
      role: role === 'ADMIN' ? 'ADMIN' : 'MEMBER'
    });

    const token = generateToken(newUser);
    const { password: _, ...userSafe } = newUser;

    return res.status(201).json({
      user: userSafe,
      token
    });
  } catch (err: any) {
    console.error('Signup error:', err);
    return res.status(500).json({ error: 'Failed to complete registration.' });
  }
});

apiRouter.post('/auth/login', (req, res: Response) => {
  try {
    const validation = validateLoginDto(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validation.errors
      });
    }

    const { email, password } = req.body;
    const user = db.getUserByEmail(email.trim().toLowerCase());
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isValid = bcrypt.compareSync(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = generateToken(user);
    const { password: _, ...userSafe } = user;

    return res.json({
      user: userSafe,
      token
    });
  } catch (err: any) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Login authentication failed.' });
  }
});

apiRouter.get('/auth/me', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const { password: _, ...userSafe } = req.user;
  return res.json({ user: userSafe });
});

apiRouter.get('/users', requireAuth, (_req: AuthenticatedRequest, res: Response) => {
  const users = db.getUsers().map(({ password: _, ...u }) => u);
  return res.json(users);
});

// ==========================================
// 2. PROJECTS MODULE
// ==========================================

// GET /projects: get all projects the user is a member of (or all if admin)
apiRouter.get('/projects', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const projects = db.getProjects(req.user!.id);
    // Enrich with member count and task stats
    const enriched = projects.map(p => {
      const members = db.getProjectMembers(p.id);
      const tasks = db.getTasksByProject(p.id);
      const myMembership = members.find(m => m.userId === req.user!.id);
      return {
        ...p,
        memberCount: members.length,
        members: members.slice(0, 5),
        myRole: myMembership?.role || 'MEMBER',
        taskCount: tasks.length,
        doneCount: tasks.filter(t => t.status === 'DONE').length
      };
    });
    return res.json(enriched);
  } catch (err: any) {
    console.error('Error fetching projects:', err);
    return res.status(500).json({ error: 'Failed to load projects.' });
  }
});

// POST /projects: create new project
apiRouter.post('/projects', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const validation = validateCreateProjectDto(req.body);
    if (!validation.isValid) {
      return res.status(400).json({ error: 'Validation failed', details: validation.errors });
    }

    const { title, description } = req.body;
    const project = db.createProject(title.trim(), (description || '').trim(), req.user!.id);
    return res.status(201).json(project);
  } catch (err: any) {
    console.error('Error creating project:', err);
    return res.status(500).json({ error: 'Failed to create project.' });
  }
});

// GET /projects/:id: get single project with details
apiRouter.get('/projects/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const project = db.getProjectById(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found.' });
    }

    const members = db.getProjectMembers(project.id);
    const myMembership = members.find(m => m.userId === req.user!.id);
    if (!myMembership && req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'You are not a member of this project.' });
    }

    const tasks = db.getTasksByProject(project.id);
    const activities = db.getActivitiesByProject(project.id).slice(0, 20);

    return res.json({
      ...project,
      members,
      myRole: myMembership?.role || 'MEMBER',
      tasks,
      activities
    });
  } catch (err: any) {
    console.error('Error fetching project:', err);
    return res.status(500).json({ error: 'Failed to load project details.' });
  }
});

// DELETE /projects/:id (RBAC: Only project ADMIN can delete)
apiRouter.delete('/projects/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const projectId = req.params.id;
    const project = db.getProjectById(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found.' });
    }

    const myMembership = db.getProjectMember(projectId, req.user!.id);
    const isGlobalAdmin = req.user!.role === 'ADMIN';
    const isProjectAdmin = myMembership?.role === 'ADMIN';

    if (!isProjectAdmin && !isGlobalAdmin) {
      return res.status(403).json({ error: 'Forbidden: Only project administrators can delete this project.' });
    }

    const success = db.deleteProject(projectId);
    if (success) {
      emitProjectUpdated(projectId, { ...project, id: projectId, title: `${project.title} (Deleted)` });
      return res.json({ message: 'Project successfully deleted.' });
    }
    return res.status(500).json({ error: 'Failed to delete project.' });
  } catch (err: any) {
    console.error('Error deleting project:', err);
    return res.status(500).json({ error: 'Failed to delete project.' });
  }
});

// POST /projects/:id/members (RBAC: Only project ADMIN can add members)
apiRouter.post('/projects/:id/members', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const validation = validateAddMemberDto(req.body);
    if (!validation.isValid) {
      return res.status(400).json({ error: 'Validation failed', details: validation.errors });
    }

    const projectId = req.params.id;
    const { userId, email, role = 'MEMBER' } = req.body;

    const project = db.getProjectById(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found.' });
    }

    const myMembership = db.getProjectMember(projectId, req.user!.id);
    const isGlobalAdmin = req.user!.role === 'ADMIN';
    const isProjectAdmin = myMembership?.role === 'ADMIN';

    if (!isProjectAdmin && !isGlobalAdmin) {
      return res.status(403).json({ error: 'Forbidden: Only project administrators can manage members.' });
    }

    let targetUserId = userId;
    if (!targetUserId && email) {
      const targetUser = db.getUserByEmail(email.trim().toLowerCase());
      if (!targetUser) {
        return res.status(404).json({ error: `User with email "${email}" was not found.` });
      }
      targetUserId = targetUser.id;
    }

    if (!targetUserId) {
      return res.status(400).json({ error: 'User ID or valid email address is required.' });
    }

    const targetUser = db.getUserById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ error: 'Target user not found.' });
    }

    const membership = db.addProjectMember(projectId, targetUserId, role === 'ADMIN' ? 'ADMIN' : 'MEMBER');

    const activity = db.logActivity({
      action: 'INVITED_MEMBER',
      details: `Added ${targetUser.name} to project as ${membership.role}`,
      projectId,
      userId: req.user!.id
    });

    emitMembersUpdated(projectId);
    emitActivityCreated(projectId, activity);

    return res.status(201).json({
      ...membership,
      user: { ...targetUser, password: '' }
    });
  } catch (err: any) {
    console.error('Error adding member:', err);
    return res.status(500).json({ error: 'Failed to add project member.' });
  }
});

// DELETE /projects/:id/members/:userId (RBAC: Only project ADMIN can remove members)
apiRouter.delete('/projects/:id/members/:userId', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id: projectId, userId } = req.params;
    const project = db.getProjectById(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found.' });
    }

    const myMembership = db.getProjectMember(projectId, req.user!.id);
    const isGlobalAdmin = req.user!.role === 'ADMIN';
    const isProjectAdmin = myMembership?.role === 'ADMIN';

    if (!isProjectAdmin && !isGlobalAdmin) {
      return res.status(403).json({ error: 'Forbidden: Only project administrators can remove members.' });
    }

    const success = db.removeProjectMember(projectId, userId, req.user!.id);
    if (success) {
      emitMembersUpdated(projectId);
      return res.json({ message: 'Member removed from project.' });
    }
    return res.status(404).json({ error: 'Member not found in project.' });
  } catch (err: any) {
    console.error('Error removing member:', err);
    return res.status(500).json({ error: 'Failed to remove member.' });
  }
});

// ==========================================
// 3. TASKS MODULE
// ==========================================

// GET /tasks/my: get tasks assigned to current user across all projects
apiRouter.get('/tasks/my', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const tasks = db.getMyAssignedTasks(req.user!.id);
    return res.json(tasks);
  } catch (err: any) {
    console.error('Error fetching my tasks:', err);
    return res.status(500).json({ error: 'Failed to fetch assigned tasks.' });
  }
});

// GET /projects/:id/tasks
apiRouter.get('/projects/:id/tasks', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const projectId = req.params.id;
    const project = db.getProjectById(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found.' });
    }

    const tasks = db.getTasksByProject(projectId);
    return res.json(tasks);
  } catch (err: any) {
    console.error('Error fetching tasks:', err);
    return res.status(500).json({ error: 'Failed to fetch tasks.' });
  }
});

// POST /projects/:id/tasks
apiRouter.post('/projects/:id/tasks', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const validation = validateCreateTaskDto(req.body);
    if (!validation.isValid) {
      return res.status(400).json({ error: 'Validation failed', details: validation.errors });
    }

    const projectId = req.params.id;
    const {
      title,
      description = '',
      status = 'TODO',
      priority = 'MEDIUM',
      dueDate,
      assigneeId,
      labels = [],
      checklist = [],
    } = req.body;

    const project = db.getProjectById(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found.' });
    }

    // Verify membership
    const member = db.getProjectMember(projectId, req.user!.id);
    if (!member && req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Must be a project member to create tasks.' });
    }

    const task = db.createTask({
      title: title.trim(),
      description: description.trim(),
      status: ['TODO', 'IN_PROGRESS', 'DONE'].includes(status) ? status : 'TODO',
      priority: ['LOW', 'MEDIUM', 'HIGH'].includes(priority) ? priority : 'MEDIUM',
      dueDate: dueDate || null,
      projectId,
      assigneeId: assigneeId || null,
      labels: Array.isArray(labels) ? labels : [],
      checklist: Array.isArray(checklist) ? checklist : [],
      creatorId: req.user!.id
    });

    emitTaskCreated(projectId, task);

    const activity = db.getActivitiesByProject(projectId)[0];
    if (activity) {
      emitActivityCreated(projectId, activity);
    }

    return res.status(201).json(task);
  } catch (err: any) {
    console.error('Error creating task:', err);
    return res.status(500).json({ error: 'Failed to create task.' });
  }
});

// PATCH /tasks/:id (status updates, assignment, priority, etc.)
apiRouter.patch('/tasks/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const validation = validateUpdateTaskDto(req.body);
    if (!validation.isValid) {
      return res.status(400).json({ error: 'Validation failed', details: validation.errors });
    }

    const taskId = req.params.id;
    const existingTask = db.getTaskById(taskId);
    if (!existingTask) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    const member = db.getProjectMember(existingTask.projectId, req.user!.id);
    if (!member && req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Must be a project member to update tasks.' });
    }

    const updates = req.body;
    const prevStatus = existingTask.status;

    const updatedTask = db.updateTask(taskId, updates, req.user!.id);
    if (!updatedTask) {
      return res.status(500).json({ error: 'Failed to update task.' });
    }

    if (updates.status && updates.status !== prevStatus) {
      emitTaskMoved(existingTask.projectId, {
        taskId,
        status: updates.status,
        task: updatedTask
      });
    } else {
      emitTaskUpdated(existingTask.projectId, updatedTask);
    }

    const activity = db.getActivitiesByProject(existingTask.projectId)[0];
    if (activity) {
      emitActivityCreated(existingTask.projectId, activity);
    }

    return res.json(updatedTask);
  } catch (err: any) {
    console.error('Error updating task:', err);
    return res.status(500).json({ error: 'Failed to update task.' });
  }
});

// DELETE /tasks/:id
apiRouter.delete('/tasks/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const taskId = req.params.id;
    const task = db.getTaskById(taskId);
    if (!task) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    const member = db.getProjectMember(task.projectId, req.user!.id);
    if (!member && req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Must be a project member to delete tasks.' });
    }

    const projectId = task.projectId;
    const success = db.deleteTask(taskId, req.user!.id);
    if (success) {
      emitTaskDeleted(projectId, taskId);
      const activity = db.getActivitiesByProject(projectId)[0];
      if (activity) {
        emitActivityCreated(projectId, activity);
      }
      return res.json({ message: 'Task deleted successfully.' });
    }
    return res.status(500).json({ error: 'Failed to delete task.' });
  } catch (err: any) {
    console.error('Error deleting task:', err);
    return res.status(500).json({ error: 'Failed to delete task.' });
  }
});

// ==========================================
// 4. COMMENTS MODULE
// ==========================================

// GET /tasks/:id/comments
apiRouter.get('/tasks/:id/comments', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const taskId = req.params.id;
    const task = db.getTaskById(taskId);
    if (!task) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    const comments = db.getCommentsByTask(taskId);
    return res.json(comments);
  } catch (err: any) {
    console.error('Error fetching comments:', err);
    return res.status(500).json({ error: 'Failed to fetch comments.' });
  }
});

// POST /tasks/:id/comments
apiRouter.post('/tasks/:id/comments', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const validation = validateCreateCommentDto(req.body);
    if (!validation.isValid) {
      return res.status(400).json({ error: 'Validation failed', details: validation.errors });
    }

    const taskId = req.params.id;
    const { content } = req.body;

    const task = db.getTaskById(taskId);
    if (!task) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    const member = db.getProjectMember(task.projectId, req.user!.id);
    if (!member && req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Must be a project member to comment.' });
    }

    const comment = db.createComment(taskId, content.trim(), req.user!.id);
    emitCommentCreated(task.projectId, comment);

    // Update task comment count broadcast
    const updatedTask = db.getTaskById(taskId);
    if (updatedTask) {
      emitTaskUpdated(task.projectId, updatedTask);
    }

    const activity = db.getActivitiesByProject(task.projectId)[0];
    if (activity) {
      emitActivityCreated(task.projectId, activity);
    }

    return res.status(201).json(comment);
  } catch (err: any) {
    console.error('Error creating comment:', err);
    return res.status(500).json({ error: 'Failed to post comment.' });
  }
});

// ==========================================
// 5. ACTIVITY MODULE
// ==========================================

// GET /projects/:id/activity
apiRouter.get('/projects/:id/activity', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const projectId = req.params.id;
    const project = db.getProjectById(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found.' });
    }

    const activities = db.getActivitiesByProject(projectId);
    return res.json(activities);
  } catch (err: any) {
    console.error('Error fetching activity:', err);
    return res.status(500).json({ error: 'Failed to fetch activity logs.' });
  }
});
