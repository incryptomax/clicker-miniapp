import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerModuleOptions, ThrottlerStorage } from '@nestjs/throttler';
import { Reflector } from '@nestjs/core';
import { RedisService } from '../redis/redis.service';
import { getRequestId } from '../middleware/request-id.middleware';
import { logger } from '../middleware/logging.middleware';

@Injectable()
export class AdvancedRateLimitGuard extends ThrottlerGuard {
  constructor(
    private redisService: RedisService,
    options: ThrottlerModuleOptions,
    storageService: ThrottlerStorage,
    reflector: Reflector
  ) {
    super(options, storageService, reflector);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const requestId = getRequestId();
    const userId = request.user?.tgUserId;
    
    if (!userId) {
      // Apply global rate limit for unauthenticated requests
      return super.canActivate(context);
    }

    try {
      // Per-user rate limiting (50 clicks per second)
      const userKey = `ratelimit:user:${userId}`;
      const userLimit = await this.redisService.checkRateLimit(userKey, 50, 1);
      
      if (!userLimit) {
        logger.warn({
          requestId,
          userId: userId.toString(),
          endpoint: request.url,
          method: request.method,
        }, 'User rate limit exceeded');
        
        throw new HttpException('Too many requests', HttpStatus.TOO_MANY_REQUESTS);
      }

      // Apply global rate limit as well
      return super.canActivate(context);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      
      logger.error({
        requestId,
        userId: userId?.toString(),
        error: error.message,
      }, 'Rate limit check failed');
      
      // Allow request if rate limit check fails
      return true;
    }
  }
}
