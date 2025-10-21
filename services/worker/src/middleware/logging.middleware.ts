import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
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
  formatters: {
    level: (label) => ({ level: label }),
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  transport: {
    targets: [
      {
        target: 'pino/file',
        level: 'info',
        options: { destination: join(logsDir, 'worker.log') }
      },
      {
        target: 'pino/file',
        level: 'error',
        options: { destination: join(logsDir, 'worker-error.log') }
      },
      {
        target: 'pino-pretty',
        level: 'debug',
        options: { 
          destination: 1, // stdout
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname'
        }
      }
    ]
  }
});

@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const requestId = req.headers['x-request-id'] as string || 'n/a';
    
    // Log request start
    logger.info({
      requestId,
      method: req.method,
      url: req.url,
      service: 'worker',
    }, 'Worker request started');
    
    // Override res.end to log response
    const originalEnd = res.end;
    const startTime = Date.now();
    
    res.end = function(chunk?: any, encoding?: any) {
      const duration = Date.now() - startTime;
      
      logger.info({
        requestId,
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        service: 'worker',
      }, 'Worker request completed');
      
      originalEnd.call(this, chunk, encoding);
    };
    
    next();
  }
}

// Export logger for use in other modules
export { logger };
