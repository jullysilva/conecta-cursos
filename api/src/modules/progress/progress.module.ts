import { Global, Module } from '@nestjs/common';
import { ProgressService } from './progress.service.js';

@Global()
@Module({ providers: [ProgressService], exports: [ProgressService] })
export class ProgressModule {}
