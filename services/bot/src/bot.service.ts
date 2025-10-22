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
      
      // Check if we're in development mode (HTTP URL)
      const webappUrl = process.env.WEBAPP_URL || 'http://localhost:3003';
      const isDevelopment = webappUrl.startsWith('http://');
      
      if (isDevelopment) {
        // Development mode - send simple message with link
        await ctx.reply(
          `🎮 Добро пожаловать в Clicker Mini App, ${username}!\n\n` +
          `Для локальной разработки откройте ссылку в браузере:\n` +
          `${webappUrl}\n\n` +
          `Или используйте команду /leaderboard для просмотра таблицы лидеров.`,
          {
            reply_markup: {
              inline_keyboard: [[
                {
                  text: '📊 Таблица лидеров',
                  callback_data: 'show_leaderboard'
                }
              ]]
            }
          }
        );
      } else {
        // Production mode - use Web App
        await ctx.reply(
          `🎮 Добро пожаловать в Clicker Mini App, ${username}!\n\n` +
          `Нажмите кнопку ниже, чтобы начать играть:`,
          {
            reply_markup: {
              inline_keyboard: [[
                {
                  text: '🎯 Играть',
                  web_app: {
                    url: `${webappUrl}/game`
                  }
                }
              ]]
            }
          }
        );
      }
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
        const response = await axios.get(`${this.apiBaseUrl}/leaderboard?limit=10`);
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

        // Check if we're in development mode (HTTP URL)
        const webappUrl = process.env.WEBAPP_URL || 'http://localhost:3003';
        const isDevelopment = webappUrl.startsWith('http://');
        
        const keyboard: any[] = [[
          {
            text: '🔄 Обновить',
            callback_data: 'refresh_leaderboard'
          }
        ]];
        
        if (!isDevelopment) {
          keyboard[0].push({
            text: '🎮 Играть',
            web_app: {
              url: `${webappUrl}/game`
            }
          });
        }

        await ctx.reply(message, { 
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: keyboard
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
      
      if (callbackData === 'show_leaderboard') {
        await ctx.answerCbQuery('📊 Загружаем таблицу лидеров...');
        // Trigger leaderboard command
        try {
          const response = await axios.get(`${this.apiBaseUrl}/leaderboard?limit=10`);
          const leaderboard = response.data;

          if (!leaderboard.entries || leaderboard.entries.length === 0) {
            await ctx.editMessageText('📊 Таблица лидеров пуста. Станьте первым!');
            return;
          }

          let message = '🏆 <b>Топ-10 игроков:</b>\n\n';
          
          leaderboard.entries.forEach((entry: any, index: number) => {
            const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🏅';
            message += `${medal} <b>${index + 1}.</b> ${entry.username}: <b>${entry.clicks}</b> кликов\n`;
          });

          message += `\n🎯 <b>Всего кликов:</b> ${leaderboard.globalClicks || 0}`;

          await ctx.editMessageText(message, { 
            parse_mode: 'HTML',
            reply_markup: {
              inline_keyboard: [[
                {
                  text: '🔄 Обновить',
                  callback_data: 'refresh_leaderboard'
                }
              ]]
            }
          });
        } catch (error) {
          this.logger.error('Failed to get leaderboard:', error);
          await ctx.editMessageText('❌ Не удалось загрузить таблицу лидеров. Попробуйте позже.');
        }
      } else if (callbackData === 'refresh_leaderboard') {
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
      this.startPolling();
      return;
    }

    // Check if URL is HTTPS for production webhook
    if (!webhookUrl.startsWith('https://')) {
      this.logger.warn('Webhook URL is not HTTPS, using polling mode for local development');
      this.startPolling();
      return;
    }

    try {
      await this.bot.telegram.setWebhook(`${webhookUrl}/webhook`);
      this.logger.log(`✅ Webhook set to: ${webhookUrl}/webhook`);
    } catch (error) {
      this.logger.error('Failed to set webhook, falling back to polling:', error);
      this.startPolling();
    }
  }

  private startPolling() {
    this.logger.log('🔄 Starting polling mode...');
    this.bot.launch();
    this.logger.log('✅ Bot polling started successfully');
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
