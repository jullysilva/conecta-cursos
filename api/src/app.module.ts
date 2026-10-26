import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module.js';
import { MailModule } from './infra/mail/mail.module.js';
import { ProgressModule } from './modules/progress/progress.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { PortalModule } from './modules/portal/portal.module.js';
import { StudentModule } from './modules/student/student.module.js';
import { AdminModule } from './modules/admin/admin.module.js';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard.js';
import { RolesGuard } from './common/guards/roles.guard.js';
import { PrismaExceptionFilter } from './common/filters/prisma-exception.filter.js';
import { env } from './config/env.js';

@Module({
  imports: [
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: env.isTest ? 10_000 : 300 }]),
    PrismaModule,
    MailModule,
    ProgressModule,
    AuthModule,
    PortalModule,
    StudentModule,
    AdminModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_FILTER, useClass: PrismaExceptionFilter },
  ],
})
export class AppModule {}
