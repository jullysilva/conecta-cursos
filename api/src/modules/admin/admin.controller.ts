import { Controller, Get } from '@nestjs/common';
import { AdminDashboardService } from './admin-dashboard.service.js';
import { Roles } from '../../common/decorators/roles.decorator.js';

@Roles('ADMIN')
@Controller('admin')
export class AdminController {
  constructor(private readonly dashboard: AdminDashboardService) {}

  @Get('dashboard')
  overview() {
    return this.dashboard.overview();
  }
}
