import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller.js';
import { AdminDashboardService } from './admin-dashboard.service.js';
import { AdminUsersController } from './users/admin-users.controller.js';
import { AdminUsersService } from './users/admin-users.service.js';
import { AdminCatalogController } from './catalog/admin-catalog.controller.js';
import { AdminCatalogService } from './catalog/admin-catalog.service.js';
import { AdminCoursesController } from './courses/admin-courses.controller.js';
import { AdminCoursesService } from './courses/admin-courses.service.js';
import { AdminContentService } from './content/admin-content.service.js';

@Module({
  controllers: [AdminController, AdminUsersController, AdminCatalogController, AdminCoursesController],
  providers: [
    AdminDashboardService,
    AdminUsersService,
    AdminCatalogService,
    AdminCoursesService,
    AdminContentService,
  ],
})
export class AdminModule {}
