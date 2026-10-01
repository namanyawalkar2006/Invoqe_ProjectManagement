import { Role, TaskStatus, Priority } from './types.ts';

export interface ValidationError {
  field: string;
  message: string;
}

export function validateSignupDto(body: any): { isValid: boolean; errors: ValidationError[] } {
  const errors: ValidationError[] = [];

  if (!body.name || typeof body.name !== 'string' || body.name.trim().length < 2) {
    errors.push({ field: 'name', message: 'Name must be a string with at least 2 characters.' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!body.email || typeof body.email !== 'string' || !emailRegex.test(body.email.trim())) {
    errors.push({ field: 'email', message: 'A valid email address is required.' });
  }

  if (!body.password || typeof body.password !== 'string' || body.password.length < 6) {
    errors.push({ field: 'password', message: 'Password must be at least 6 characters long.' });
  }

  if (body.role && !['ADMIN', 'MEMBER'].includes(body.role)) {
    errors.push({ field: 'role', message: 'Role must be either ADMIN or MEMBER.' });
  }

  return { isValid: errors.length === 0, errors };
}

export function validateLoginDto(body: any): { isValid: boolean; errors: ValidationError[] } {
  const errors: ValidationError[] = [];

  if (!body.email || typeof body.email !== 'string' || !body.email.trim()) {
    errors.push({ field: 'email', message: 'Email is required.' });
  }

  if (!body.password || typeof body.password !== 'string' || !body.password) {
    errors.push({ field: 'password', message: 'Password is required.' });
  }

  return { isValid: errors.length === 0, errors };
}

export function validateCreateProjectDto(body: any): { isValid: boolean; errors: ValidationError[] } {
  const errors: ValidationError[] = [];

  if (!body.title || typeof body.title !== 'string' || body.title.trim().length < 3) {
    errors.push({ field: 'title', message: 'Project title must have at least 3 characters.' });
  }

  return { isValid: errors.length === 0, errors };
}

export function validateAddMemberDto(body: any): { isValid: boolean; errors: ValidationError[] } {
  const errors: ValidationError[] = [];

  if (!body.userId && !body.email) {
    errors.push({ field: 'userId/email', message: 'Either a valid userId or email must be provided.' });
  }

  if (body.role && !['ADMIN', 'MEMBER'].includes(body.role)) {
    errors.push({ field: 'role', message: 'Role must be either ADMIN or MEMBER.' });
  }

  return { isValid: errors.length === 0, errors };
}

export function validateCreateTaskDto(body: any): { isValid: boolean; errors: ValidationError[] } {
  const errors: ValidationError[] = [];

  if (!body.title || typeof body.title !== 'string' || body.title.trim().length < 2) {
    errors.push({ field: 'title', message: 'Task title must be at least 2 characters.' });
  }

  const validStatuses: TaskStatus[] = ['TODO', 'IN_PROGRESS', 'DONE'];
  if (body.status && !validStatuses.includes(body.status)) {
    errors.push({ field: 'status', message: 'Status must be one of: TODO, IN_PROGRESS, DONE.' });
  }

  const validPriorities: Priority[] = ['LOW', 'MEDIUM', 'HIGH'];
  if (body.priority && !validPriorities.includes(body.priority)) {
    errors.push({ field: 'priority', message: 'Priority must be one of: LOW, MEDIUM, HIGH.' });
  }

  return { isValid: errors.length === 0, errors };
}

export function validateUpdateTaskDto(body: any): { isValid: boolean; errors: ValidationError[] } {
  const errors: ValidationError[] = [];

  if (body.title !== undefined && (typeof body.title !== 'string' || body.title.trim().length < 1)) {
    errors.push({ field: 'title', message: 'Task title cannot be empty.' });
  }

  const validStatuses: TaskStatus[] = ['TODO', 'IN_PROGRESS', 'DONE'];
  if (body.status !== undefined && !validStatuses.includes(body.status)) {
    errors.push({ field: 'status', message: 'Status must be one of: TODO, IN_PROGRESS, DONE.' });
  }

  const validPriorities: Priority[] = ['LOW', 'MEDIUM', 'HIGH'];
  if (body.priority !== undefined && !validPriorities.includes(body.priority)) {
    errors.push({ field: 'priority', message: 'Priority must be one of: LOW, MEDIUM, HIGH.' });
  }

  return { isValid: errors.length === 0, errors };
}

export function validateCreateCommentDto(body: any): { isValid: boolean; errors: ValidationError[] } {
  const errors: ValidationError[] = [];

  if (!body.content || typeof body.content !== 'string' || body.content.trim().length < 1) {
    errors.push({ field: 'content', message: 'Comment content cannot be empty.' });
  }

  return { isValid: errors.length === 0, errors };
}
