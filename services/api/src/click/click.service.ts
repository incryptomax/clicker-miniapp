import { Injectable } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import { PrismaService } from '../database/prisma.service';
import { getRequestId } from '../middleware/request-id.middleware';
import { logger } from '../middleware/logging.middleware';
import { runInSpanAsync } from '../utils/tracer';

// Inline types to avoid shared module issues
interface ClickResponse {
  myClicks: number;
  globalClicks: number;
}

class RateLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RateLimitError';
  }
}

class Logger {
  private context: string;

  constructor(context: string) {
    this.context = context;
  }

  info(message: string, ...args: any[]) {
    console.log(`[${this.context}] INFO: ${message}`, ...args);
  }

  error(message: string, ...args: any[]) {
    console.error(`[${this.context}] ERROR: ${message}`, ...args);
  }
}

@Injectable()
export class ClickService {
  private logger = new Logger('ClickService');

  constructor(
    private redisService: RedisService,
    private prismaService: PrismaService,
  ) {}

  async processClick(tgUserId: bigint, delta: number, clientSequence?: number, userData?: any): Promise<ClickResponse> {
    return runInSpanAsync('click.process', async () => {
      try {
        // Idempotency check using client sequence
        if (clientSequence !== undefined) {
          const lastSequence = await this.redisService.getLastSequence(tgUserId);
          if (clientSequence <= lastSequence) {
            // Duplicate request - return cached result
            const cachedResult = await this.redisService.getCachedClickResult(tgUserId, clientSequence);
            if (cachedResult) {
              logger.info({
                requestId: getRequestId(),
                tgUserId: tgUserId.toString(),
                clientSequence,
                action: 'duplicate_request_cached'
              }, 'Duplicate request handled with cached result');
              return cachedResult;
            }
          }
          // Update sequence
          await this.redisService.setLastSequence(tgUserId, clientSequence);
        }

        // Check rate limit (50 clicks per second per user)
        const rateLimitKey = `ratelimit:user:${tgUserId}`;
        const isWithinLimit = await this.redisService.checkRateLimit(rateLimitKey, 50, 1);
        
        if (!isWithinLimit) {
          throw new RateLimitError('Too many clicks per second');
        }

        // Get or create user
        let user = await this.prismaService.user.findUnique({
          where: { tgUserId },
          include: { stats: true },
        });

        if (!user) {
          // Create new user with default name
          const defaultName = `Player_${tgUserId}`;
            
          user = await this.prismaService.user.create({
            data: {
              tgUserId,
              username: defaultName,
              stats: {
                create: {
                  totalClicks: 0,
                  lastActiveAt: new Date(),
                },
              },
            },
            include: { stats: true },
          });
        }

        // Always use the username from database (which can be changed via /changename)
        // Save current database username to Redis for leaderboard
        await this.redisService.setUsername(user.id, user.username);

        // Update user clicks in Redis
        const myClicks = await this.redisService.incrementUserClicks(user.id, delta);
        const globalClicks = await this.redisService.incrementGlobalClicks(delta);

        // Update leaderboard
        await this.redisService.updateLeaderboard(user.id, myClicks);

        // Add to stream for write-behind persistence with correlation ID
        const requestId = getRequestId();
        await this.redisService.addClickToStream(user.id, delta, requestId);

        // Update heartbeat and active sessions
        await this.redisService.setHeartbeat(user.id);
        await this.redisService.addActiveSession(user.id);

        // Update last active timestamp
        await this.prismaService.userStats.update({
          where: { userId: user.id },
          data: { lastActiveAt: new Date() },
        });

        const result = { myClicks, globalClicks };

        // Cache result for idempotency
        if (clientSequence !== undefined) {
          await this.redisService.cacheClickResult(tgUserId, clientSequence, result);
        }

        logger.info({
          requestId,
          userId: user.id,
          tgUserId: tgUserId.toString(),
          delta,
          clientSequence,
          totalClicks: myClicks,
          globalClicks,
        }, 'Click processed successfully');

        return result;
      } catch (error) {
        this.logger.error(`Error processing click for user ${tgUserId}:`, error);
        throw error;
      }
    }, {
      'user.tgUserId': tgUserId.toString(),
      'click.delta': delta,
      'click.sequence': clientSequence?.toString() || 'none',
    });
  }
}