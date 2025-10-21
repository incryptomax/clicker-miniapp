import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Telegraf, Context } from 'telegraf';
import { RedisService } from './redis.service';
import axios from 'axios';

@Injectable()
export class BotService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(BotService.name);
  private bot: Telegraf<Context>;
  private readonly apiBaseUrl = process.env.API_BASE_URL || 'http://api:3000';

  constructor(private readonly redisService: RedisService) {}

  async onModuleInit() {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      this.logger.error('TELEGRAM_BOT_TOKEN is not set');
      return;
    }

    this.bot = new Telegraf(token);
    this.setupCommands();
    this.setupErrorHandling();

    try {
      await this.setWebhook();
      this.logger.log('✅ Bot service initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize bot:', error);
    }
  }

  async onModuleDestroy() {
    if (this.bot) {
      await this.bot.stop('SIGINT');
    }
  }

  private setupCommands() {
    // Start command
    this.bot.start(async (ctx) => {
      const userId = ctx.from.id;
      const username = ctx.from.username || ctx.from.first_name || 'User';
      
      this.logger.log(`User ${username} (${userId}) started the bot`);
      
      await ctx.reply(
        `🎮 Добро пожаловать в Clicker Mini App, ${username}!\n\n` +
        `Нажмите кнопку ниже, чтобы начать играть:`,
        {
          reply_markup: {
            inline_keyboard: [[
              {
                text: '🎯 Играть',
                web_app: {
                  url: `${process.env.WEBAPP_URL || 'http://localhost:3003'}/game`
                }
              }
            ]]
          }
        }
      );
    });

    // Help command
    this.bot.help(async (ctx) => {
      await ctx.reply(
        `🎮 <b>Clicker Mini App - Помощь</b>\n\n` +
        `📋 <b>Команды:</b>\n` +
        `/start - Начать игру\n` +
        `/help - Показать эту справку\n` +
        `/leaderboard - Показать таблицу лидеров\n\n` +
        `🎯 <b>Как играть:</b>\n` +
        `• Нажмите кнопку "Играть" чтобы открыть игру\n` +
        `• Кликайте по кнопке для получения очков\n` +
        `• Соревнуйтесь с другими игроками!\n\n` +
        `💡 <b>Совет:</b> Чем больше кликов, тем выше ваше место в рейтинге!`,
        { parse_mode: 'HTML' }
      );
    });

    // Leaderboard command
    this.bot.command('leaderboard', async (ctx) => {
      try {
        const response = await axios.get(`${this.apiBaseUrl}/api/leaderboard?limit=10`);
        const leaderboard = response.data;

        if (!leaderboard.entries || leaderboard.entries.length === 0) {
          await ctx.reply('📊 Таблица лидеров пуста. Станьте первым!');
          return;
        }

        let message = '🏆 <b>Топ-10 игроков:</b>\n\n';
        
        leaderboard.entries.forEach((entry: any, index: number) => {
          const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🏅';
          message += `${medal} <b>${index + 1}.</b> ${entry.username}: <b>${entry.clicks}</b> кликов\n`;
        });

        message += `\n🎯 <b>Всего кликов:</b> ${leaderboard.globalClicks || 0}`;

        await ctx.reply(message, { 
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [[
              {
                text: '🔄 Обновить',
                callback_data: 'refresh_leaderboard'
              },
              {
                text: '🎮 Играть',
                web_app: {
                  url: `${process.env.WEBAPP_URL || 'http://localhost:3003'}/game`
                }
              }
            ]]
          }
        });
      } catch (error) {
        this.logger.error('Failed to get leaderboard:', error);
        await ctx.reply('❌ Не удалось загрузить таблицу лидеров. Попробуйте позже.');
      }
    });

    // Callback query handler
    this.bot.on('callback_query', async (ctx) => {
      const callbackData = (ctx.callbackQuery as any).data;
      if (callbackData === 'refresh_leaderboard') {
        await ctx.answerCbQuery('🔄 Обновляем...');
        // Re-run leaderboard command
        await this.bot.telegram.sendMessage(
          ctx.chat.id,
          '🔄 Обновляем таблицу лидеров...'
        );
        // This would trigger the leaderboard command again
      }
    });
  }

  private setupErrorHandling() {
    this.bot.catch((err, ctx) => {
      this.logger.error('Bot error:', err);
      ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    });
  }

  private async setWebhook() {
    const webhookUrl = process.env.TELEGRAM_WEBHOOK_URL;
    if (!webhookUrl) {
      this.logger.warn('TELEGRAM_WEBHOOK_URL is not set, using polling mode');
      return;
    }

    try {
      await this.bot.telegram.setWebhook(`${webhookUrl}/webhook`);
      this.logger.log(`✅ Webhook set to: ${webhookUrl}/webhook`);
    } catch (error) {
      this.logger.error('Failed to set webhook:', error);
      throw error;
    }
  }

  // Method to handle webhook updates
  async handleUpdate(update: any) {
    try {
      await this.bot.handleUpdate(update);
    } catch (error) {
      this.logger.error('Failed to handle update:', error);
      throw error;
    }
  }

  // Method to get bot info
  async getBotInfo() {
    try {
      return await this.bot.telegram.getMe();
    } catch (error) {
      this.logger.error('Failed to get bot info:', error);
      return null;
    }
  }
}
