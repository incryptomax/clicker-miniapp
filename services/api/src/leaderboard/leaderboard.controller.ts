import { Controller, Get, Query, Req, Res, HttpStatus } from '@nestjs/common';
import { LeaderboardService } from './leaderboard.service';
import { Request, Response } from 'express';
import { logger } from '../middleware/logging.middleware';
import { getRequestId } from '../middleware/request-id.middleware';

@Controller('leaderboard')
export class LeaderboardController {
  constructor(private readonly leaderboardService: LeaderboardService) {}

  @Get()
  async getLeaderboard(
    @Req() req: Request,
    @Res() res: Response,
    @Query('limit') limit?: string,
  ) {
    const requestId = getRequestId();
    const limitNum = limit ? parseInt(limit, 10) : 20;
    const ifNoneMatch = req.headers['if-none-match'] as string;

    try {
      const result = await this.leaderboardService.getLeaderboard(limitNum, ifNoneMatch);
      
      // Set ETag header
      res.setHeader('ETag', result.etag);
      res.setHeader('Cache-Control', 'public, max-age=5'); // 5 second cache
      
      if (result.isNotModified) {
        logger.info({
          requestId,
          etag: result.etag,
          action: 'not_modified'
        }, 'Leaderboard not modified');
        
        return res.status(HttpStatus.NOT_MODIFIED).send();
      }

      logger.info({
        requestId,
        etag: result.etag,
        entriesCount: result.entries.length,
        limit: limitNum,
      }, 'Leaderboard retrieved');

      res.status(HttpStatus.OK).json({
        entries: result.entries,
        globalClicks: result.globalClicks,
        etag: result.etag,
      });
    } catch (error) {
      logger.error({
        requestId,
        limit: limitNum,
        error: error.message,
      }, 'Leaderboard endpoint error');

      throw error;
    }
  }
}
