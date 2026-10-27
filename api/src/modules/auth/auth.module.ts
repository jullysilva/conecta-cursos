import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import type { StringValue } from 'ms';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { env } from '../../config/env.js';

@Module({
  imports: [
    JwtModule.register({
      global: true,
      secret: env.jwtAccessSecret,
      signOptions: { expiresIn: env.jwtAccessTtl as StringValue },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
