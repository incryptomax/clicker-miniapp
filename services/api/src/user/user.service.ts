import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { RedisService } from '../redis/redis.service';
import { logger } from '../middleware/logging.middleware';
import { getRequestId } from '../middleware/request-id.middleware';

@Injectable()
export class UserService {
  constructor(
    private prismaService: PrismaService,
    private redisService: RedisService,
  ) {}

  async changeUsername(tgUserId: bigint, newUsername: string, telegramData?: any): Promise<{ username: string }> {
    try {
      // Find user or create if not exists
      let user = await this.prismaService.user.findUnique({
        where: { tgUserId },
      });

      if (!user) {
        // Create new user if not exists
        const displayName = this.buildDisplayName(telegramData, newUsername);
        
        user = await this.prismaService.user.create({
          data: {
            tgUserId,
            username: newUsername,
            firstName: telegramData?.firstName || null,
            lastName: telegramData?.lastName || null,
            telegramUsername: telegramData?.username || null,
            stats: {
              create: {
                totalClicks: 0,
                lastActiveAt: new Date(),
              },
            },
          },
        });

        logger.info({
          requestId: getRequestId(),
          userId: user.id,
          tgUserId: tgUserId.toString(),
          newUsername,
          displayName,
          telegramData,
        }, 'New user created with username and Telegram data');
      } else {
        // Update existing user
        user = await this.prismaService.user.update({
          where: { id: user.id },
          data: { 
            username: newUsername,
            firstName: telegramData?.firstName || user.firstName,
            lastName: telegramData?.lastName || user.lastName,
            telegramUsername: telegramData?.username || user.telegramUsername,
          },
        });

        logger.info({
          requestId: getRequestId(),
          userId: user.id,
          tgUserId: tgUserId.toString(),
          oldUsername: user.username,
          newUsername,
          telegramData,
        }, 'Username updated in database');
      }

      // Build display name for leaderboard
      const displayName = this.buildDisplayName(telegramData, newUsername);
      
      // Update username in Redis for leaderboard
      await this.redisService.setUsername(user.id, displayName);

      logger.info({
        requestId: getRequestId(),
        userId: user.id,
        tgUserId: tgUserId.toString(),
        newUsername,
        displayName,
      }, 'Username updated in database and Redis');

      return { username: user.username };
    } catch (error) {
      logger.error({
        requestId: getRequestId(),
        tgUserId: tgUserId.toString(),
        newUsername,
        error: error.message,
      }, 'Failed to change username');

      throw error;
    }
  }

  private buildDisplayName(telegramData: any, customUsername: string): string {
    if (customUsername && customUsername !== 'lol') {
      return customUsername;
    }

    // Use Telegram data to build unique name
    if (telegramData?.firstName) {
      let name = telegramData.firstName;
      if (telegramData.lastName) {
        name += ` ${telegramData.lastName}`;
      }
      if (telegramData.username) {
        name += ` (@${telegramData.username})`;
      }
      return name;
    }

    // Fallback to custom username
    return customUsername || 'Unknown User';
  }

  async getUserInfo(tgUserId: bigint): Promise<{ username: string; totalClicks: number } | null> {
    try {
      const user = await this.prismaService.user.findUnique({
        where: { tgUserId },
        include: { stats: true },
      });

      if (!user) {
        return null;
      }

      return {
        username: user.username,
        totalClicks: user.stats?.totalClicks || 0,
      };
    } catch (error) {
      logger.error({
        requestId: getRequestId(),
        tgUserId: tgUserId.toString(),
        error: error.message,
      }, 'Failed to get user info');

      throw error;
    }
  }
}
