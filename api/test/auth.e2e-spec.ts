import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, createUser, loginAs, PASSWORD, resetDatabase } from './helpers.js';
import { AuthService } from '../src/modules/auth/auth.service.js';
import type { PrismaService } from '../src/prisma/prisma.service.js';

function refreshCookie(response: request.Response): string {
  const cookies = response.headers['set-cookie'] as unknown as string[];
  return cookies.find((cookie) => cookie.startsWith('refresh_token='))!.split(';')[0];
}

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => ({ app, prisma } = await createTestApp()));
  afterAll(() => app.close());
  beforeEach(async () => {
    await resetDatabase(prisma);
    await createUser(prisma, { email: 'aluno@test.local' });
  });

  it('logs in with valid credentials and sets an httpOnly refresh cookie', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'ALUNO@test.local', password: PASSWORD })
      .expect(200);
    expect(response.body.accessToken).toBeTypeOf('string');
    expect(response.body.user).toMatchObject({ email: 'aluno@test.local', role: 'STUDENT' });
    expect(response.body.user.passwordHash).toBeUndefined();
    expect(response.headers['set-cookie'][0]).toMatch(/HttpOnly/);
  });

  it('rejects wrong password, unknown email and inactive users', async () => {
    await createUser(prisma, { email: 'inativo@test.local', active: false });
    for (const body of [
      { email: 'aluno@test.local', password: 'errada' },
      { email: 'ninguem@test.local', password: PASSWORD },
      { email: 'inativo@test.local', password: PASSWORD },
    ]) {
      await request(app.getHttpServer()).post('/api/auth/login').send(body).expect(401);
    }
  });

  it('validates the login payload', async () => {
    await request(app.getHttpServer()).post('/api/auth/login').send({ email: 'x' }).expect(400);
  });

  it('returns the current user on /me and blocks requests without token', async () => {
    const token = await loginAs(app, 'aluno@test.local');
    const me = await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(me.body.email).toBe('aluno@test.local');
    await request(app.getHttpServer()).get('/api/auth/me').expect(401);
    await request(app.getHttpServer()).get('/api/auth/me').set('Authorization', 'Bearer invalid').expect(401);
  });

  it('rotates the refresh token and rejects reuse of the old one', async () => {
    const login = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'aluno@test.local', password: PASSWORD });
    const cookie = refreshCookie(login);

    const refreshed = await request(app.getHttpServer())
      .post('/api/auth/refresh')
      .set('Cookie', cookie)
      .expect(200);
    expect(refreshed.body.accessToken).toBeTypeOf('string');
    expect(refreshCookie(refreshed)).not.toBe(cookie);

    await request(app.getHttpServer()).post('/api/auth/refresh').set('Cookie', cookie).expect(401);
    await request(app.getHttpServer()).post('/api/auth/refresh').expect(401);
  });

  it('revokes the refresh token on logout', async () => {
    const login = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'aluno@test.local', password: PASSWORD });
    const cookie = refreshCookie(login);
    await request(app.getHttpServer()).post('/api/auth/logout').set('Cookie', cookie).expect(204);
    await request(app.getHttpServer()).post('/api/auth/refresh').set('Cookie', cookie).expect(401);
  });

  it('resets the password with a valid token only once', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/forgot-password')
      .send({ email: 'desconhecido@test.local' })
      .expect(202);

    const token = await app.get(AuthService).forgotPassword('aluno@test.local');
    expect(token).toBeTypeOf('string');

    await request(app.getHttpServer())
      .post('/api/auth/reset-password')
      .send({ token, password: 'NovaSenha@123' })
      .expect(204);
    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'aluno@test.local', password: 'NovaSenha@123' })
      .expect(200);
    await request(app.getHttpServer())
      .post('/api/auth/reset-password')
      .send({ token, password: 'OutraSenha@123' })
      .expect(400);
  });
});
