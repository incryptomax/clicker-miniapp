import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { TelegramWebAppValidator } from '../utils/telegram-validator';

interface AuthenticatedUser {
  tgUserId: bigint;
  username: string;
  firstName?: string;
  lastName?: string;
  languageCode?: string;
  isPremium?: boolean;
}

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request & { user: AuthenticatedUser }>();
    
    // Get Telegram WebApp init data from headers
    const initData = request.headers['x-telegram-init-data'] as string;
    
    if (!initData) {
      // For development/testing, use mock data
      console.log('No Telegram init data found, using mock user');
      const mockUser: AuthenticatedUser = {
        tgUserId: BigInt(12345),
        username: 'demo_user',
        firstName: 'Demo',
        lastName: 'User'
      };
      
      request.user = mockUser;
      return true;
    }

    // Validate Telegram WebApp data
    const validatedData = TelegramWebAppValidator.validateInitData(initData);
    
    if (!validatedData || !validatedData.user) {
      console.log('Invalid Telegram WebApp data');
      throw new UnauthorizedException('Invalid Telegram WebApp data');
    }

    // Extract user data
    const telegramUser = validatedData.user;
    
    // Set user data in request
    const authenticatedUser: AuthenticatedUser = {
      tgUserId: BigInt(telegramUser.id),
      username: telegramUser.username || `${telegramUser.first_name}_${telegramUser.id}`,
      firstName: telegramUser.first_name,
      lastName: telegramUser.last_name,
      languageCode: telegramUser.language_code,
      isPremium: telegramUser.is_premium || false
    };

    request.user = authenticatedUser;
    console.log('Authenticated user:', request.user);
    return true;
  }
}
