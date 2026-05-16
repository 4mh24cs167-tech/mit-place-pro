import { IsString, IsOptional, IsNumber, IsArray, IsObject, IsEnum, Min, Max, ValidateNested, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateJobDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  requiredSkills?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allowedDepartments?: string[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  minCgpa?: number;

  @IsOptional()
  @IsNumber()
  minTenthPercent?: number;

  @IsOptional()
  @IsNumber()
  minTwelfthPercent?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxBacklogs?: number;

  @IsOptional()
  @IsNumber()
  ctcMinLpa?: number;

  @IsOptional()
  @IsNumber()
  ctcMaxLpa?: number;

  @IsNumber()
  @Min(1)
  totalVacancies: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  numRounds?: number;

  @IsOptional()
  @IsArray()
  roundsConfig?: Record<string, unknown>[];

  @IsOptional()
  @IsNumber()
  timePerCandidateMin?: number;

  @IsOptional()
  @IsString()
  workMode?: string;

  @IsOptional()
  @IsString()
  workLocation?: string;

  @IsOptional()
  @IsNumber()
  bondYears?: number;

  @IsOptional()
  @IsNumber()
  bondAmountInr?: number;

  @IsOptional()
  @IsString()
  joiningDate?: string;
}

export class AddAvailabilityDto {
  @IsString()
  date: string;

  @IsString()
  startTime: string;

  @IsString()
  endTime: string;

  @IsOptional()
  @IsString()
  breakStart?: string;

  @IsOptional()
  @IsString()
  breakEnd?: string;

  @IsOptional()
  @IsString()
  venue?: string;
}

export class MarkAttendanceDto {
  @IsString()
  slotId: string;

  @IsEnum(['present', 'absent'])
  attendance: string;
}

export class MarkRoundResultDto {
  @IsString()
  slotId: string;

  @IsEnum(['selected', 'rejected'])
  result: string;
}
