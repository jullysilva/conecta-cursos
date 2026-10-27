import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { uniqueSlug } from '../../../common/utils/unique-slug.js';
import type {
  CreateBannerDto,
  CreateCategoryDto,
  CreateLearningPathDto,
  UpdateBannerDto,
  UpdateCategoryDto,
  UpdateLearningPathDto,
} from '../dto/admin.dto.js';

/** Categories, learning paths and banners: small catalog entities managed by admins. */
@Injectable()
export class AdminCatalogService {
  constructor(private readonly prisma: PrismaService) {}

  listCategories() {
    return this.prisma.category.findMany({
      orderBy: { position: 'asc' },
      include: { _count: { select: { courses: true } } },
    });
  }

  async createCategory(dto: CreateCategoryDto) {
    const slug = await uniqueSlug(dto.name, async (value) =>
      Boolean(await this.prisma.category.findUnique({ where: { slug: value } })),
    );
    return this.prisma.category.create({ data: { ...dto, slug } });
  }

  updateCategory(id: string, dto: UpdateCategoryDto) {
    return this.prisma.category.update({ where: { id }, data: dto });
  }

  async removeCategory(id: string) {
    await this.prisma.category.delete({ where: { id } });
  }

  async listLearningPaths() {
    const paths = await this.prisma.learningPath.findMany({
      orderBy: { position: 'asc' },
      include: { courses: { orderBy: { position: 'asc' }, select: { courseId: true } } },
    });
    return paths.map(({ courses, ...path }) => ({
      ...path,
      courseIds: courses.map((item) => item.courseId),
    }));
  }

  async createLearningPath({ courseIds = [], ...dto }: CreateLearningPathDto) {
    const path = await this.prisma.learningPath.create({
      data: {
        ...dto,
        courses: { create: courseIds.map((courseId, position) => ({ courseId, position })) },
      },
    });
    return { ...path, courseIds };
  }

  async updateLearningPath(id: string, { courseIds, ...dto }: UpdateLearningPathDto) {
    const path = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.learningPath.update({ where: { id }, data: dto });
      if (courseIds) {
        await tx.learningPathCourse.deleteMany({ where: { pathId: id } });
        await tx.learningPathCourse.createMany({
          data: courseIds.map((courseId, position) => ({ pathId: id, courseId, position })),
        });
      }
      return updated;
    });
    const courses = await this.prisma.learningPathCourse.findMany({
      where: { pathId: id },
      orderBy: { position: 'asc' },
    });
    return { ...path, courseIds: courses.map((item) => item.courseId) };
  }

  async removeLearningPath(id: string) {
    await this.prisma.learningPath.delete({ where: { id } });
  }

  listBanners() {
    return this.prisma.banner.findMany({ orderBy: { position: 'asc' } });
  }

  getBanner(id: string) {
    return this.prisma.banner.findUniqueOrThrow({ where: { id } });
  }

  createBanner(dto: CreateBannerDto) {
    return this.prisma.banner.create({ data: dto });
  }

  updateBanner(id: string, dto: UpdateBannerDto) {
    return this.prisma.banner.update({ where: { id }, data: dto });
  }

  async removeBanner(id: string) {
    await this.prisma.banner.delete({ where: { id } });
  }
}
