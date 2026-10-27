import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { PrismaService } from '../../prisma/prisma.service.js';
import type { MailService } from '../../infra/mail/mail.service.js';
import { AuthService } from './auth.service.js';

const flush = () => new Promise((resolve) => setImmediate(resolve));

function setup(findUser: () => Promise<unknown>) {
  const prisma = {
    user: { findUnique: vi.fn(findUser) },
    passwordResetToken: { create: vi.fn(async () => ({})) },
  } as unknown as PrismaService;
  // A send that never settles stands in for a slow or hanging SMTP server.
  const mail = { send: vi.fn(() => new Promise<void>(() => {})) } as unknown as MailService;
  return { service: new AuthService(prisma, new JwtService({}), mail), prisma, mail };
}

describe('AuthService.requestPasswordReset', () => {
  afterEach(() => vi.restoreAllMocks());

  it('returns before the reset e-mail is sent, then sends it in the background', async () => {
    const { service, mail } = setup(async () => ({ id: 'u1', name: 'Ana', email: 'ana@x.com', active: true }));

    expect(service.requestPasswordReset('ANA@x.com')).toBeUndefined();
    expect(mail.send).not.toHaveBeenCalled();

    await flush();
    expect(mail.send).toHaveBeenCalledWith('ana@x.com', 'Redefinição de senha', expect.stringContaining('/redefinir-senha?token='));
  });

  it('does nothing for unknown e-mails', async () => {
    const { service, prisma, mail } = setup(async () => null);
    service.requestPasswordReset('ghost@x.com');
    await flush();
    expect(prisma.passwordResetToken.create).not.toHaveBeenCalled();
    expect(mail.send).not.toHaveBeenCalled();
  });

  it('logs failures instead of leaking an unhandled rejection', async () => {
    const logged = vi.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
    const { service } = setup(async () => {
      throw new Error('database down');
    });
    service.requestPasswordReset('ana@x.com');
    await flush();
    expect(logged).toHaveBeenCalledWith('Failed to process password reset request', expect.any(Error));
  });
});
