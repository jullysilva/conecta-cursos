import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createCourse, createTestApp, createUser, loginAs, resetDatabase } from './helpers.js';
import type { PrismaService } from '../src/prisma/prisma.service.js';

describe('Portal and student (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let token: string;

  const get = (url: string) =>
    request(app.getHttpServer()).get(url).set('Authorization', `Bearer ${token}`);
  const put = (url: string, body: object) =>
    request(app.getHttpServer()).put(url).set('Authorization', `Bearer ${token}`).send(body);

  beforeAll(async () => ({ app, prisma } = await createTestApp()));
  afterAll(() => app.close());
  beforeEach(async () => {
    await resetDatabase(prisma);
    await createUser(prisma, { email: 'aluno@test.local' });
    token = await loginAs(app, 'aluno@test.local');
  });

  it('lists only active banners inside their date window', async () => {
    const past = new Date(Date.now() - 86_400_000);
    await prisma.banner.createMany({
      data: [
        { title: 'Ativo', imageUrl: 'https://img/1', position: 1 },
        { title: 'Inativo', imageUrl: 'https://img/2', active: false },
        { title: 'Expirado', imageUrl: 'https://img/3', endsAt: past },
        { title: 'Primeiro', imageUrl: 'https://img/4', position: 0, startsAt: past },
      ],
    });
    const response = await get('/api/portal/banners').expect(200);
    expect(response.body.map((banner: { title: string }) => banner.title)).toEqual(['Primeiro', 'Ativo']);
  });

  it('groups published courses by category with progress', async () => {
    const category = await prisma.category.create({ data: { name: 'Gestão', slug: 'gestao' } });
    await prisma.category.create({ data: { name: 'Vazia', slug: 'vazia' } });
    await createCourse(prisma, { title: 'Publicado', categoryId: category.id });
    await createCourse(prisma, { title: 'Rascunho', categoryId: category.id, published: false });

    const response = await get('/api/portal/categories').expect(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].courses).toHaveLength(1);
    expect(response.body[0].courses[0]).toMatchObject({
      title: 'Publicado',
      progress: { totalLessons: 2, completedLessons: 0, percent: 0 },
    });
  });

  it('returns the featured course or null', async () => {
    expect((await get('/api/portal/featured-course').expect(200)).body).toEqual({});
    await createCourse(prisma, { title: 'Destaque', featured: true });
    expect((await get('/api/portal/featured-course').expect(200)).body.title).toBe('Destaque');
  });

  it('hides unpublished courses from students but not from admins', async () => {
    const draft = await createCourse(prisma, { published: false });
    await get(`/api/student/courses/${draft.id}`).expect(404);
    await get(`/api/student/lessons/${draft.modules[0].lessons[0].id}`).expect(404);

    await createUser(prisma, { email: 'admin@test.local', role: 'ADMIN' });
    token = await loginAs(app, 'admin@test.local');
    await get(`/api/student/courses/${draft.id}`).expect(200);
  });

  it('tracks lesson progress, navigation and the continue-watching summary', async () => {
    const course = await createCourse(prisma, { modules: 2, lessonsPerModule: 2 });
    const lessons = course.modules.flatMap((module) => module.lessons);

    const lesson = await get(`/api/student/lessons/${lessons[1].id}`).expect(200);
    expect(lesson.body).toMatchObject({
      previousLessonId: lessons[0].id,
      nextLessonId: lessons[2].id,
      course: { id: course.id },
      progress: { positionSec: 0, completed: false },
    });

    await put(`/api/student/lessons/${lessons[1].id}/progress`, { positionSec: 42 }).expect(200);
    await put(`/api/student/lessons/${lessons[0].id}/progress`, { positionSec: 10, completed: true }).expect(200);
    // A later position update must not "uncomplete" the lesson.
    const kept = await put(`/api/student/lessons/${lessons[0].id}/progress`, { positionSec: 5 }).expect(200);
    expect(kept.body.completed).toBe(true);

    const detail = await get(`/api/student/courses/${course.id}`).expect(200);
    expect(detail.body.progress).toEqual({ totalLessons: 4, completedLessons: 1, percent: 25 });
    expect(detail.body.nextLessonId).toBe(lessons[1].id);
    expect(detail.body.modules[0].lessons[0].completed).toBe(true);

    const summary = await get('/api/student/summary').expect(200);
    expect(summary.body).toMatchObject({ completedLessons: 1, inProgressCourses: 1, completedCourses: 0 });
    expect(summary.body.continueWatching[0]).toMatchObject({ id: course.id, lastLessonId: lessons[1].id });
  });

  it('accepts beacon progress with the token in the body', async () => {
    const course = await createCourse(prisma);
    const lessonId = course.modules[0].lessons[0].id;
    await request(app.getHttpServer())
      .post(`/api/student/lessons/${lessonId}/progress/beacon`)
      .send({ token, positionSec: 30 })
      .expect(204);
    await request(app.getHttpServer())
      .post(`/api/student/lessons/${lessonId}/progress/beacon`)
      .send({ token: 'invalid', positionSec: 30 })
      .expect(401);
    const lesson = await get(`/api/student/lessons/${lessonId}`).expect(200);
    expect(lesson.body.progress.positionSec).toBe(30);
  });

  it('lists published learning paths and their courses with progress', async () => {
    const course = await createCourse(prisma);
    const path = await prisma.learningPath.create({
      data: { title: 'Trilha', published: true, courses: { create: [{ courseId: course.id }] } },
    });
    await prisma.learningPath.create({ data: { title: 'Oculta' } });

    const list = await get('/api/portal/learning-paths').expect(200);
    expect(list.body).toEqual([expect.objectContaining({ title: 'Trilha', coursesCount: 1 })]);

    const detail = await get(`/api/student/learning-paths/${path.id}`).expect(200);
    expect(detail.body.courses[0]).toMatchObject({ id: course.id, progress: { percent: 0 } });
  });

  it('rejects malformed ids', async () => {
    await get('/api/student/courses/not-a-uuid').expect(400);
  });
});
