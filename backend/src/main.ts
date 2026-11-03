import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  const origin = config.get<string>('FRONTEND_ORIGIN', 'http://localhost:3000');

  app.setGlobalPrefix('api');
  app.enableCors({ origin });
  app.enableShutdownHooks();

  const port = Number(config.get<string>('PORT', '3001'));
  await app.listen(port, '0.0.0.0');
}

void bootstrap();
