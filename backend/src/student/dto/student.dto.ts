import { IsString, IsOptional, IsNumber, IsArray, IsObject, Min, Max, IsDateString, MaxLength } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @IsOptional()
  @IsString()
  gender?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(8)
  semester?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  tenthPercent?: number;

  @IsOptional()
  @IsString()
  tenthBoard?: string;

  @IsOptional()
  @IsNumber()
  @Min(2000)
  @Max(2030)
  tenthYear?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  twelfthPercent?: number;

  @IsOptional()
  @IsString()
  twelfthBoard?: string;

  @IsOptional()
  @IsNumber()
  @Min(2000)
  @Max(2030)
  twelfthYear?: number;

  @IsOptional()
  @IsString()
  twelfthStream?: string;

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
  @IsNumber()
  @Min(0)
  familyIncome?: number;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  driveLink?: string;

  @IsOptional()
  @IsObject()
  addressJson?: Record<string, string>;

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

  // ─── New Profile Fields ─────────────────────────
  @IsOptional()
  @IsString()
  @MaxLength(500)
  tenthMarksCardLink?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  twelfthMarksCardLink?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  linkedin?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  github?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  aboutMe?: string;
}

export class ApplyJobDto {
  @IsString()
  jobId: string;

  @IsOptional()
  @IsString()
  cvId?: string;
}
