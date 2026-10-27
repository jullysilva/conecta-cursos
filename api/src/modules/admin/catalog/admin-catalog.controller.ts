import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { AdminCatalogService } from './admin-catalog.service.js';
import {
  CreateBannerDto,
  CreateCategoryDto,
  CreateLearningPathDto,
  UpdateBannerDto,
  UpdateCategoryDto,
  UpdateLearningPathDto,
} from '../dto/admin.dto.js';
import { Roles } from '../../../common/decorators/roles.decorator.js';

@Roles('ADMIN')
@Controller('admin')
export class AdminCatalogController {
  constructor(private readonly catalog: AdminCatalogService) {}

  @Get('categories')
  listCategories() {
    return this.catalog.listCategories();
  }

  @Post('categories')
  createCategory(@Body() dto: CreateCategoryDto) {
    return this.catalog.createCategory(dto);
  }

  @Patch('categories/:id')
  updateCategory(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateCategoryDto) {
    return this.catalog.updateCategory(id, dto);
  }

  @Delete('categories/:id')
  @HttpCode(204)
  removeCategory(@Param('id', ParseUUIDPipe) id: string) {
    return this.catalog.removeCategory(id);
  }

  @Get('learning-paths')
  listLearningPaths() {
    return this.catalog.listLearningPaths();
  }

  @Post('learning-paths')
  createLearningPath(@Body() dto: CreateLearningPathDto) {
    return this.catalog.createLearningPath(dto);
  }

  @Patch('learning-paths/:id')
  updateLearningPath(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateLearningPathDto) {
    return this.catalog.updateLearningPath(id, dto);
  }

  @Delete('learning-paths/:id')
  @HttpCode(204)
  removeLearningPath(@Param('id', ParseUUIDPipe) id: string) {
    return this.catalog.removeLearningPath(id);
  }

  @Get('banners')
  listBanners() {
    return this.catalog.listBanners();
  }

  @Get('banners/:id')
  getBanner(@Param('id', ParseUUIDPipe) id: string) {
    return this.catalog.getBanner(id);
  }

  @Post('banners')
  createBanner(@Body() dto: CreateBannerDto) {
    return this.catalog.createBanner(dto);
  }

  @Patch('banners/:id')
  updateBanner(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateBannerDto) {
    return this.catalog.updateBanner(id, dto);
  }

  @Delete('banners/:id')
  @HttpCode(204)
  removeBanner(@Param('id', ParseUUIDPipe) id: string) {
    return this.catalog.removeBanner(id);
  }
}
