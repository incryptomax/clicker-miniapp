import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { TerminusModule } from '@nestjs/terminus';
import { BotController } from './bot.controller';
import { BotService } from './bot.service';
import { RedisService } from './redis.service';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 10,
    }]),
    TerminusModule,
  ],
  controllers: [BotController, HealthController],
  providers: [BotService, RedisService],
})
export class AppModule {}
