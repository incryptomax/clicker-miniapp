import { Controller, Post, Body, Get, Logger, Headers } from '@nestjs/common';
import { BotService } from './bot.service';

@Controller()
export class BotController {
  private readonly logger = new Logger(BotController.name);

  constructor(private readonly botService: BotService) {}

  @Post('webhook')
  async handleWebhook(@Body() body: any, @Headers() headers: any) {
    try {
      this.logger.log('Received webhook update');
      await this.botService.handleUpdate(body);
      return { ok: true };
    } catch (error) {
      this.logger.error('Webhook error:', error);
      return { ok: false, error: error.message };
    }
  }

  @Get('info')
  async getBotInfo() {
    try {
      const info = await this.botService.getBotInfo();
      return { ok: true, bot: info };
    } catch (error) {
      this.logger.error('Failed to get bot info:', error);
      return { ok: false, error: error.message };
    }
  }

  @Get()
  async getStatus() {
    return {
      service: 'bot',
      status: 'running',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    };
  }
}
