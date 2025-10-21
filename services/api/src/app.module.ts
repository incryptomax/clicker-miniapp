import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ClickController } from './click/click.controller';
import { ClickService } from './click/click.service';
import { LeaderboardController } from './leaderboard/leaderboard.controller';
import { LeaderboardService } from './leaderboard/leaderboard.service';
import { HealthController } from './health/health.controller';
import { RedisService } from './redis/redis.service';
import { PrismaService } from './database/prisma.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 10,
    }]),
  ],
  controllers: [AppController, ClickController, LeaderboardController, HealthController],
  providers: [AppService, ClickService, LeaderboardService, RedisService, PrismaService],
})
export class AppModule {}