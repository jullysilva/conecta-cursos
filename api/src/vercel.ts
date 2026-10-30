import type { IncomingMessage, ServerResponse } from 'node:http';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module.js';
import { setupApp } from './setup-app.js';

type RequestListener = (req: IncomingMessage, res: ServerResponse) => void;

let listener: Promise<RequestListener> | undefined;

/** Builds the Nest app once per function instance; warm invocations reuse it. */
async function createListener(): Promise<RequestListener> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  // Vercel's edge sets X-Forwarded-For, so the rate limiter sees each client's IP.
  app.set('trust proxy', true);
  setupApp(app);
  await app.init();
  return app.getHttpAdapter().getInstance();
}

/** Vercel Function entry point: every /api/* request is rewritten here. */
export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  listener ??= createListener().catch((error: unknown) => {
    listener = undefined;
    throw error;
  });
  (await listener)(req, res);
}
