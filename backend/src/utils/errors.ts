import { StatusCodes } from 'http-status-codes';

// Base application error class
export abstract class AppError extends Error {
  public abstract readonly statusCode: number;
  public abstract readonly isOperational: boolean;
  public readonly timestamp: string;

  constructor(
    message: string,
    public readonly context?: any
  ) {
    super(message);
    this.name = this.constructor.name;
    this.timestamp = new Date().toISOString();

    // Maintains proper stack trace for where our error was thrown
    Error.captureStackTrace(this, this.constructor);
  }

  abstract toJSON(): object;
}

// HTTP Error classes
export class BadRequestError extends AppError {
  public readonly statusCode = StatusCodes.BAD_REQUEST;
  public readonly isOperational = true;

  constructor(message: string = 'Bad Request', context?: any) {
    super(message, context);
  }

  toJSON() {
    return {
      type: 'BadRequestError',
      message: this.message,
      statusCode: this.statusCode,
      timestamp: this.timestamp,
      context: this.context,
    };
  }
}

export class UnauthorizedError extends AppError {
  public readonly statusCode = StatusCodes.UNAUTHORIZED;
  public readonly isOperational = true;

  constructor(message: string = 'Unauthorized', context?: any) {
    super(message, context);
  }

  toJSON() {
    return {
      type: 'UnauthorizedError',
      message: this.message,
      statusCode: this.statusCode,
      timestamp: this.timestamp,
      context: this.context,
    };
  }
}

export class ForbiddenError extends AppError {
  public readonly statusCode = StatusCodes.FORBIDDEN;
  public readonly isOperational = true;

  constructor(message: string = 'Forbidden', context?: any) {
    super(message, context);
  }

  toJSON() {
    return {
      type: 'ForbiddenError',
      message: this.message,
      statusCode: this.statusCode,
      timestamp: this.timestamp,
      context: this.context,
    };
  }
}

export class NotFoundError extends AppError {
  public readonly statusCode = StatusCodes.NOT_FOUND;
  public readonly isOperational = true;

  constructor(message: string = 'Resource not found', context?: any) {
    super(message, context);
  }

  toJSON() {
    return {
      type: 'NotFoundError',
      message: this.message,
      statusCode: this.statusCode,
      timestamp: this.timestamp,
      context: this.context,
    };
  }
}

export class ConflictError extends AppError {
  public readonly statusCode = StatusCodes.CONFLICT;
  public readonly isOperational = true;

  constructor(message: string = 'Conflict', context?: any) {
    super(message, context);
  }

  toJSON() {
    return {
      type: 'ConflictError',
      message: this.message,
      statusCode: this.statusCode,
      timestamp: this.timestamp,
      context: this.context,
    };
  }
}

export class UnprocessableEntityError extends AppError {
  public readonly statusCode = StatusCodes.UNPROCESSABLE_ENTITY;
  public readonly isOperational = true;

  constructor(message: string = 'Unprocessable Entity', context?: any) {
    super(message, context);
  }

  toJSON() {
    return {
      type: 'UnprocessableEntityError',
      message: this.message,
      statusCode: this.statusCode,
      timestamp: this.timestamp,
      context: this.context,
    };
  }
}

export class TooManyRequestsError extends AppError {
  public readonly statusCode = StatusCodes.TOO_MANY_REQUESTS;
  public readonly isOperational = true;

  constructor(message: string = 'Too Many Requests', context?: any) {
    super(message, context);
  }

  toJSON() {
    return {
      type: 'TooManyRequestsError',
      message: this.message,
      statusCode: this.statusCode,
      timestamp: this.timestamp,
      context: this.context,
    };
  }
}

export class InternalServerError extends AppError {
  public readonly statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
  public readonly isOperational = true;

  constructor(message: string = 'Internal Server Error', context?: any) {
    super(message, context);
  }

  toJSON() {
    return {
      type: 'InternalServerError',
      message: this.message,
      statusCode: this.statusCode,
      timestamp: this.timestamp,
      context: this.context,
    };
  }
}

export class ServiceUnavailableError extends AppError {
  public readonly statusCode = StatusCodes.SERVICE_UNAVAILABLE;
  public readonly isOperational = true;

  constructor(message: string = 'Service Unavailable', context?: any) {
    super(message, context);
  }

  toJSON() {
    return {
      type: 'ServiceUnavailableError',
      message: this.message,
      statusCode: this.statusCode,
      timestamp: this.timestamp,
      context: this.context,
    };
  }
}

// Business logic errors
export class ValidationError extends BadRequestError {
  constructor(
    message: string = 'Validation failed',
    public readonly errors?: any[]
  ) {
    super(message, { errors });
  }

  toJSON() {
    return {
      type: 'ValidationError',
      message: this.message,
      statusCode: this.statusCode,
      timestamp: this.timestamp,
      errors: this.errors,
    };
  }
}

export class AuthenticationError extends UnauthorizedError {
  constructor(message: string = 'Authentication failed') {
    super(message);
  }

  toJSON() {
    return {
      type: 'AuthenticationError',
      message: this.message,
      statusCode: this.statusCode,
      timestamp: this.timestamp,
    };
  }
}

export class AuthorizationError extends ForbiddenError {
  constructor(message: string = 'Insufficient permissions') {
    super(message);
  }

  toJSON() {
    return {
      type: 'AuthorizationError',
      message: this.message,
      statusCode: this.statusCode,
      timestamp: this.timestamp,
    };
  }
}

export class DatabaseError extends InternalServerError {
  public readonly isOperational = false; // Database errors are not operational

  constructor(message: string = 'Database error', context?: any) {
    super(message, context);
  }

  toJSON() {
    return {
      type: 'DatabaseError',
      message: this.message,
      statusCode: this.statusCode,
      timestamp: this.timestamp,
      // Don't expose database details in production
      context: process.env.NODE_ENV === 'production' ? undefined : this.context,
    };
  }
}

export class ExternalServiceError extends ServiceUnavailableError {
  constructor(
    public readonly service: string,
    message: string = 'External service error',
    context?: any
  ) {
    super(message, { service, ...context });
  }

  toJSON() {
    return {
      type: 'ExternalServiceError',
      message: this.message,
      statusCode: this.statusCode,
      timestamp: this.timestamp,
      service: this.service,
      context: this.context,
    };
  }
}

// User-specific errors
export class UserNotFoundError extends NotFoundError {
  constructor(identifier: string) {
    super(`User not found: ${identifier}`, { identifier });
  }
}

export class UserAlreadyExistsError extends ConflictError {
  constructor(field: string, value: string) {
    super(`User with ${field} '${value}' already exists`, { field, value });
  }
}

export class InvalidCredentialsError extends AuthenticationError {
  constructor() {
    super('Invalid email or password');
  }
}

export class AccountLockedError extends UnauthorizedError {
  constructor(lockedUntil: Date) {
    super(
      'Account is temporarily locked due to too many failed login attempts',
      { lockedUntil }
    );
  }
}

export class EmailNotVerifiedError extends UnauthorizedError {
  constructor() {
    super('Email address is not verified');
  }
}

// Contact-specific errors
export class ContactNotFoundError extends NotFoundError {
  constructor(identifier: string) {
    super(`Contact not found: ${identifier}`, { identifier });
  }
}

export class ContactAlreadyExistsError extends ConflictError {
  constructor(userId: string, field: string, value: string) {
    super(`Contact with ${field} '${value}' already exists for this user`, {
      userId,
      field,
      value,
    });
  }
}

// Rate limiting error
export class RateLimitExceededError extends TooManyRequestsError {
  constructor(limit: number, window: string, retryAfter?: number) {
    super(`Rate limit exceeded: ${limit} requests per ${window}`, {
      limit,
      window,
      retryAfter,
    });
  }

  toJSON() {
    return {
      ...super.toJSON(),
      retryAfter: this.context?.retryAfter,
    };
  }
}

// Token-related errors
export class InvalidTokenError extends UnauthorizedError {
  constructor(tokenType: string = 'token') {
    super(`Invalid ${tokenType}`);
  }
}

export class ExpiredTokenError extends UnauthorizedError {
  constructor(tokenType: string = 'token') {
    super(`${tokenType} has expired`);
  }
}

// Utility functions
export const isAppError = (error: any): error is AppError => {
  return error instanceof AppError;
};

export const isOperationalError = (error: any): boolean => {
  return isAppError(error) && error.isOperational;
};

export const createErrorResponse = (error: AppError) => {
  const response = error.toJSON();

  // Remove sensitive information in production
  if (process.env.NODE_ENV === 'production') {
    delete (response as any).stack;
    if (error.statusCode >= 500) {
      (response as any).message = 'Internal Server Error';
      delete (response as any).context;
    }
  }

  return response;
};

// Error factory functions
export const createValidationError = (errors: any[]) => {
  const messages = errors.map(err => err.message || err).join(', ');
  return new ValidationError(`Validation failed: ${messages}`, errors);
};

export const createDatabaseError = (originalError: Error) => {
  return new DatabaseError('Database operation failed', {
    originalError: originalError.message,
  });
};

export const createExternalServiceError = (
  service: string,
  originalError: Error
) => {
  return new ExternalServiceError(service, `${service} service error`, {
    originalError: originalError.message,
  });
};
