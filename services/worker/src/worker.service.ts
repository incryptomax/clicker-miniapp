import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { ConfigService } from '@nestjs/config';
import { RedisService } from './redis.service';

@Injectable()
export class WorkerService implements OnModuleInit {
  private readonly logger = new Logger(WorkerService.name);

  constructor(
    private configService: ConfigService,
    private redisService: RedisService,
    @InjectQueue('click-processing') private clickQueue: Queue,
    @InjectQueue('leaderboard-update') private leaderboardQueue: Queue,
    @InjectQueue('user-sync') private userSyncQueue: Queue,
  ) {}

  async onModuleInit() {
    this.logger.log('🚀 Worker Service initialized');
    
    // Start periodic tasks
    this.startPeriodicTasks();
    
    this.logger.log('Worker service is ready');
  }

  private startPeriodicTasks() {
    // Clean up old data every hour
    setInterval(async () => {
      try {
        await this.cleanupOldData();
      } catch (error) {
        this.logger.error('Failed to cleanup old data:', error);
      }
    }, 60 * 60 * 1000); // 1 hour

    // Update leaderboard every 5 minutes
    setInterval(async () => {
      try {
        await this.leaderboardQueue.add('update-leaderboard', {
          timestamp: Date.now(),
        });
      } catch (error) {
        this.logger.error('Failed to schedule leaderboard update:', error);
      }
    }, 5 * 60 * 1000); // 5 minutes
  }

  private async cleanupOldData() {
    this.logger.log('Starting data cleanup...');
    
    try {
      // Clean up old click streams (older than 24 hours)
      const cutoffTime = Date.now() - (24 * 60 * 60 * 1000);
      await this.redisService.cleanupOldStreams(cutoffTime);
      
      // Clean up old sessions
      await this.redisService.cleanupOldSessions(cutoffTime);
      
      this.logger.log('Data cleanup completed');
    } catch (error) {
      this.logger.error('Data cleanup failed:', error);
    }
  }

  // Public methods for adding jobs to queues
  async processClick(userId: number, tgUserId: string, clicks: number) {
    await this.clickQueue.add('process-click', {
      userId,
      tgUserId,
      clicks,
      timestamp: Date.now(),
    });
  }

  async updateLeaderboard() {
    await this.leaderboardQueue.add('update-leaderboard', {
      timestamp: Date.now(),
    });
  }

  async syncUser(tgUserId: string, username: string, userData: any) {
    await this.userSyncQueue.add('sync-user', {
      tgUserId,
      username,
      userData,
      timestamp: Date.now(),
    });
  }
}
