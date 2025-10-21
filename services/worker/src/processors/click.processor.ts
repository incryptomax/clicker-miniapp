import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { RedisService } from '../redis.service';

@Processor('click-processing')
export class ClickProcessor {
  private readonly logger = new Logger(ClickProcessor.name);

  constructor(private redisService: RedisService) {}

  @Process('process-click')
  async handleClickProcessing(job: Job) {
    const { userId, tgUserId, clicks, timestamp } = job.data;
    
    this.logger.log(`Processing click job for user ${tgUserId}: ${clicks} clicks`);
    
    try {
      // Update user stats
      await this.redisService.updateUserStats(tgUserId, clicks);
      
      // Update global stats
      await this.redisService.incrementGlobalClicks(clicks);
      
      // Add to stream
      await this.redisService.addClickToStream(tgUserId, clicks);
      
      this.logger.log(`Click processing completed for user ${tgUserId}`);
      
      return { success: true, userId: tgUserId, clicks };
    } catch (error) {
      this.logger.error(`Click processing failed for user ${tgUserId}:`, error);
      throw error;
    }
  }
}
