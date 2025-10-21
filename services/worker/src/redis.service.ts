import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisClientType, createClient } from 'redis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: RedisClientType;
  private readonly logger = new Logger(RedisService.name);

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    const redisUrl = this.configService.get<string>('REDIS_URL');
    this.client = createClient({
      url: redisUrl,
    });

    this.client.on('error', (err) => this.logger.error('Redis Client Error', err));
    this.client.on('connect', () => this.logger.log('Connected to Redis'));
    this.client.on('reconnecting', () => this.logger.warn('Redis reconnecting'));
    this.client.on('end', () => this.logger.log('Redis connection ended'));

    await this.client.connect();
  }

  async onModuleDestroy() {
    await this.client.disconnect();
  }

  getClient(): RedisClientType {
    return this.client;
  }

  async ping(): Promise<string> {
    return await this.client.ping();
  }

  // User stats management
  async updateUserStats(tgUserId: string, clicks: number): Promise<void> {
    const userKey = `user:${tgUserId}`;
    const statsKey = `user:${tgUserId}:stats`;
    
    // Update total clicks
    await this.client.hIncrBy(statsKey, 'totalClicks', clicks);
    await this.client.hSet(statsKey, 'lastActiveAt', new Date().toISOString());
    
    // Update leaderboard
    await this.client.zIncrBy('leaderboard', clicks, tgUserId);
    
    this.logger.log(`Updated stats for user ${tgUserId}: +${clicks} clicks`);
  }

  async getUserStats(tgUserId: string): Promise<any> {
    const statsKey = `user:${tgUserId}:stats`;
    const stats = await this.client.hGetAll(statsKey);
    
    return {
      totalClicks: parseInt(stats.totalClicks || '0'),
      lastActiveAt: stats.lastActiveAt,
    };
  }

  // Global stats management
  async incrementGlobalClicks(clicks: number): Promise<void> {
    await this.client.incrBy('global:clicks', clicks);
    await this.client.set('global:lastUpdate', new Date().toISOString());
  }

  async getGlobalClicks(): Promise<number> {
    const clicks = await this.client.get('global:clicks');
    return parseInt(clicks || '0');
  }

  // Leaderboard management
  async getLeaderboard(): Promise<Array<{ userId: string; clicks: number }>> {
    const leaderboard = await this.client.zRangeWithScores('leaderboard', 0, -1, {
      REV: true,
    });
    
    return leaderboard.map(item => ({
      userId: item.value,
      clicks: item.score,
    }));
  }

  async updateLeaderboard(leaderboard: Array<{ userId: string; clicks: number }>): Promise<void> {
    // Clear existing leaderboard
    await this.client.del('leaderboard');
    
    // Add entries to sorted set
    if (leaderboard.length > 0) {
      const entries = leaderboard.map(entry => ({ score: entry.clicks, value: entry.userId }));
      await this.client.zAdd('leaderboard', entries);
    }
    
    // Update cache timestamp
    await this.client.set('leaderboard:updated', new Date().toISOString());
  }

  async clearLeaderboardCache(): Promise<void> {
    await this.client.del('leaderboard:cache');
  }

  // User data sync
  async syncUserData(tgUserId: string, username: string, userData: any): Promise<void> {
    const userKey = `user:${tgUserId}`;
    
    await this.client.hSet(userKey, {
      tgUserId,
      username,
      ...userData,
      syncedAt: new Date().toISOString(),
    });
    
    this.logger.log(`Synced user data for ${username} (${tgUserId})`);
  }

  // Stream management
  async addClickToStream(tgUserId: string, clicks: number): Promise<void> {
    const streamKey = 'clicks:stream';
    await this.client.xAdd(streamKey, '*', {
      userId: tgUserId,
      clicks: clicks.toString(),
      timestamp: Date.now().toString(),
    });
  }

  async cleanupOldStreams(cutoffTime: number): Promise<void> {
    const streamKey = 'clicks:stream';
    
    // Get stream length
    const length = await this.client.xLen(streamKey);
    
    if (length > 1000) { // Keep only last 1000 entries
      await this.client.xTrim(streamKey, 'MAXLEN', 1000);
      this.logger.log('Cleaned up old stream entries');
    }
  }

  // Session management
  async addActiveSession(tgUserId: string): Promise<void> {
    const sessionKey = `session:${tgUserId}`;
    await this.client.setEx(sessionKey, 3600, 'active'); // 1 hour TTL
  }

  async cleanupOldSessions(cutoffTime: number): Promise<void> {
    // Sessions are automatically cleaned up by TTL
    this.logger.log('Session cleanup completed (TTL-based)');
  }

  // Heartbeat
  async setHeartbeat(): Promise<void> {
    await this.client.setEx('worker:heartbeat', 30, Date.now().toString());
  }
}
