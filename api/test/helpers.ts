import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import bcrypt from 'bcryptjs';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { setupApp } from '../src/setup-app.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

export const PASSWORD = 'Senha@1234';

export async function createTestApp() {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app = setupApp(moduleRef.createNestApplication());
  await app.init();
  return { app, prisma: app.get(PrismaService) };
}

export async function resetDatabase(prisma: PrismaService) {
  await prisma.$executeRawUnsafe(`
    TRUNCATE "LessonProgress", "Enrollment", "LearningPathCourse", "LearningPath", "Lesson",
      "CourseModule", "Course", "Category", "Banner", "PasswordResetToken", "RefreshToken", "User"
    CASCADE`);
}

export async function createUser(
  prisma: PrismaService,
  data: { email: string; role?: 'ADMIN' | 'STUDENT'; active?: boolean },
) {
  return prisma.user.create({
    data: {
      name: data.email.split('@')[0],
      email: data.email,
      role: data.role ?? 'STUDENT',
      active: data.active ?? true,
      passwordHash: await bcrypt.hash(PASSWORD, 4),
    },
  });
}

export async function loginAs(app: INestApplication, email: string) {
  const response = await request(app.getHttpServer())
    .post('/api/auth/login')
    .send({ email, password: PASSWORD })
    .expect(200);
  return response.body.accessToken as string;
}

/** Creates a published course with `modules` modules of `lessonsPerModule` lessons each. */
export async function createCourse(
  prisma: PrismaService,
  opts: { title?: string; published?: boolean; featured?: boolean; modules?: number; lessonsPerModule?: number; categoryId?: string } = {},
) {
  const title = opts.title ?? `Curso ${Math.random().toString(36).slice(2, 8)}`;
  return prisma.course.create({
    data: {
      title,
      slug: title.toLowerCase().replace(/\s+/g, '-'),
      published: opts.published ?? true,
      featured: opts.featured ?? false,
      categoryId: opts.categoryId,
      modules: {
        create: Array.from({ length: opts.modules ?? 1 }, (_, m) => ({
          title: `Módulo ${m + 1}`,
          position: m,
          lessons: {
            create: Array.from({ length: opts.lessonsPerModule ?? 2 }, (_, l) => ({
              title: `Aula ${m + 1}.${l + 1}`,
              position: l,
            })),
          },
        })),
      },
    },
    include: {
      modules: { orderBy: { position: 'asc' }, include: { lessons: { orderBy: { position: 'asc' } } } },
    },
  });
}
