import { IsString, IsEmail, IsOptional, IsArray, IsNumber, IsEnum, IsBoolean, Min, Max, ValidateNested, ArrayMinSize, MaxLength } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class CreateStudentDto {
  @IsString()
  @MaxLength(20)
  usn: string;

  @IsEmail()
  email: string;

  @IsString()
  @MaxLength(100)
  fullName: string;

  @IsString()
  department: string;

  @IsOptional()
  @IsString()
  batch?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  gender?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  cgpa?: number;

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
  backlogs?: number;
}

export class CreateCompanyDto {
  @IsString()
  name: string;

  @IsEmail()
  hrEmail: string;

  @IsOptional()
  @IsString()
  hrName?: string;

  @IsOptional()
  @IsString()
  hrPhone?: string;

  @IsOptional()
  @IsString()
  sector?: string;

  @IsOptional()
  @IsString()
  website?: string;

  @IsOptional()
  @IsString()
  hqCity?: string;
}

export class BulkApproveDto {
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  studentIds: string[];

  @IsBoolean()
  approved: boolean;
}

export class UpdateStudentDto {
  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsString()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  cgpa?: number;

  @IsOptional()
  @IsString()
  @IsEnum(['none', 'shortlisted', 'interview_scheduled', 'offered', 'placed', 'not_placed'])
  placementStatus?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  batch?: string;
}
