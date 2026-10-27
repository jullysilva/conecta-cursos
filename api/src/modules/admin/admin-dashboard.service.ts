import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';

const DAY_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class AdminDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async overview() {
    const since = new Date(Date.now() - 30 * DAY_MS);
    const [students, admins, courses, publishedCourses, lessons, completions, activeStudents, topCourses] =
      await Promise.all([
        this.prisma.user.count({ where: { role: 'STUDENT' } }),
        this.prisma.user.count({ where: { role: 'ADMIN' } }),
        this.prisma.course.count(),
        this.prisma.course.count({ where: { published: true } }),
        this.prisma.lesson.count(),
        this.prisma.lessonProgress.count({ where: { completed: true, updatedAt: { gte: since } } }),
        this.prisma.enrollment.groupBy({
          by: ['userId'],
          where: { lastAccessedAt: { gte: since } },
        }),
        this.prisma.course.findMany({
          take: 5,
          orderBy: { enrollments: { _count: 'desc' } },
          select: { id: true, title: true, _count: { select: { enrollments: true } } },
        }),
      ]);
    return {
      students,
      admins,
      courses,
      publishedCourses,
      lessons,
      completionsLast30Days: completions,
      activeStudentsLast30Days: activeStudents.length,
      topCourses: topCourses.map(({ _count, ...course }) => ({
        ...course,
        enrollments: _count.enrollments,
      })),
    };
  }
}
