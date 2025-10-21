import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from 'pino';
import * as pino from 'pino';

// Simple Logger class to avoid shared dependency issues
class CustomLogger {
  private context: string;

  constructor(context: string) {
    this.context = context;
  }

  info(message: string, ...args: any[]) {
    console.log(`[${this.context}] INFO: ${message}`, ...args);
  }

  error(message: string, ...args: any[]) {
    console.error(`[${this.context}] ERROR: ${message}`, ...args);
  }
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const port = process.env.WORKER_PORT || 3002;
  await app.listen(port);
  new CustomLogger('WorkerService').info(`Worker service is running on port ${port}`);
}
bootstrap();
