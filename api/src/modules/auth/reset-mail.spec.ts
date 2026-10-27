import { JwtService } from '@nestjs/jwt';
import type { PrismaService } from '../../prisma/prisma.service.js';
import type { MailService } from '../../infra/mail/mail.service.js';
import { AuthService } from './auth.service.js';

describe('AuthService.forgotPassword', () => {
  it('escapes the user name in the reset e-mail', async () => {
    const prisma = {
      user: { findUnique: vi.fn(async () => ({ id: 'u1', name: '<a href="https://evil.test">Clique</a>', email: 'ana@x.com', active: true })) },
      passwordResetToken: { create: vi.fn(async () => ({})) },
    } as unknown as PrismaService;
    const mail = { send: vi.fn(async () => {}) } as unknown as MailService;

    await new AuthService(prisma, new JwtService({}), mail).forgotPassword('ana@x.com');

    const html = vi.mocked(mail.send).mock.calls[0][2];
    expect(html).toContain('Olá, &lt;a href=&quot;https://evil.test&quot;&gt;Clique&lt;/a&gt;.');
    expect(html).not.toContain('<a href="https://evil.test">');
  });
});
