import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createCourse, createTestApp, createUser, loginAs, resetDatabase } from './helpers.js';
import type { PrismaService } from '../src/prisma/prisma.service.js';

describe('Admin (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let token: string;
  let adminId: string;

  const call = (method: 'get' | 'post' | 'patch' | 'put' | 'delete', url: string, body?: object) => {
    const req = request(app.getHttpServer())[method](url).set('Authorization', `Bearer ${token}`);
    return body ? req.send(body) : req;
  };

  beforeAll(async () => ({ app, prisma } = await createTestApp()));
  afterAll(() => app.close());
  beforeEach(async () => {
    await resetDatabase(prisma);
    adminId = (await createUser(prisma, { email: 'admin@test.local', role: 'ADMIN' })).id;
    token = await loginAs(app, 'admin@test.local');
  });

  it('forbids students from admin routes', async () => {
    await createUser(prisma, { email: 'aluno@test.local' });
    token = await loginAs(app, 'aluno@test.local');
    for (const url of ['/api/admin/dashboard', '/api/admin/users', '/api/admin/courses', '/api/admin/banners']) {
      await call('get', url).expect(403);
    }
  });

  it('returns dashboard metrics', async () => {
    await createCourse(prisma);
    const response = await call('get', '/api/admin/dashboard').expect(200);
    expect(response.body).toMatchObject({ admins: 1, students: 0, courses: 1, publishedCourses: 1, lessons: 2 });
  });

  it('manages users with search, pagination and self-protection', async () => {
    const created = await call('post', '/api/admin/users', {
      name: 'Maria Souza', email: 'Maria@Test.local', password: 'Senha@1234',
    }).expect(201);
    expect(created.body).toMatchObject({ email: 'maria@test.local', role: 'STUDENT' });
    expect(created.body.passwordHash).toBeUndefined();

    await call('post', '/api/admin/users', { name: 'Dup', email: 'maria@test.local', password: 'Senha@1234' }).expect(409);

    const list = await call('get', '/api/admin/users?search=maria&pageSize=10').expect(200);
    expect(list.body).toMatchObject({ total: 1, page: 1, pageSize: 10 });

    const updated = await call('patch', `/api/admin/users/${created.body.id}`, { role: 'ADMIN' }).expect(200);
    expect(updated.body.role).toBe('ADMIN');

    await call('patch', `/api/admin/users/${adminId}`, { active: false }).expect(400);
    await call('delete', `/api/admin/users/${adminId}`).expect(400);
    await call('delete', `/api/admin/users/${created.body.id}`).expect(204);
    await call('get', `/api/admin/users/${created.body.id}`).expect(404);
  });

  it('manages categories with unique slugs', async () => {
    const first = await call('post', '/api/admin/categories', { name: 'Gestão de Pessoas' }).expect(201);
    const second = await call('post', '/api/admin/categories', { name: 'Gestão de Pessoas' }).expect(201);
    expect(first.body.slug).toBe('gestao-de-pessoas');
    expect(second.body.slug).toBe('gestao-de-pessoas-2');
    await call('patch', `/api/admin/categories/${first.body.id}`, { position: 3 }).expect(200);
    const list = await call('get', '/api/admin/categories').expect(200);
    expect(list.body[0]._count.courses).toBe(0);
    await call('delete', `/api/admin/categories/${first.body.id}`).expect(204);
  });

  it('builds a course with modules and lessons, including reordering', async () => {
    const course = await call('post', '/api/admin/courses', { title: 'Novo Curso', workloadHours: 4 }).expect(201);
    expect(course.body).toMatchObject({ slug: 'novo-curso', published: false });

    const m1 = await call('post', `/api/admin/courses/${course.body.id}/modules`, { title: 'Intro' }).expect(201);
    const m2 = await call('post', `/api/admin/courses/${course.body.id}/modules`, { title: 'Avançado' }).expect(201);
    expect(m2.body.position).toBe(1);

    const l1 = await call('post', `/api/admin/modules/${m1.body.id}/lessons`, {
      title: 'Boas-vindas', videoProvider: 'YOUTUBE', videoRef: 'abc123',
    }).expect(201);
    const l2 = await call('post', `/api/admin/modules/${m1.body.id}/lessons`, { title: 'Segunda' }).expect(201);

    await call('put', `/api/admin/courses/${course.body.id}/modules/order`, { ids: [m2.body.id, m1.body.id] }).expect(204);
    await call('put', `/api/admin/modules/${m1.body.id}/lessons/order`, { ids: [l2.body.id, l1.body.id] }).expect(204);
    await call('put', `/api/admin/modules/${m1.body.id}/lessons/order`, { ids: [l2.body.id] }).expect(400);

    await call('patch', `/api/admin/lessons/${l1.body.id}`, { moduleId: m2.body.id }).expect(200);
    await call('patch', `/api/admin/courses/${course.body.id}`, { title: 'Curso Renomeado', published: true }).expect(200);

    const detail = await call('get', `/api/admin/courses/${course.body.id}`).expect(200);
    expect(detail.body.slug).toBe('curso-renomeado');
    expect(detail.body.modules.map((m: { title: string }) => m.title)).toEqual(['Avançado', 'Intro']);
    expect(detail.body.modules[0].lessons[0].title).toBe('Boas-vindas');

    const other = await createCourse(prisma);
    await call('patch', `/api/admin/lessons/${l2.body.id}`, { moduleId: other.modules[0].id }).expect(400);

    await call('patch', `/api/admin/modules/${m1.body.id}`, { title: 'Introdução' }).expect(200);
    await call('delete', `/api/admin/lessons/${l2.body.id}`).expect(204);
    await call('delete', `/api/admin/modules/${m1.body.id}`).expect(204);

    const list = await call('get', '/api/admin/courses?search=renomeado').expect(200);
    expect(list.body.total).toBe(1);
    const options = await call('get', '/api/admin/courses/options').expect(200);
    expect(options.body).toHaveLength(2);

    await call('delete', `/api/admin/courses/${course.body.id}`).expect(204);
    await call('get', `/api/admin/courses/${course.body.id}`).expect(404);
  });

  it('rejects unknown fields and invalid urls', async () => {
    await call('post', '/api/admin/courses', { title: 'Curso', hacker: true }).expect(400);
    await call('post', '/api/admin/courses', { title: 'Curso', thumbnailUrl: 'nota-url' }).expect(400);
  });

  it('manages learning paths with ordered courses', async () => {
    const [a, b] = [await createCourse(prisma), await createCourse(prisma)];
    const path = await call('post', '/api/admin/learning-paths', { title: 'Trilha X', courseIds: [a.id, b.id] }).expect(201);
    expect(path.body.courseIds).toEqual([a.id, b.id]);
    const updated = await call('patch', `/api/admin/learning-paths/${path.body.id}`, { courseIds: [b.id] }).expect(200);
    expect(updated.body.courseIds).toEqual([b.id]);
    const list = await call('get', '/api/admin/learning-paths').expect(200);
    expect(list.body[0].courseIds).toEqual([b.id]);
    await call('delete', `/api/admin/learning-paths/${path.body.id}`).expect(204);
  });

  it('manages banners', async () => {
    const banner = await call('post', '/api/admin/banners', {
      title: 'Promo', imageUrl: 'https://img.local/x.png', endsAt: '2030-01-01T00:00:00.000Z',
    }).expect(201);
    await call('patch', `/api/admin/banners/${banner.body.id}`, { active: false }).expect(200);
    expect((await call('get', `/api/admin/banners/${banner.body.id}`).expect(200)).body.active).toBe(false);
    expect((await call('get', '/api/admin/banners').expect(200)).body).toHaveLength(1);
    await call('delete', `/api/admin/banners/${banner.body.id}`).expect(204);
    await call('delete', `/api/admin/banners/${banner.body.id}`).expect(404);
  });
});
