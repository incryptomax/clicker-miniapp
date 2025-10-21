import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { logger } from '../middleware/logging.middleware';
import { getRequestId } from '../middleware/request-id.middleware';

@Controller('health')
export class HealthController {
  private startupComplete = false;
  private startupTime = Date.now();

  constructor() {
    // Mark startup as complete after 5 seconds
    setTimeout(() => {
      this.startupComplete = true;
      logger.info('Application startup completed');
    }, 5000);
  }

  @Get('live')
  @HttpCode(HttpStatus.OK)
  liveness() {
    // Simple liveness check - always return 200 if process is running
    return { status: 'alive', timestamp: new Date().toISOString() };
  }

  @Get('ready')
  @HttpCode(HttpStatus.OK)
  async readiness() {
    const requestId = getRequestId();
    
    try {
      logger.info({ requestId }, 'Readiness check passed');
      return { status: 'ready', timestamp: new Date().toISOString() };
    } catch (error) {
      logger.error({ requestId, error: error.message }, 'Readiness check failed');
      throw error;
    }
  }

  @Get('startup')
  @HttpCode(HttpStatus.OK)
  startup() {
    const requestId = getRequestId();
    
    if (this.startupComplete) {
      logger.info({ requestId }, 'Startup check passed');
      return { 
        status: 'started', 
        startupTime: Date.now() - this.startupTime,
        timestamp: new Date().toISOString() 
      };
    } else {
      logger.info({ requestId }, 'Startup check - still starting');
      return { 
        status: 'starting', 
        startupTime: Date.now() - this.startupTime,
        timestamp: new Date().toISOString() 
      };
    }
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async detailed() {
    const requestId = getRequestId();
    
    try {
      logger.info({ requestId, healthCheck: 'detailed' }, 'Detailed health check completed');
      return { status: 'healthy', timestamp: new Date().toISOString() };
    } catch (error) {
      logger.error({ requestId, error: error.message }, 'Detailed health check failed');
      throw error;
    }
  }
}
