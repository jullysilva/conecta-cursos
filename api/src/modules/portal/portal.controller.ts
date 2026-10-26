import { Controller, Get } from '@nestjs/common';
import { PortalService } from './portal.service.js';
import { CurrentUser, type AuthUser } from '../../common/decorators/current-user.decorator.js';

@Controller('portal')
export class PortalController {
  constructor(private readonly portal: PortalService) {}

  @Get('banners')
  banners() {
    return this.portal.banners();
  }

  @Get('categories')
  categories(@CurrentUser() user: AuthUser) {
    return this.portal.categories(user.sub);
  }

  @Get('featured-course')
  featuredCourse(@CurrentUser() user: AuthUser) {
    return this.portal.featuredCourse(user.sub);
  }

  @Get('learning-paths')
  learningPaths() {
    return this.portal.learningPaths();
  }
}
