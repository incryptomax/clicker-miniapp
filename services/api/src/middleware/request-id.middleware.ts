import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

export function getRequestId(): string {
  return (global as any).requestId || 'n/a';
}

export function getClientIp(req: Request): string {
  return req.ip || req.connection.remoteAddress || 'unknown';
}

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction) {
  const requestId = req.headers['x-request-id'] as string || uuidv4();
  (global as any).requestId = requestId;
  req.headers['x-request-id'] = requestId;
  next();
}
