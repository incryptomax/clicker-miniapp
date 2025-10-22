import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private redis: Redis;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    const redisUrl = this.configService.get('REDIS_URL', 'redis://localhost:6379');
    
    this.redis = new Redis(redisUrl, {
      lazyConnect: true,
    });

    this.redis.on('connect', () => {
      console.log('Connected to Redis');
    });

    this.redis.on('error', (error) => {
      console.error('Redis connection error:', error);
    });

    await this.redis.connect();
  }

  async onModuleDestroy() {
    await this.redis.disconnect();
  }

  getClient(): Redis {
    return this.redis;
  }

  // User clicks
  async getUserClicks(userId: number): Promise<number> {
    const key = `user:${userId}:clicks`;
    const result = await this.redis.get(key);
    return result ? parseInt(result, 10) : 0;
  }

  async incrementUserClicks(userId: number, delta: number): Promise<number> {
    const key = `user:${userId}:clicks`;
    return await this.redis.incrby(key, delta);
  }

  // Leaderboard
  async updateLeaderboard(userId: number, clicks: number): Promise<void> {
    const key = 'leaderboard';
    await this.redis.zadd(key, clicks, userId);
  }

  async getLeaderboard(limit: number = 20): Promise<Array<{ userId: number; clicks: number }>> {
    const key = 'leaderboard';
    const results = await this.redis.zrevrange(key, 0, limit - 1, 'WITHSCORES');
    
    const leaderboard = [];
    for (let i = 0; i < results.length; i += 2) {
      leaderboard.push({
        userId: parseInt(results[i], 10),
        clicks: parseInt(results[i + 1], 10),
      });
    }
    
    return leaderboard;
  }

  // Rate limiting
  async checkRateLimit(key: string, limit: number, windowSeconds: number): Promise<boolean> {
    const current = await this.redis.incr(key);
    if (current === 1) {
      await this.redis.expire(key, windowSeconds);
    }
    return current <= limit;
  }

  // Active sessions
  async getActiveSessions(): Promise<string[]> {
    const pattern = 'session:*';
    const keys = await this.redis.keys(pattern);
    return keys;
  }

  // Global clicks
  async incrementGlobalClicks(delta: number): Promise<number> {
    const key = 'global:clicks';
    return await this.redis.incrby(key, delta);
  }

  async getGlobalClicks(): Promise<number> {
    const key = 'global:clicks';
    const result = await this.redis.get(key);
    return result ? parseInt(result, 10) : 0;
  }

  // Stream operations
  async addClickToStream(userId: number, delta: number, requestId: string): Promise<void> {
    const streamKey = 'clicks_stream';
    await this.redis.xadd(streamKey, '*', 'userId', userId, 'delta', delta, 'requestId', requestId);
  }

  // Heartbeat operations
  async setHeartbeat(userId: number): Promise<void> {
    const key = `heartbeat:${userId}`;
    await this.redis.setex(key, 30, Date.now().toString());
  }

  async addActiveSession(userId: number): Promise<void> {
    const key = 'active_sessions';
    await this.redis.sadd(key, userId.toString());
  }

  // Idempotency operations
  async getLastSequence(tgUserId: bigint): Promise<number> {
    const key = `sequence:${tgUserId}`;
    const result = await this.redis.get(key);
    return result ? parseInt(result, 10) : 0;
  }

  async setLastSequence(tgUserId: bigint, sequence: number): Promise<void> {
    const key = `sequence:${tgUserId}`;
    await this.redis.setex(key, 300, sequence.toString()); // 5 minute TTL
  }

  async getCachedClickResult(tgUserId: bigint, sequence: number): Promise<any> {
    const key = `click_result:${tgUserId}:${sequence}`;
    const result = await this.redis.get(key);
    return result ? JSON.parse(result) : null;
  }

  async cacheClickResult(tgUserId: bigint, sequence: number, result: any): Promise<void> {
    const key = `click_result:${tgUserId}:${sequence}`;
    await this.redis.setex(key, 300, JSON.stringify(result)); // 5 minute TTL
  }

  // Username operations
  async setUsername(userId: number, username: string): Promise<void> {
    const key = `username:${userId}`;
    await this.redis.setex(key, 86400, username); // 24 hour TTL
  }

  async getUsername(userId: number): Promise<string | null> {
    const key = `username:${userId}`;
    return await this.redis.get(key);
  }
}