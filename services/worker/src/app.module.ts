import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TerminusModule } from '@nestjs/terminus';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bull';
import { WorkerService } from './worker.service';
import { RedisService } from './redis.service';
import { HealthController } from './health.controller';
import { ClickProcessor } from './processors/click.processor';
import { LeaderboardProcessor } from './processors/leaderboard.processor';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TerminusModule,
    ScheduleModule.forRoot(),
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST || 'redis',
        port: parseInt(process.env.REDIS_PORT || '6379'),
      },
    }),
    BullModule.registerQueue(
      { name: 'click-processing' },
      { name: 'leaderboard-update' },
      { name: 'user-sync' },
    ),
  ],
  controllers: [HealthController],
  providers: [
    WorkerService,
    RedisService,
    ClickProcessor,
    LeaderboardProcessor,
  ],
})
export class AppModule {}
