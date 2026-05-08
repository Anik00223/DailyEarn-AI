import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
  isOperational?: boolean;
}

export function errorHandler(
  err: AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const requestId = req.id || 'unknown';
  const userId = req.user?.userId || 'anonymous';

  // Log full error details with Pino-compatible structured logging
  console.error(JSON.stringify({
    level: 'error',
    requestId,
    userId,
    method: req.method,
    path: req.path,
    statusCode: err.statusCode || 500,
    code: err.code || 'INTERNAL_ERROR',
    message: err.message,
    stack: err.stack,
    timestamp: new Date().toISOString(),
  }));

  // Zod validation errors
  if (err instanceof ZodError) {
    const formattedErrors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));

    res.status(400).json({
      success: false,
      code: 'VALIDATION_ERROR',
      message: 'Invalid input data',
      errors: formattedErrors,
    });
    return;
  }

  // Known operational errors
  if (err.isOperational && err.statusCode) {
    res.status(err.statusCode).json({
      success: false,
      code: err.code || 'ERROR',
      message: err.message,
    });
    return;
  }

  // Map common status codes
  const statusCode = err.statusCode || 500;
  const codeMap: Record<number, string> = {
    400: 'BAD_REQUEST',
    401: 'UNAUTHORIZED',
    403: 'FORBIDDEN',
    404: 'NOT_FOUND',
    409: 'CONFLICT',
    429: 'RATE_LIMIT_EXCEEDED',
  };

  if (statusCode !== 500) {
    res.status(statusCode).json({
      success: false,
      code: err.code || codeMap[statusCode] || 'ERROR',
      message: err.message,
    });
    return;
  }

  // 500 — Never expose internal details
  res.status(500).json({
    success: false,
    code: 'INTERNAL_ERROR',
    message: 'An unexpected error occurred. Please try again later.',
  });
}

// Helper to create operational errors
export function createError(
  statusCode: number,
  code: string,
  message: string
): AppError {
  const error = new Error(message) as AppError;
  error.statusCode = statusCode;
  error.code = code;
  error.isOperational = true;
  return error;
}
