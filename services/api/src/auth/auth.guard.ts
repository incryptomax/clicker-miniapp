import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    
    // Mock authentication for demo purposes
    // In real implementation, this would validate Telegram WebApp initData
    const mockUser = {
      tgUserId: BigInt(12345),
      username: 'demo_user'
    };
    
    request.user = mockUser;
    return true;
  }
}
