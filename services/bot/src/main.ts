import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('BotService');
  
  try {
    const app = await NestFactory.create(AppModule);
    
    // Enable CORS for webhook
    app.enableCors({
      origin: true,
      credentials: true,
    });
    
    const port = process.env.PORT || 3001;
    await app.listen(port);
    
    logger.log(`🤖 Bot service is running on port ${port}`);
    logger.log(`📡 Webhook URL: ${process.env.TELEGRAM_WEBHOOK_URL}/webhook`);
  } catch (error) {
    logger.error('Failed to start Bot service:', error);
    process.exit(1);
  }
}

bootstrap();
