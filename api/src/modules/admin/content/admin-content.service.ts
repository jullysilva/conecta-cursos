import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import type {
  CreateLessonDto,
  CreateModuleDto,
  UpdateLessonDto,
  UpdateModuleDto,
} from '../dto/admin.dto.js';

/** Modules and lessons of a course, including ordering. */
@Injectable()
export class AdminContentService {
  constructor(private readonly prisma: PrismaService) {}

  async createModule(courseId: string, dto: CreateModuleDto) {
    await this.prisma.course.findUniqueOrThrow({ where: { id: courseId }, select: { id: true } });
    const position = await this.prisma.courseModule.count({ where: { courseId } });
    return this.prisma.courseModule.create({
      data: { ...dto, courseId, position },
      include: { lessons: true },
    });
  }

  updateModule(id: string, dto: UpdateModuleDto) {
    return this.prisma.courseModule.update({ where: { id }, data: dto });
  }

  async removeModule(id: string) {
    await this.prisma.courseModule.delete({ where: { id } });
  }

  async reorderModules(courseId: string, ids: string[]) {
    const modules = await this.prisma.courseModule.findMany({
      where: { courseId },
      select: { id: true },
    });
    this.assertSameSet(modules.map((module) => module.id), ids);
    await this.prisma.$transaction(
      ids.map((id, position) =>
        this.prisma.courseModule.update({ where: { id }, data: { position } }),
      ),
    );
  }

  async createLesson(moduleId: string, dto: CreateLessonDto) {
    await this.prisma.courseModule.findUniqueOrThrow({
      where: { id: moduleId },
      select: { id: true },
    });
    const position = await this.prisma.lesson.count({ where: { moduleId } });
    return this.prisma.lesson.create({ data: { ...dto, moduleId, position } });
  }

  async updateLesson(id: string, dto: UpdateLessonDto) {
    if (dto.moduleId) {
      const [lesson, target] = await Promise.all([
        this.prisma.lesson.findUniqueOrThrow({ where: { id }, include: { module: true } }),
        this.prisma.courseModule.findUniqueOrThrow({ where: { id: dto.moduleId } }),
      ]);
      if (lesson.module.courseId !== target.courseId) {
        throw new BadRequestException('A aula só pode ser movida para um módulo do mesmo curso');
      }
      if (lesson.moduleId !== dto.moduleId) {
        const position = await this.prisma.lesson.count({ where: { moduleId: dto.moduleId } });
        return this.prisma.lesson.update({ where: { id }, data: { ...dto, position } });
      }
    }
    return this.prisma.lesson.update({ where: { id }, data: dto });
  }

  async removeLesson(id: string) {
    await this.prisma.lesson.delete({ where: { id } });
  }

  async reorderLessons(moduleId: string, ids: string[]) {
    const lessons = await this.prisma.lesson.findMany({ where: { moduleId }, select: { id: true } });
    this.assertSameSet(lessons.map((lesson) => lesson.id), ids);
    await this.prisma.$transaction(
      ids.map((id, position) => this.prisma.lesson.update({ where: { id }, data: { position } })),
    );
  }

  private assertSameSet(expected: string[], received: string[]) {
    const expectedSet = new Set(expected);
    if (expected.length !== received.length || !received.every((id) => expectedSet.has(id))) {
      throw new BadRequestException('A lista de ordenação não corresponde aos itens existentes');
    }
  }
}
