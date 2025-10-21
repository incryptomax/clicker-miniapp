import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService } from '@nestjs/terminus';
import { RedisService } from './redis.service';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private redisService: RedisService,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.redisService.ping().then(() => ({ redis: { status: 'up' } } as any)).catch(() => ({ redis: { status: 'down' } } as any)),
    ]);
  }

  @Get('live')
  liveness() {
    return {
      status: 'ok',
      service: 'bot',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('ready')
  readiness() {
    return this.health.check([
      () => this.redisService.ping().then(() => ({ redis: { status: 'up' } } as any)).catch(() => ({ redis: { status: 'down' } } as any)),
    ]);
  }

  @Get('startup')
  startup() {
    return {
      status: 'ok',
      service: 'bot',
      timestamp: new Date().toISOString(),
    };
  }
}
