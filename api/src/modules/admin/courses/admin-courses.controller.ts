import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post, Put, Query } from '@nestjs/common';
import { AdminCoursesService } from './admin-courses.service.js';
import { AdminContentService } from '../content/admin-content.service.js';
import {
  CreateCourseDto,
  CreateLessonDto,
  CreateModuleDto,
  ReorderDto,
  UpdateCourseDto,
  UpdateLessonDto,
  UpdateModuleDto,
} from '../dto/admin.dto.js';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto.js';
import { Roles } from '../../../common/decorators/roles.decorator.js';

@Roles('ADMIN')
@Controller('admin')
export class AdminCoursesController {
  constructor(
    private readonly courses: AdminCoursesService,
    private readonly content: AdminContentService,
  ) {}

  @Get('courses')
  list(@Query() query: PaginationQueryDto) {
    return this.courses.list(query);
  }

  @Get('courses/options')
  options() {
    return this.courses.options();
  }

  @Get('courses/:id')
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.courses.get(id);
  }

  @Post('courses')
  create(@Body() dto: CreateCourseDto) {
    return this.courses.create(dto);
  }

  @Patch('courses/:id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateCourseDto) {
    return this.courses.update(id, dto);
  }

  @Delete('courses/:id')
  @HttpCode(204)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.courses.remove(id);
  }

  @Post('courses/:id/modules')
  createModule(@Param('id', ParseUUIDPipe) id: string, @Body() dto: CreateModuleDto) {
    return this.content.createModule(id, dto);
  }

  @Put('courses/:id/modules/order')
  @HttpCode(204)
  reorderModules(@Param('id', ParseUUIDPipe) id: string, @Body() dto: ReorderDto) {
    return this.content.reorderModules(id, dto.ids);
  }

  @Patch('modules/:id')
  updateModule(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateModuleDto) {
    return this.content.updateModule(id, dto);
  }

  @Delete('modules/:id')
  @HttpCode(204)
  removeModule(@Param('id', ParseUUIDPipe) id: string) {
    return this.content.removeModule(id);
  }

  @Post('modules/:id/lessons')
  createLesson(@Param('id', ParseUUIDPipe) id: string, @Body() dto: CreateLessonDto) {
    return this.content.createLesson(id, dto);
  }

  @Put('modules/:id/lessons/order')
  @HttpCode(204)
  reorderLessons(@Param('id', ParseUUIDPipe) id: string, @Body() dto: ReorderDto) {
    return this.content.reorderLessons(id, dto.ids);
  }

  @Patch('lessons/:id')
  updateLesson(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateLessonDto) {
    return this.content.updateLesson(id, dto);
  }

  @Delete('lessons/:id')
  @HttpCode(204)
  removeLesson(@Param('id', ParseUUIDPipe) id: string) {
    return this.content.removeLesson(id);
  }
}
