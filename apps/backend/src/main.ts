import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env from root directory
config({ path: resolve(__dirname, '../../../.env') });

// Construct DATABASE_URL if not set (for local development)
if (!process.env.DATABASE_URL && process.env.POSTGRES_PASSWORD) {
  process.env.DATABASE_URL = `postgresql://postgres:${process.env.POSTGRES_PASSWORD}@localhost:5432/remote_jobs`;
}

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  
  // CORS: Only allow requests from our frontend
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'https://remotecn.com',
      'https://www.remotecn.com',
    ],
    methods: ['GET', 'POST'],
    credentials: true,
  });
  await app.listen(4000);
  console.log('Backend API running on http://localhost:4000');
}
bootstrap();
