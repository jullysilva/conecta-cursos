import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { uniqueSlug } from '../../../common/utils/unique-slug.js';
import { PaginationQueryDto, paginationArgs } from '../../../common/dto/pagination-query.dto.js';
import type { Prisma } from '../../../generated/prisma/client.js';
import type { CreateCourseDto, UpdateCourseDto } from '../dto/admin.dto.js';

@Injectable()
export class AdminCoursesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: PaginationQueryDto) {
    const where: Prisma.CourseWhereInput = query.search
      ? { title: { contains: query.search, mode: 'insensitive' } }
      : {};
    const [courses, total] = await this.prisma.$transaction([
      this.prisma.course.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        include: {
          category: { select: { id: true, name: true } },
          _count: { select: { modules: true, enrollments: true } },
        },
        ...paginationArgs(query),
      }),
      this.prisma.course.count({ where }),
    ]);
    return { items: courses, total, page: query.page, pageSize: query.pageSize };
  }

  /** Lightweight list used by selectors (e.g. learning path editor). */
  options() {
    return this.prisma.course.findMany({
      orderBy: { title: 'asc' },
      select: { id: true, title: true, published: true },
    });
  }

  get(id: string) {
    return this.prisma.course.findUniqueOrThrow({
      where: { id },
      include: {
        modules: {
          orderBy: { position: 'asc' },
          include: { lessons: { orderBy: { position: 'asc' } } },
        },
      },
    });
  }

  async create(dto: CreateCourseDto) {
    const slug = await this.slugFor(dto.title);
    return this.prisma.course.create({ data: { ...dto, slug } });
  }

  async update(id: string, dto: UpdateCourseDto) {
    const current = await this.prisma.course.findUniqueOrThrow({ where: { id } });
    const slug =
      dto.title && dto.title !== current.title ? await this.slugFor(dto.title, id) : undefined;
    return this.prisma.course.update({ where: { id }, data: { ...dto, ...(slug && { slug }) } });
  }

  async remove(id: string) {
    await this.prisma.course.delete({ where: { id } });
  }

  private slugFor(title: string, ignoreId?: string) {
    return uniqueSlug(title, async (slug) => {
      const found = await this.prisma.course.findUnique({ where: { slug } });
      return Boolean(found && found.id !== ignoreId);
    });
  }
}
