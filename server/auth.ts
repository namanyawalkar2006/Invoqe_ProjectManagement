import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from './db.ts';
import { User, Role } from './types.ts';

const JWT_SECRET = process.env.JWT_SECRET || 'planify-production-secret-key-38827419';

export interface AuthenticatedRequest extends Request {
  user?: User;
}

export function generateToken(user: User): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required. Missing or invalid Authorization header.' });
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);

  if (!decoded || !decoded.id) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }

  const user = db.getUserById(decoded.id);
  if (!user) {
    return res.status(401).json({ error: 'User not found or deactivated.' });
  }

  req.user = user;
  next();
}

// RBAC middleware to check project access and roles
export function requireProjectMember(roleRequired?: Role) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const projectId = req.params.projectId || req.params.id || req.body.projectId;
    if (!projectId) {
      return res.status(400).json({ error: 'Project ID required for access check.' });
    }

    const member = db.getProjectMember(projectId, req.user.id);
    if (!member) {
      return res.status(403).json({ error: 'Access denied. You are not a member of this project.' });
    }

    if (roleRequired && roleRequired === 'ADMIN' && member.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden. This action requires Project ADMIN privileges.' });
    }

    next();
  };
}
