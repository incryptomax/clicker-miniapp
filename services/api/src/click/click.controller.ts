import { Controller, Post, Body, UseGuards, Req, Res, HttpStatus } from '@nestjs/common';
import { ClickService } from './click.service';
import { AuthGuard } from '../auth/auth.guard';
import { ClickDto } from './dto/click.dto';
import { Request, Response } from 'express';
import { logger } from '../middleware/logging.middleware';
import { getRequestId } from '../middleware/request-id.middleware';

@Controller('click')
@UseGuards(AuthGuard)
export class ClickController {
  constructor(private readonly clickService: ClickService) {}

  @Post()
  async click(
    @Body() clickDto: ClickDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const requestId = getRequestId();
    const tgUserId = req.user.tgUserId;
    const { delta, sequence } = clickDto;

    try {
      const userData = req.user;
      const result = await this.clickService.processClick(tgUserId, delta, sequence, userData);
      
      // Set idempotency headers
      if (sequence !== undefined) {
        res.setHeader('X-Sequence', sequence.toString());
        res.setHeader('X-Idempotency-Key', `click_${tgUserId}_${sequence}`);
      }

      logger.info({
        requestId,
        tgUserId: tgUserId.toString(),
        delta,
        sequence,
        result,
      }, 'Click endpoint success');

      res.status(HttpStatus.OK).json(result);
    } catch (error) {
      logger.error({
        requestId,
        tgUserId: tgUserId.toString(),
        delta,
        sequence,
        error: error.message,
      }, 'Click endpoint error');

      throw error;
    }
  }
}
