import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { setupApp } from './setup-app.js';
import { env } from './config/env.js';

async function bootstrap() {
  const app = setupApp(await NestFactory.create(AppModule));
  app.enableShutdownHooks();
  await app.listen(env.port);
}
await bootstrap();
