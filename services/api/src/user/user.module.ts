import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { PrismaService } from '../database/prisma.service';
import { RedisService } from '../redis/redis.service';

@Module({
  controllers: [UserController],
  providers: [UserService, PrismaService, RedisService],
})
export class UserModule {}
