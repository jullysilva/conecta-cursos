import { IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class UpdateProgressDto {
  @IsInt()
  @Min(0)
  positionSec: number;

  @IsOptional()
  @IsBoolean()
  completed?: boolean;
}

export class BeaconProgressDto extends UpdateProgressDto {
  @IsString()
  token: string;
}
