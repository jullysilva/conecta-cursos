import { PartialType } from '@nestjs/mapped-types';
import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { Role, VideoProvider } from '../../../generated/prisma/enums.js';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto.js';

const urlOptions = { require_tld: false, require_protocol: true };

export class CreateUserDto {
  @IsString() @MinLength(2) @MaxLength(120) name: string;
  @IsEmail() email: string;
  @IsString() @MinLength(8) @MaxLength(72) password: string;
  @IsOptional() @IsEnum(Role) role?: Role;
  @IsOptional() @IsBoolean() active?: boolean;
}
export class UpdateUserDto extends PartialType(CreateUserDto) {}

export class CreateCategoryDto {
  @IsString() @MinLength(2) @MaxLength(80) name: string;
  @IsOptional() @IsInt() @Min(0) position?: number;
}
export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {}

export class CreateCourseDto {
  @IsString() @MinLength(3) @MaxLength(160) title: string;
  @IsOptional() @IsString() @MaxLength(5000) description?: string;
  @IsOptional() @ValidateIf((_, v) => v !== null) @IsUrl(urlOptions) thumbnailUrl?: string | null;
  @IsOptional() @IsInt() @Min(0) workloadHours?: number;
  @IsOptional() @IsBoolean() published?: boolean;
  @IsOptional() @IsBoolean() featured?: boolean;
  @IsOptional() @ValidateIf((_, v) => v !== null) @IsUUID() categoryId?: string | null;
}
export class UpdateCourseDto extends PartialType(CreateCourseDto) {}

export class CreateModuleDto {
  @IsString() @MinLength(2) @MaxLength(160) title: string;
}
export class UpdateModuleDto extends PartialType(CreateModuleDto) {}

export class CreateLessonDto {
  @IsString() @MinLength(2) @MaxLength(160) title: string;
  @IsOptional() @IsString() @MaxLength(5000) description?: string;
  @IsOptional() @IsEnum(VideoProvider) videoProvider?: VideoProvider;
  @IsOptional() @IsString() @MaxLength(500) videoRef?: string;
  @IsOptional() @IsInt() @Min(0) durationSec?: number;
  @IsOptional() @ValidateIf((_, v) => v !== null) @IsUrl(urlOptions) materialUrl?: string | null;
}
export class UpdateLessonDto extends PartialType(CreateLessonDto) {
  @IsOptional() @IsUUID() moduleId?: string;
}

export class ReorderDto {
  @IsArray() @ArrayUnique() @IsUUID('all', { each: true }) ids: string[];
}

export class CreateLearningPathDto {
  @IsString() @MinLength(3) @MaxLength(160) title: string;
  @IsOptional() @IsString() @MaxLength(5000) description?: string;
  @IsOptional() @ValidateIf((_, v) => v !== null) @IsUrl(urlOptions) thumbnailUrl?: string | null;
  @IsOptional() @IsBoolean() published?: boolean;
  @IsOptional() @IsInt() @Min(0) position?: number;
  @IsOptional() @IsArray() @ArrayUnique() @IsUUID('all', { each: true }) courseIds?: string[];
}
export class UpdateLearningPathDto extends PartialType(CreateLearningPathDto) {}

export class CreateBannerDto {
  @IsString() @MinLength(2) @MaxLength(160) title: string;
  @IsOptional() @IsString() @MaxLength(300) subtitle?: string;
  @IsUrl(urlOptions) imageUrl: string;
  @IsOptional() @ValidateIf((_, v) => v !== null) @IsString() @MaxLength(500) linkUrl?: string | null;
  @IsOptional() @IsInt() @Min(0) position?: number;
  @IsOptional() @IsBoolean() active?: boolean;
  @IsOptional() @ValidateIf((_, v) => v !== null) @IsDateString() startsAt?: string | null;
  @IsOptional() @ValidateIf((_, v) => v !== null) @IsDateString() endsAt?: string | null;
}
export class UpdateBannerDto extends PartialType(CreateBannerDto) {}

export class UserListQueryDto extends PaginationQueryDto {
  @IsOptional() @IsEnum(Role) role?: Role;
}
