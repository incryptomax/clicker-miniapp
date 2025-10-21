import { Injectable } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
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

  constructor(private redisService: RedisService) {}

  async getLeaderboard(limit: number = 20, ifNoneMatch?: string): Promise<{
    entries: LeaderboardEntry[];
    etag: string;
    isNotModified: boolean;
  }> {
    return runInSpanAsync('leaderboard.get', async () => {
      try {
        // Get leaderboard data
        const leaderboardData = await this.redisService.getLeaderboard(limit);
        
        // Generate ETag from data hash
        const dataString = JSON.stringify(leaderboardData);
        const etag = `"${crypto.createHash('md5').update(dataString).digest('hex')}"`;
        
        // Check if client has current version
        if (ifNoneMatch === etag) {
          logger.info({
            requestId: getRequestId(),
            etag,
            action: 'not_modified'
          }, 'Leaderboard not modified - returning 304');
          
          return {
            entries: [],
            etag,
            isNotModified: true,
          };
        }

        // Transform data to LeaderboardEntry format
        const entries: LeaderboardEntry[] = leaderboardData.map((item, index) => ({
          rank: index + 1,
          username: `user_${item.userId}`,
          clicks: item.clicks,
          tgUserId: item.userId.toString(),
        }));

        logger.info({
          requestId: getRequestId(),
          etag,
          entriesCount: entries.length,
        }, 'Leaderboard retrieved');

        return {
          entries,
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
