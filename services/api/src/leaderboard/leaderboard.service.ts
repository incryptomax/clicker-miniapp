import { Injectable } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import { PrismaService } from '../database/prisma.service';
import { getRequestId } from '../middleware/request-id.middleware';
import { logger } from '../middleware/logging.middleware';
import { runInSpanAsync } from '../utils/tracer';
import * as crypto from 'crypto';

// Inline types to avoid shared module issues
interface LeaderboardEntry {
  rank: number;
  username: string;
  clicks: number;
  tgUserId: string;
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
export class LeaderboardService {
  private logger = new Logger('LeaderboardService');

  constructor(private redisService: RedisService, private prismaService: PrismaService) {}

  async getLeaderboard(limit: number = 20, ifNoneMatch?: string): Promise<{
    entries: LeaderboardEntry[];
    globalClicks: number;
    etag: string;
    isNotModified: boolean;
  }> {
    return runInSpanAsync('leaderboard.get', async () => {
      try {
        // Get leaderboard data and global clicks
        const [leaderboardData, globalClicks] = await Promise.all([
          this.redisService.getLeaderboard(limit),
          this.redisService.getGlobalClicks()
        ]);
        
        this.logger.info(`Retrieved globalClicks: ${globalClicks}`);
        
        // Generate ETag from data hash
        const dataString = JSON.stringify({ leaderboardData, globalClicks });
        const etag = `"${crypto.createHash('md5').update(dataString).digest('hex')}"`;
        
        this.logger.info(`Generated ETag: ${etag} from data: ${dataString}`);
        
        // Check if client has current version
        if (ifNoneMatch === etag) {
          logger.info({
            requestId: getRequestId(),
            etag,
            action: 'not_modified'
          }, 'Leaderboard not modified - returning 304');
          
          return {
            entries: [],
            globalClicks: 0,
            etag,
            isNotModified: true,
          };
        }

        // Transform data to LeaderboardEntry format with real usernames and Telegram IDs
        const entries: LeaderboardEntry[] = await Promise.all(
          leaderboardData.map(async (item, index) => {
            const username = await this.redisService.getUsername(item.userId) || `Player_${item.userId}`;
            
            // Get Telegram ID from database
            let tgUserId = item.userId.toString(); // fallback to internal ID
            try {
              const user = await this.prismaService.user.findUnique({
                where: { id: item.userId },
                select: { tgUserId: true }
              });
              if (user && user.tgUserId) {
                tgUserId = user.tgUserId.toString();
              }
            } catch (error) {
              this.logger.error(`Failed to get Telegram ID for user ${item.userId}:`, error);
            }
            
            return {
              rank: index + 1,
              username,
              clicks: item.clicks,
              tgUserId,
            };
          })
        );

        logger.info({
          requestId: getRequestId(),
          etag,
          entriesCount: entries.length,
        }, 'Leaderboard retrieved');

        return {
          entries,
          globalClicks,
          etag,
          isNotModified: false,
        };
      } catch (error) {
        this.logger.error('Error getting leaderboard:', error);
        throw error;
      }
    }, {
      'leaderboard.limit': limit,
      'leaderboard.if_none_match': ifNoneMatch || 'none',
    });
  }
}
