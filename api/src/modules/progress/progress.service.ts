import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';

export interface CourseProgress {
  totalLessons: number;
  completedLessons: number;
  percent: number;
}

@Injectable()
export class ProgressService {
  constructor(private readonly prisma: PrismaService) {}

  /** Returns progress per course id for the given user, in two aggregated queries. */
  async forCourses(userId: string, courseIds: string[]): Promise<Map<string, CourseProgress>> {
    const result = new Map<string, CourseProgress>();
    if (!courseIds.length) return result;

    const [lessons, completed] = await Promise.all([
      this.prisma.lesson.findMany({
        where: { module: { courseId: { in: courseIds } } },
        select: { module: { select: { courseId: true } } },
      }),
      this.prisma.lessonProgress.findMany({
        where: { userId, completed: true, lesson: { module: { courseId: { in: courseIds } } } },
        select: { lesson: { select: { module: { select: { courseId: true } } } } },
      }),
    ]);

    for (const id of courseIds) {
      result.set(id, { totalLessons: 0, completedLessons: 0, percent: 0 });
    }
    for (const lesson of lessons) result.get(lesson.module.courseId)!.totalLessons++;
    for (const item of completed) result.get(item.lesson.module.courseId)!.completedLessons++;
    for (const progress of result.values()) {
      progress.percent = progress.totalLessons
        ? Math.round((progress.completedLessons / progress.totalLessons) * 100)
        : 0;
    }
    return result;
  }
}
