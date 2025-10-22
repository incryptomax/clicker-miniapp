import { Controller, Post, Body, UseGuards, Req, Res, HttpStatus } from '@nestjs/common';
import { UserService } from './user.service';
import { AuthGuard } from '../auth/auth.guard';
import { Request, Response } from 'express';
import { logger } from '../middleware/logging.middleware';
import { getRequestId } from '../middleware/request-id.middleware';
import { IsString, IsNotEmpty, IsNumber, MinLength, MaxLength, IsOptional } from 'class-validator';

export class ChangeUsernameDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(50)
  username: string;
}

export class BotChangeUsernameDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(50)
  username: string;

  @IsNumber()
  @IsNotEmpty()
  tgUserId: number;

  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsString()
  @IsOptional()
  telegramUsername?: string;
}

@Controller('user')
@UseGuards(AuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('change-username')
  async changeUsername(
    @Body() changeUsernameDto: ChangeUsernameDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const requestId = getRequestId();
    const tgUserId = req.user.tgUserId;
    const { username } = changeUsernameDto;

    try {
      // Validate username
      if (!username || username.length < 2 || username.length > 50) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          error: 'Username must be between 2 and 50 characters'
        });
      }

      const result = await this.userService.changeUsername(tgUserId, username);

      logger.info({
        requestId,
        tgUserId: tgUserId.toString(),
        newUsername: username,
        result,
      }, 'Username changed successfully');

      res.status(HttpStatus.OK).json({
        success: true,
        username: result.username,
        message: 'Username changed successfully'
      });
    } catch (error) {
      logger.error({
        requestId,
        tgUserId: tgUserId.toString(),
        username,
        error: error.message,
      }, 'Change username error');

      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        error: 'Failed to change username'
      });
    }
  }

         @Post('bot/change-username')
         async changeUsernameFromBot(
           @Body() changeUsernameDto: BotChangeUsernameDto,
           @Req() req: Request,
           @Res() res: Response,
         ) {
           const requestId = getRequestId();
           const { username, tgUserId, firstName, lastName, telegramUsername } = changeUsernameDto;

           try {
             // Validate username
             if (!username || username.length < 2 || username.length > 50) {
               return res.status(HttpStatus.BAD_REQUEST).json({
                 error: 'Username must be between 2 and 50 characters'
               });
             }

             if (!tgUserId) {
               return res.status(HttpStatus.BAD_REQUEST).json({
                 error: 'Telegram User ID is required'
               });
             }

             // Prepare Telegram data
             const telegramData = {
               firstName,
               lastName,
               username: telegramUsername,
             };

             const result = await this.userService.changeUsername(BigInt(tgUserId), username, telegramData);

             logger.info({
               requestId,
               tgUserId: tgUserId.toString(),
               newUsername: username,
               telegramData,
               result,
             }, 'Username changed successfully from bot');

             res.status(HttpStatus.OK).json({
               success: true,
               username: result.username,
               message: 'Username changed successfully'
             });
           } catch (error) {
             logger.error({
               requestId,
               tgUserId: tgUserId?.toString(),
               username,
               error: error.message,
             }, 'Change username error from bot');

             res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
               error: 'Failed to change username'
             });
           }
         }
}
