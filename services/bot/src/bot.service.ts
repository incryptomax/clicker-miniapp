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
      await this.setBotCommands();
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

  // Welcome Message with three values as per Telegram Technical Test
  private async showWelcomeMessage(ctx: any, userId: number) {
    try {
      // Get user's clicks from Redis by finding the internal user ID first
      let userClicks = 0;
      
      try {
        const userResponse = await axios.get(`${this.apiBaseUrl}/user/${userId}`);
        if (userResponse.data && userResponse.data.id) {
          const internalUserId = userResponse.data.id;
          userClicks = await this.redisService.getUserClicks(internalUserId);
        }
      } catch (error) {
        // If user not found in API, try direct Redis lookup by Telegram ID
        userClicks = await this.redisService.getUserClicks(userId);
      }
      
      // Get global clicks
      const globalClicks = await this.redisService.getGlobalClicks();
      
      // Get leaderboard (top 20 as per specs)
      const response = await axios.get(`${this.apiBaseUrl}/leaderboard?limit=20`);
      const leaderboard = response.data.entries || [];
      
      // Build leaderboard text
      let leaderboardText = '';
      if (leaderboard.length > 0) {
        leaderboardText = '\n🏆 <b>Top 20 Players:</b>\n';
        leaderboard.forEach((entry: any, index: number) => {
          const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🏅';
          const rank = index + 1;
          leaderboardText += `${medal} <b>#${rank}</b> ${entry.username}: <b>${entry.clicks}</b> clicks\n`;
        });
      } else {
        leaderboardText = '\n🏆 <b>Leaderboard:</b> No players yet!';
      }
      
      // Build Welcome Message
      const welcomeMessage = 
        `🎮 <b>Welcome to Clicker Mini App!</b>\n\n` +
        `📊 <b>Your Statistics:</b>\n` +
        `👤 <b>Your Clicks:</b> ${userClicks}\n` +
        `🌍 <b>Global Clicks:</b> ${globalClicks}\n` +
        leaderboardText + `\n\n` +
        `🎯 <b>Ready to play?</b> Click the button below to start clicking!`;
      
      // Check if we're in development mode
      const webappUrl = process.env.WEBAPP_URL || 'http://localhost:3003';
      const isDevelopment = webappUrl.startsWith('http://');
      
      const keyboard: any[] = [];
      
      if (!isDevelopment) {
        keyboard.push([
          {
            text: '🎮 Play Game',
            web_app: { url: `${webappUrl}/` }
          }
        ]);
      }
      
      keyboard.push([
        {
          text: '🔄 Refresh Stats',
          callback_data: 'refresh_welcome'
        },
        {
          text: '📝 Change Name',
          callback_data: 'change_username'
        }
      ]);
      
      await ctx.reply(welcomeMessage, {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: keyboard
        }
      });
      
    } catch (error) {
      this.logger.error('Failed to show welcome message:', error);
      await ctx.reply(
        `🎮 <b>Welcome to Clicker Mini App!</b>\n\n` +
        `❌ Unable to load statistics right now.\n` +
        `Please try again in a moment.`,
        { parse_mode: 'HTML' }
      );
    }
  }

  private setupCommands() {
    // Start command - Main flow according to Telegram Technical Test
    this.bot.start(async (ctx) => {
      const userId = ctx.from.id;
      const username = ctx.from.username || ctx.from.first_name || 'User';
      
      this.logger.log(`User ${username} (${userId}) started the bot`);
      
      try {
        // Check if user exists in database
        const userResponse = await axios.get(`${this.apiBaseUrl}/user/${userId}`);
        const userExists = userResponse.status === 200;
        
        if (!userExists) {
          // New user - ask to set username
          await ctx.reply(
            `🎮 <b>Welcome to Clicker Mini App!</b>\n\n` +
            `👤 <b>Set Your Username</b>\n` +
            `Please choose a username for the leaderboard:\n\n` +
            `Current: <b>${username}</b>\n\n` +
            `You can:\n` +
            `• Use your current name\n` +
            `• Set a custom username\n` +
            `• Change it later with /changename`,
            {
              parse_mode: 'HTML',
              reply_markup: {
                inline_keyboard: [
                  [
                    {
                      text: `✅ Use "${username}"`,
                      callback_data: `confirm_username:${username}`
                    }
                  ],
                  [
                    {
                      text: '📝 Set Custom Name',
                      callback_data: 'change_username'
                    }
                  ]
                ]
              }
            }
          );
        } else {
          // Existing user - show Welcome Message with stats
          await this.showWelcomeMessage(ctx, userId);
        }
      } catch (error) {
        this.logger.error('Failed to check user existence:', error);
        // Fallback - treat as new user
        await ctx.reply(
          `🎮 <b>Welcome to Clicker Mini App!</b>\n\n` +
          `👤 <b>Set Your Username</b>\n` +
          `Please choose a username for the leaderboard:\n\n` +
          `Current: <b>${username}</b>`,
          {
            parse_mode: 'HTML',
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: `✅ Use "${username}"`,
                    callback_data: `confirm_username:${username}`
                  }
                ],
                [
                  {
                    text: '📝 Set Custom Name',
                    callback_data: 'change_username'
                  }
                ]
              ]
            }
          }
        );
      }
    });

    // Help command
    this.bot.help(async (ctx) => {
      await ctx.reply(
        `🎮 <b>Clicker Mini App - Help</b>\n\n` +
        `📋 <b>Commands:</b>\n` +
        `/start - Start the game\n` +
        `/help - Show this help\n` +
        `/leaderboard - Show the leaderboard\n` +
        `/changename - Change your username\n` +
        `/stats - View your statistics\n\n` +
        `🎯 <b>How to play:</b>\n` +
        `• Press "Play Game" button to open the game\n` +
        `• Click the button to get points\n` +
        `• Compete with other players!\n\n` +
        `💡 <b>Tip:</b> The more clicks, the higher your rank!`,
        { parse_mode: 'HTML' }
      );
    });

    // Change name command
    this.bot.command('changename', async (ctx) => {
      const userId = ctx.from.id;
      const currentUsername = ctx.from.username || ctx.from.first_name || 'User';
      
      await ctx.reply(
        `👤 <b>Change Username</b>\n\n` +
        `Current name: <b>${currentUsername}</b>\n\n` +
        `Send a new username (or use the button below):`,
        {
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [[
              {
                text: '📝 Enter New Name',
                callback_data: 'change_username'
              }
            ]]
          }
        }
      );
    });

    // Leaderboard command
    this.bot.command('leaderboard', async (ctx) => {
      try {
        const response = await axios.get(`${this.apiBaseUrl}/leaderboard?limit=10`);
        const leaderboard = response.data;

        if (!leaderboard.entries || leaderboard.entries.length === 0) {
          await ctx.reply(
            '🏆 <b>Leaderboard</b>\n\n' +
            '📊 <i>No players yet!</i>\n\n' +
            '🎯 <b>Be the first to start clicking!</b>\n' +
            'Press the button below to play:',
            {
              parse_mode: 'HTML',
              reply_markup: {
                inline_keyboard: [[
                  {
                    text: '🎮 Start Playing',
                    web_app: { url: `${process.env.WEBAPP_URL || 'http://localhost:3003'}/` }
                  }
                ]]
              }
            }
          );
          return;
        }

        let message = '🏆 <b>Top Players Leaderboard</b>\n\n';
        
        leaderboard.entries.forEach((entry: any, index: number) => {
          const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🏅';
          const rank = index + 1;
          message += `${medal} <b>#${rank}</b> ${entry.username}\n`;
          message += `   💥 <i>${entry.clicks} clicks</i>\n\n`;
        });

        message += `🌍 <b>Total Global Clicks:</b> ${leaderboard.globalClicks || 0}\n`;
        message += `👥 <b>Active Players:</b> ${leaderboard.entries.length}`;

        const webappUrl = process.env.WEBAPP_URL || 'http://localhost:3003';
        const isDevelopment = webappUrl.startsWith('http://');
        
        const keyboard: any[] = [
          [
            {
              text: '🔄 Refresh',
              callback_data: 'refresh_leaderboard'
            },
            {
              text: '📊 My Stats',
              callback_data: 'show_my_stats'
            }
          ]
        ];
        
        if (!isDevelopment) {
          keyboard.push([
            {
              text: '🎮 Play Game',
              web_app: { url: `${webappUrl}/` }
            }
          ]);
        }

        await ctx.reply(message, { 
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: keyboard
          }
        });
      } catch (error) {
        this.logger.error('Failed to get leaderboard:', error);
        await ctx.reply(
          '❌ <b>Oops! Something went wrong</b>\n\n' +
          'Unable to load leaderboard right now.\n' +
          'Please try again in a moment.',
          { parse_mode: 'HTML' }
        );
      }
    });

    // Stats command
    this.bot.command('stats', async (ctx) => {
      try {
        const userId = ctx.from.id;
        
        // Get user's clicks from Redis by finding the internal user ID first
        let userClicks = 0;
        
        // Try to find user in database to get internal ID
        try {
          this.logger.log(`🔍 Looking for user with Telegram ID: ${userId}`);
          this.logger.log(`🔍 API URL: ${this.apiBaseUrl}/user/${userId}`);
          const userResponse = await axios.get(`${this.apiBaseUrl}/user/${userId}`);
          this.logger.log(`✅ User found: ${JSON.stringify(userResponse.data)}`);
          if (userResponse.data && userResponse.data.id) {
            const internalUserId = userResponse.data.id;
            this.logger.log(`🔍 Getting clicks for internal user ID: ${internalUserId}`);
            userClicks = await this.redisService.getUserClicks(internalUserId);
            this.logger.log(`✅ User clicks: ${userClicks}`);
          }
        } catch (error) {
          this.logger.error(`❌ Failed to get user from API: ${error.message}`);
          this.logger.error(`❌ Error details: ${JSON.stringify(error.response?.data || error.message)}`);
          // If user not found in API, try direct Redis lookup by Telegram ID
          this.logger.log(`🔍 Trying direct Redis lookup for Telegram ID: ${userId}`);
          userClicks = await this.redisService.getUserClicks(userId);
          this.logger.log(`✅ Direct Redis clicks: ${userClicks}`);
        }
        
        // Get global clicks
        const globalClicks = await this.redisService.getGlobalClicks();
        
        // Get leaderboard to find user's rank
        this.logger.log(`🔍 Getting leaderboard to find user rank...`);
        const response = await axios.get(`${this.apiBaseUrl}/leaderboard`);
        const leaderboard = response.data.entries || [];
        this.logger.log(`✅ Leaderboard entries: ${leaderboard.length}`);
        
        const userRank = leaderboard.findIndex(player => player.tgUserId === userId.toString()) + 1;
        this.logger.log(`🔍 User rank calculation: tgUserId=${userId}, found at index=${leaderboard.findIndex(player => player.tgUserId === userId.toString())}, rank=${userRank}`);
        
        let message = '📊 <b>Your Statistics</b>\n\n';
        message += `👤 <b>Your Clicks:</b> ${userClicks}\n`;
        message += `🌍 <b>Global Clicks:</b> ${globalClicks}\n`;
        
        if (userRank > 0) {
          message += `🏆 <b>Your Rank:</b> #${userRank}\n`;
        } else {
          message += `🏆 <b>Your Rank:</b> Not ranked yet\n`;
        }
        
        message += `\n💡 <i>Keep clicking to improve your rank!</i>`;
        
        const webappUrl = process.env.WEBAPP_URL || 'http://localhost:3003';
        const keyboard = [[
          { text: '🎮 Play Game', web_app: { url: `${webappUrl}/` } },
          { text: '🏆 Leaderboard', callback_data: 'show_leaderboard' }
        ]];
        
        await ctx.reply(message, {
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: keyboard
          }
        });
      } catch (error) {
        this.logger.error('Failed to get user stats:', error);
        await ctx.reply('❌ Failed to get your statistics. Please try again later.');
      }
    });

    // Text message handler for username changes
    this.bot.on('text', async (ctx) => {
      const message = ctx.message.text;
      const userId = ctx.from.id;
      
      // Check if this is a username change (simple heuristic: not a command and not too long)
      if (!message.startsWith('/') && message.length <= 50 && message.length >= 2) {
        // This could be a username change - let's ask for confirmation
        await ctx.reply(
          `👤 <b>Confirm Username Change</b>\n\n` +
          `New name: <b>${message}</b>\n\n` +
          `Are you sure you want to change your username?`,
          {
            parse_mode: 'HTML',
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: '✅ Yes, Change',
                    callback_data: `confirm_username:${message}`
                  },
                  {
                    text: '❌ Cancel',
                    callback_data: 'cancel_username'
                  }
                ]
              ]
            }
          }
        );
      }
    });

    // Callback query handler
    this.bot.on('callback_query', async (ctx) => {
      const callbackData = (ctx.callbackQuery as any).data;
      
      if (callbackData === 'change_username') {
        await ctx.answerCbQuery('📝 Enter new username');
        await ctx.reply(
          `📝 <b>Enter new username:</b>\n\n` +
          `Just send a message with the new name. For example: "Player123"`,
          { parse_mode: 'HTML' }
        );
      } else if (callbackData === 'show_leaderboard') {
        await ctx.answerCbQuery('📊 Loading leaderboard...');
        // Trigger leaderboard command
        try {
          const response = await axios.get(`${this.apiBaseUrl}/leaderboard?limit=10`);
          const leaderboard = response.data;

          if (!leaderboard.entries || leaderboard.entries.length === 0) {
            await ctx.editMessageText('📊 Leaderboard is empty. Be the first!');
            return;
          }

          let message = '🏆 <b>Top 10 Players:</b>\n\n';
          
          leaderboard.entries.forEach((entry: any, index: number) => {
            const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🏅';
            message += `${medal} <b>${index + 1}.</b> ${entry.username}: <b>${entry.clicks}</b> clicks\n`;
          });

          message += `\n🎯 <b>Total Clicks:</b> ${leaderboard.globalClicks || 0}`;

          await ctx.editMessageText(message, { 
            parse_mode: 'HTML',
            reply_markup: {
              inline_keyboard: [[
                {
                  text: '🔄 Refresh',
                  callback_data: 'refresh_leaderboard'
                }
              ]]
            }
          });
        } catch (error) {
          this.logger.error('Failed to get leaderboard:', error);
          await ctx.editMessageText('❌ Failed to load leaderboard. Please try again later.');
        }
      } else if (callbackData === 'refresh_leaderboard') {
        await ctx.answerCbQuery('🔄 Refreshing...');
        
        try {
          // Show loading state
          await ctx.editMessageText('🔄 <b>Refreshing leaderboard...</b>', { 
            parse_mode: 'HTML',
            reply_markup: {
              inline_keyboard: [[
                {
                  text: '⏳ Loading...',
                  callback_data: 'loading'
                }
              ]]
            }
          });

          // Get fresh data
          const response = await axios.get(`${this.apiBaseUrl}/leaderboard?limit=10`);
          const leaderboard = response.data;

          if (!leaderboard.entries || leaderboard.entries.length === 0) {
            await ctx.editMessageText(
              '🏆 <b>Leaderboard</b>\n\n' +
              '📊 <i>No players yet!</i>\n\n' +
              '🎯 <b>Be the first to start clicking!</b>',
              { 
                parse_mode: 'HTML',
                reply_markup: {
                  inline_keyboard: [[
                    {
                      text: '🎮 Start Playing',
                      web_app: { url: `${process.env.WEBAPP_URL || 'http://localhost:3003'}/` }
                    }
                  ]]
                }
              }
            );
            return;
          }

          let message = '🏆 <b>Top Players Leaderboard</b>\n\n';
          
          leaderboard.entries.forEach((entry: any, index: number) => {
            const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🏅';
            const rank = index + 1;
            message += `${medal} <b>#${rank}</b> ${entry.username}\n`;
            message += `   💥 <i>${entry.clicks} clicks</i>\n\n`;
          });

          message += `🌍 <b>Total Global Clicks:</b> ${leaderboard.globalClicks || 0}\n`;
          message += `👥 <b>Active Players:</b> ${leaderboard.entries.length}`;

          const webappUrl = process.env.WEBAPP_URL || 'http://localhost:3003';
          const isDevelopment = webappUrl.startsWith('http://');
          
          const keyboard: any[] = [
            [
              {
                text: '🔄 Refresh',
                callback_data: 'refresh_leaderboard'
              },
              {
                text: '📊 My Stats',
                callback_data: 'show_my_stats'
              }
            ]
          ];
          
          if (!isDevelopment) {
            keyboard.push([
              {
                text: '🎮 Play Game',
                web_app: { url: `${webappUrl}/` }
              }
            ]);
          }

          await ctx.editMessageText(message, { 
            parse_mode: 'HTML',
            reply_markup: {
              inline_keyboard: keyboard
            }
          });
        } catch (error) {
          this.logger.error('Failed to refresh leaderboard:', error);
          await ctx.editMessageText(
            '❌ <b>Oops! Something went wrong</b>\n\n' +
            'Unable to refresh leaderboard right now.\n' +
            'Please try again in a moment.',
            { 
              parse_mode: 'HTML',
              reply_markup: {
                inline_keyboard: [[
                  {
                    text: '🔄 Try Again',
                    callback_data: 'refresh_leaderboard'
                  }
                ]]
              }
            }
          );
        }
      } else if (callbackData === 'refresh_welcome') {
        await ctx.answerCbQuery('🔄 Refreshing...');
        
        try {
          const userId = ctx.from.id;
          await this.showWelcomeMessage(ctx, userId);
        } catch (error) {
          this.logger.error('Failed to refresh welcome message:', error);
          await ctx.editMessageText(
            '❌ <b>Oops! Something went wrong</b>\n\n' +
            'Unable to refresh statistics right now.\n' +
            'Please try again in a moment.',
            { parse_mode: 'HTML' }
          );
        }
      } else if (callbackData === 'show_my_stats') {
        await ctx.answerCbQuery('📊 Loading your stats...');
        
        try {
          const userId = ctx.from.id;
          
          // Get user's clicks from Redis
          const userClicks = await this.redisService.getUserClicks(userId);
          
          // Get global clicks
          const globalClicks = await this.redisService.getGlobalClicks();
          
          // Get leaderboard to find user's rank
          const response = await axios.get(`${this.apiBaseUrl}/leaderboard`);
          const leaderboard = response.data.entries || [];
          
          const userRank = leaderboard.findIndex(player => player.tgUserId === userId.toString()) + 1;
          
          let message = '📊 <b>Your Statistics</b>\n\n';
          message += `👤 <b>Your Clicks:</b> ${userClicks}\n`;
          message += `🌍 <b>Global Clicks:</b> ${globalClicks}\n`;
          
          if (userRank > 0) {
            message += `🏆 <b>Your Rank:</b> #${userRank}\n`;
          } else {
            message += `🏆 <b>Your Rank:</b> Not ranked yet\n`;
          }
          
          message += `\n💡 <i>Keep clicking to improve your rank!</i>`;
          
          const webappUrl = process.env.WEBAPP_URL || 'http://localhost:3003';
          const keyboard = [
            [
              { text: '🎮 Play Game', web_app: { url: `${webappUrl}/` } },
              { text: '🏆 Leaderboard', callback_data: 'show_leaderboard' }
            ]
          ];
          
          await ctx.editMessageText(message, {
            parse_mode: 'HTML',
            reply_markup: {
              inline_keyboard: keyboard
            }
          });
        } catch (error) {
          this.logger.error('Failed to get user stats:', error);
          await ctx.editMessageText(
            '❌ <b>Oops! Something went wrong</b>\n\n' +
            'Unable to load your stats right now.\n' +
            'Please try again in a moment.',
            { parse_mode: 'HTML' }
          );
        }
      } else if (callbackData.startsWith('confirm_username:')) {
        const newUsername = callbackData.split(':')[1];
        const userId = ctx.from.id;
        
        await ctx.answerCbQuery('✅ Username set!');
        
        try {
         // Call API to change username using bot endpoint
         const response = await axios.post(`${this.apiBaseUrl}/user/bot/change-username`, {
           username: newUsername,
           tgUserId: ctx.from.id,
           firstName: ctx.from.first_name,
           lastName: ctx.from.last_name,
           telegramUsername: ctx.from.username
         });

          if (response.data.success) {
            // Show Welcome Message after username is set
            await this.showWelcomeMessage(ctx, userId);
          } else {
            throw new Error('API returned error');
          }
        } catch (error) {
          this.logger.error('Failed to set username:', error);
          await ctx.editMessageText('❌ Failed to set username. Please try again later.');
        }
      } else if (callbackData === 'cancel_username') {
        await ctx.answerCbQuery('❌ Cancelled');
        await ctx.editMessageText('❌ Username change cancelled.');
      }
    });
  }

  private async setBotCommands() {
    try {
      const commands = [
        { command: 'start', description: '🚀 Start the Clicker Game' },
        { command: 'help', description: '❓ Get help and instructions' },
        { command: 'changename', description: '✏️ Change your display name' },
        { command: 'leaderboard', description: '🏆 View the leaderboard' },
        { command: 'stats', description: '📊 View your statistics' }
      ];

      await this.bot.telegram.setMyCommands(commands);
      this.logger.log('✅ Bot commands set successfully');
    } catch (error) {
      this.logger.error('Failed to set bot commands:', error);
    }
  }

  private setupErrorHandling() {
    this.bot.catch((err, ctx) => {
      this.logger.error('Bot error:', err);
      ctx.reply('❌ An error occurred. Please try again later.');
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
