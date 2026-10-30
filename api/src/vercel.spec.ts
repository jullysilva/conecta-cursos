import type { IncomingMessage, ServerResponse } from 'node:http';
import { NestFactory } from '@nestjs/core';

vi.mock('./app.module.js', () => ({ AppModule: class {} }));
vi.mock('./setup-app.js', () => ({ setupApp: vi.fn((app: unknown) => app) }));

const req = {} as IncomingMessage;
const res = {} as ServerResponse;

function fakeApp(listener: (...args: unknown[]) => void) {
  return {
    set: vi.fn(),
    init: vi.fn().mockResolvedValue(undefined),
    getHttpAdapter: () => ({ getInstance: () => listener }),
  };
}

describe('Vercel handler', () => {
  beforeEach(() => vi.resetModules());
  afterEach(() => vi.restoreAllMocks());

  it('boots the app once, trusts the proxy and forwards every request', async () => {
    const listener = vi.fn();
    const app = fakeApp(listener);
    const create = vi.spyOn(NestFactory, 'create').mockResolvedValue(app as never);
    const { default: handler } = await import('./vercel.js');

    await handler(req, res);
    await handler(req, res);

    expect(create).toHaveBeenCalledTimes(1);
    expect(app.set).toHaveBeenCalledWith('trust proxy', true);
    expect(app.init).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledTimes(2);
    expect(listener).toHaveBeenCalledWith(req, res);
  });

  it('retries the boot on the next request when it fails', async () => {
    const listener = vi.fn();
    const create = vi
      .spyOn(NestFactory, 'create')
      .mockRejectedValueOnce(new Error('db down'))
      .mockResolvedValueOnce(fakeApp(listener) as never);
    const { default: handler } = await import('./vercel.js');

    await expect(handler(req, res)).rejects.toThrow('db down');
    await handler(req, res);

    expect(create).toHaveBeenCalledTimes(2);
    expect(listener).toHaveBeenCalledWith(req, res);
  });
});
