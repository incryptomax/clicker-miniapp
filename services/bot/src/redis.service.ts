import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: RedisClientType;

  async onModuleInit() {
    try {
      this.client = createClient({
        url: process.env.REDIS_URL || 'redis://redis:6379',
      });

      this.client.on('error', (err) => {
        this.logger.error('Redis Client Error:', err);
      });

      this.client.on('connect', () => {
        this.logger.log('Connected to Redis');
      });

      await this.client.connect();
    } catch (error) {
      this.logger.error('Failed to connect to Redis:', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.disconnect();
    }
  }

  getClient(): RedisClientType {
    return this.client;
  }

  async ping(): Promise<string> {
    return await this.client.ping();
  }

  async get(key: string): Promise<string | null> {
    return await this.client.get(key);
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (ttl) {
      await this.client.setEx(key, ttl, value);
    } else {
      await this.client.set(key, value);
    }
  }

  async getUserClicks(userId: number): Promise<number> {
    const key = `user:${userId}:clicks`;
    const result = await this.client.get(key);
    return result ? parseInt(result, 10) : 0;
  }

  async getGlobalClicks(): Promise<number> {
    const key = 'global:clicks';
    const result = await this.client.get(key);
    return result ? parseInt(result, 10) : 0;
  }

  async del(key: string): Promise<number> {
    return await this.client.del(key);
  }

  async exists(key: string): Promise<number> {
    return await this.client.exists(key);
  }

  async incr(key: string): Promise<number> {
    return await this.client.incr(key);
  }

  async decr(key: string): Promise<number> {
    return await this.client.decr(key);
  }

  async hget(key: string, field: string): Promise<string | undefined> {
    return await this.client.hGet(key, field);
  }

  async hset(key: string, field: string, value: string): Promise<number> {
    return await this.client.hSet(key, field, value);
  }

  async hgetall(key: string): Promise<Record<string, string>> {
    return await this.client.hGetAll(key);
  }

  async lpush(key: string, ...values: string[]): Promise<number> {
    return await this.client.lPush(key, values);
  }

  async rpop(key: string): Promise<string | null> {
    return await this.client.rPop(key);
  }

  async llen(key: string): Promise<number> {
    return await this.client.lLen(key);
  }
}
