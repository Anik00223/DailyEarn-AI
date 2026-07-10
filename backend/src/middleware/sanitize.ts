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
    for (const key of Object.keys(req.query)) {
      req.query[key] = sanitizeValue(req.query[key]) as any;
    }
  }
  if (req.params && typeof req.params === 'object') {
    for (const key of Object.keys(req.params)) {
      const value = req.params[key];
      const sanitized = typeof value === 'string'
        ? DOMPurify.sanitize(value.trim())
        : Array.isArray(value)
          ? value.map((v: string) => DOMPurify.sanitize(v.trim())).join(',')
          : String(value);
      req.params[key] = sanitized;
    }
  }
  next();
}
