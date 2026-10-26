import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { StudentService } from './student.service.js';
import { BeaconProgressDto, UpdateProgressDto } from './dto/progress.dto.js';
import { CurrentUser, type AuthUser } from '../../common/decorators/current-user.decorator.js';
import { Public } from '../../common/decorators/public.decorator.js';

@Controller('student')
export class StudentController {
  constructor(
    private readonly student: StudentService,
    private readonly jwt: JwtService,
  ) {}

  @Get('summary')
  summary(@CurrentUser() user: AuthUser) {
    return this.student.summary(user.sub);
  }

  @Get('courses/:id')
  course(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.student.course(user, id);
  }

  @Get('lessons/:id')
  lesson(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.student.lesson(user, id);
  }

  @Put('lessons/:id/progress')
  updateProgress(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProgressDto,
  ) {
    return this.student.updateProgress(user, id, dto);
  }

  /** navigator.sendBeacon cannot send headers, so the access token travels in the body. */
  @Public()
  @Post('lessons/:id/progress/beacon')
  @HttpCode(204)
  async beacon(@Param('id', ParseUUIDPipe) id: string, @Body() dto: BeaconProgressDto) {
    let user: AuthUser;
    try {
      user = await this.jwt.verifyAsync<AuthUser>(dto.token);
    } catch {
      throw new UnauthorizedException();
    }
    await this.student.updateProgress(user, id, {
      positionSec: dto.positionSec,
      completed: dto.completed,
    });
  }

  @Get('learning-paths/:id')
  learningPath(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.student.learningPath(user.sub, id);
  }
}
