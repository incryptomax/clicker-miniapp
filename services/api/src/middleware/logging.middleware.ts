import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { getRequestId, getClientIp } from './request-id.middleware';
import pino from 'pino';
import { mkdirSync } from 'fs';
import { join } from 'path';

// Ensure logs directory exists
const logsDir = '/app/logs';
try {
  mkdirSync(logsDir, { recursive: true });
} catch (error) {
  // Directory might already exist
}

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
    }
  }
});

@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const requestId = getRequestId();
    const clientIp = getClientIp(req);
    const startTime = Date.now();
    
    // Log request start
    logger.info({
      requestId,
      method: req.method,
      url: req.url,
      clientIp,
      userAgent: req.headers['user-agent'],
    }, 'Request started');
    
    // Override res.end to log response
    const originalEnd = res.end;
    res.end = function(chunk?: any, encoding?: any, cb?: any) {
      const duration = Date.now() - startTime;
      
      logger.info({
        requestId,
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        clientIp,
      }, 'Request completed');
      
      return originalEnd.call(this, chunk, encoding, cb);
    };
    
    next();
  }
}

// Export logger for use in other modules
export { logger };
