import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { ProgressService } from '../progress/progress.service.js';
import type { AuthUser } from '../../common/decorators/current-user.decorator.js';
import type { UpdateProgressDto } from './dto/progress.dto.js';

const lessonOutlineSelect = {
  id: true,
  title: true,
  durationSec: true,
  position: true,
} as const;

@Injectable()
export class StudentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly progress: ProgressService,
  ) {}

  async course(user: AuthUser, courseId: string) {
    const course = await this.prisma.course.findFirst({
      where: { id: courseId, ...this.visibility(user) },
      include: {
        category: { select: { id: true, name: true } },
        modules: {
          orderBy: { position: 'asc' },
          include: { lessons: { orderBy: { position: 'asc' }, select: lessonOutlineSelect } },
        },
      },
    });
    if (!course) throw new NotFoundException('Curso não encontrado');

    const lessonIds = course.modules.flatMap((module) => module.lessons.map((lesson) => lesson.id));
    const [completedIds, enrollment, progressMap] = await Promise.all([
      this.completedLessonIds(user.sub, lessonIds),
      this.prisma.enrollment.findUnique({
        where: { userId_courseId: { userId: user.sub, courseId } },
      }),
      this.progress.forCourses(user.sub, [courseId]),
    ]);

    const firstPending = lessonIds.find((id) => !completedIds.has(id));
    return {
      ...course,
      modules: course.modules.map((module) => ({
        ...module,
        lessons: module.lessons.map((lesson) => ({
          ...lesson,
          completed: completedIds.has(lesson.id),
        })),
      })),
      progress: progressMap.get(courseId),
      nextLessonId: enrollment?.lastLessonId ?? firstPending ?? lessonIds[0] ?? null,
    };
  }

  async lesson(user: AuthUser, lessonId: string) {
    const lesson = await this.prisma.lesson.findFirst({
      where: { id: lessonId, module: { course: this.visibility(user) } },
      include: { module: { select: { id: true, title: true, courseId: true } } },
    });
    if (!lesson) throw new NotFoundException('Aula não encontrada');

    const courseId = lesson.module.courseId;
    const outline = await this.prisma.lesson.findMany({
      where: { module: { courseId } },
      orderBy: [{ module: { position: 'asc' } }, { position: 'asc' }],
      select: { id: true },
    });
    const index = outline.findIndex((item) => item.id === lessonId);

    const [progress, course] = await Promise.all([
      this.prisma.lessonProgress.findUnique({
        where: { userId_lessonId: { userId: user.sub, lessonId } },
      }),
      this.prisma.course.findUniqueOrThrow({
        where: { id: courseId },
        select: { id: true, title: true },
      }),
      this.prisma.enrollment.upsert({
        where: { userId_courseId: { userId: user.sub, courseId } },
        create: { userId: user.sub, courseId, lastLessonId: lessonId },
        update: { lastLessonId: lessonId, lastAccessedAt: new Date() },
      }),
    ]);

    return {
      ...lesson,
      course,
      previousLessonId: outline[index - 1]?.id ?? null,
      nextLessonId: outline[index + 1]?.id ?? null,
      progress: {
        positionSec: progress?.positionSec ?? 0,
        completed: progress?.completed ?? false,
      },
    };
  }

  async updateProgress(user: AuthUser, lessonId: string, dto: UpdateProgressDto) {
    const lesson = await this.prisma.lesson.findFirst({
      where: { id: lessonId, module: { course: this.visibility(user) } },
      select: { id: true },
    });
    if (!lesson) throw new NotFoundException('Aula não encontrada');

    const key = { userId_lessonId: { userId: user.sub, lessonId } };
    const current = await this.prisma.lessonProgress.findUnique({ where: key });
    // Once completed, a lesson stays completed unless explicitly reset.
    const completed = dto.completed ?? current?.completed ?? false;
    return this.prisma.lessonProgress.upsert({
      where: key,
      create: { userId: user.sub, lessonId, positionSec: dto.positionSec, completed },
      update: { positionSec: dto.positionSec, completed },
      select: { lessonId: true, positionSec: true, completed: true },
    });
  }

  async summary(userId: string) {
    const enrollments = await this.prisma.enrollment.findMany({
      where: { userId, course: { published: true } },
      orderBy: { lastAccessedAt: 'desc' },
      include: {
        course: {
          select: { id: true, title: true, thumbnailUrl: true, workloadHours: true },
        },
      },
    });
    const progress = await this.progress.forCourses(
      userId,
      enrollments.map((enrollment) => enrollment.courseId),
    );
    const courses = enrollments.map((enrollment) => ({
      ...enrollment.course,
      lastLessonId: enrollment.lastLessonId,
      lastAccessedAt: enrollment.lastAccessedAt,
      progress: progress.get(enrollment.courseId)!,
    }));
    const completedLessons = await this.prisma.lessonProgress.count({
      where: { userId, completed: true },
    });
    return {
      completedLessons,
      completedCourses: courses.filter((course) => course.progress.percent === 100).length,
      inProgressCourses: courses.filter((course) => course.progress.percent < 100).length,
      continueWatching: courses.filter((course) => course.progress.percent < 100).slice(0, 8),
      courses,
    };
  }

  async learningPath(userId: string, pathId: string) {
    const path = await this.prisma.learningPath.findFirst({
      where: { id: pathId, published: true },
      include: {
        courses: {
          where: { course: { published: true } },
          orderBy: { position: 'asc' },
          include: {
            course: {
              select: { id: true, title: true, description: true, thumbnailUrl: true, workloadHours: true },
            },
          },
        },
      },
    });
    if (!path) throw new NotFoundException('Trilha não encontrada');
    const progress = await this.progress.forCourses(
      userId,
      path.courses.map((item) => item.courseId),
    );
    return {
      ...path,
      courses: path.courses.map((item) => ({
        ...item.course,
        progress: progress.get(item.courseId),
      })),
    };
  }

  private visibility(user: AuthUser) {
    return user.role === 'ADMIN' ? {} : { published: true };
  }

  private async completedLessonIds(userId: string, lessonIds: string[]) {
    const rows = await this.prisma.lessonProgress.findMany({
      where: { userId, completed: true, lessonId: { in: lessonIds } },
      select: { lessonId: true },
    });
    return new Set(rows.map((row) => row.lessonId));
  }
}
