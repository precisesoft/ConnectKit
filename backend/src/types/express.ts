// Remove unused import and add proper type imports
import { UserRole } from '../models/user.model';

export interface UserPayload {
  id: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  role: UserRole; // Make role required with proper type
  isActive?: boolean;
  isVerified?: boolean;
  iat?: number;
  exp?: number;
}

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      user?: UserPayload;
      userId?: string;
    }
  }
}

export {};