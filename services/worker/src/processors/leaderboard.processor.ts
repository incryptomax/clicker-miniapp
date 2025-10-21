import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { RedisService } from '../redis.service';

@Processor('leaderboard-update')
export class LeaderboardProcessor {
  private readonly logger = new Logger(LeaderboardProcessor.name);

  constructor(private redisService: RedisService) {}

  @Process('update-leaderboard')
  async handleLeaderboardUpdate(job: Job) {
    this.logger.log('Processing leaderboard update job');
    
    try {
      // Get current leaderboard from Redis
      const leaderboard = await this.redisService.getLeaderboard();
      
      // Sort by clicks (descending)
      leaderboard.sort((a, b) => b.clicks - a.clicks);
      
      // Update Redis with sorted leaderboard
      await this.redisService.updateLeaderboard(leaderboard);
      
      // Clear cache to force refresh
      await this.redisService.clearLeaderboardCache();
      
      this.logger.log(`Leaderboard updated with ${leaderboard.length} entries`);
      
      return { 
        success: true, 
        entriesCount: leaderboard.length,
        timestamp: job.data.timestamp 
      };
    } catch (error) {
      this.logger.error('Leaderboard update failed:', error);
      throw error;
    }
  }
}
