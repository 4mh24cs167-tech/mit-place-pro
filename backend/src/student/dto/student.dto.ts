import { IsString, IsOptional, IsNumber, IsArray, IsObject, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  tenthPercent?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  twelfthPercent?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  cgpa?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  activeBacklogs?: number;

  @IsOptional()
  @IsObject()
  profileData?: Record<string, unknown>;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skills?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  certifications?: string[];
}

export class ApplyJobDto {
  @IsString()
  jobId: string;

  @IsOptional()
  @IsString()
  cvId?: string;
}
