import { Request, Response, NextFunction } from 'express';
import DOMPurify from 'isomorphic-dompurify';

function sanitizeValue(value: unknown): unknown {
  if (typeof value === 'string') {
    return DOMPurify.sanitize(value.trim());
  }
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }
  if (value !== null && typeof value === 'object') {
    return sanitizeObject(value as Record<string, unknown>);
  }
  return value;
}

function sanitizeObject(obj: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    sanitized[key] = sanitizeValue(value);
  }
  return sanitized;
}

export function sanitizeMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body as Record<string, unknown>);
  }
  if (req.query && typeof req.query === 'object') {
    const sanitizedQuery: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(req.query)) {
      sanitizedQuery[key] = sanitizeValue(value);
    }
    req.query = sanitizedQuery as Record<string, string | string[] | undefined> as typeof req.query;
  }
  if (req.params && typeof req.params === 'object') {
    const sanitizedParams: Record<string, string> = {};
    for (const [key, value] of Object.entries(req.params)) {
      sanitizedParams[key] = typeof value === 'string' ? DOMPurify.sanitize(value.trim()) : value;
    }
    req.params = sanitizedParams;
  }
  next();
}
