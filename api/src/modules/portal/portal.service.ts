import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { ProgressService } from '../progress/progress.service.js';

const courseCardSelect = {
  id: true,
  title: true,
  slug: true,
  description: true,
  thumbnailUrl: true,
  workloadHours: true,
  categoryId: true,
} as const;

@Injectable()
export class PortalService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly progress: ProgressService,
  ) {}

  banners() {
    const now = new Date();
    return this.prisma.banner.findMany({
      where: {
        active: true,
        AND: [
          { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
          { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
        ],
      },
      orderBy: { position: 'asc' },
      select: { id: true, title: true, subtitle: true, imageUrl: true, linkUrl: true },
    });
  }

  async categories(userId: string) {
    const categories = await this.prisma.category.findMany({
      orderBy: { position: 'asc' },
      include: {
        courses: {
          where: { published: true },
          orderBy: { title: 'asc' },
          select: courseCardSelect,
        },
      },
    });
    const withCourses = categories.filter((category) => category.courses.length);
    const ids = withCourses.flatMap((category) => category.courses.map((course) => course.id));
    const progress = await this.progress.forCourses(userId, ids);
    return withCourses.map(({ id, name, slug, courses }) => ({
      id,
      name,
      slug,
      courses: courses.map((course) => ({ ...course, progress: progress.get(course.id) })),
    }));
  }

  async featuredCourse(userId: string) {
    const course = await this.prisma.course.findFirst({
      where: { published: true, featured: true },
      orderBy: { updatedAt: 'desc' },
      select: courseCardSelect,
    });
    if (!course) return null;
    const progress = await this.progress.forCourses(userId, [course.id]);
    return { ...course, progress: progress.get(course.id) };
  }

  async learningPaths() {
    const paths = await this.prisma.learningPath.findMany({
      where: { published: true },
      orderBy: { position: 'asc' },
      include: { _count: { select: { courses: true } } },
    });
    return paths.map(({ _count, ...path }) => ({ ...path, coursesCount: _count.courses }));
  }
}
