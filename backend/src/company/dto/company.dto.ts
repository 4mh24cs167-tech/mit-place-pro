import { IsString, IsOptional, IsNumber, IsArray, IsObject, IsEnum, IsBoolean, Min, Max, ValidateNested, ArrayMinSize } from 'class-validator';
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

  @IsOptional()
  @IsString()
  jobType?: string; // 'placement' | 'internship'

  @IsOptional()
  isUnpaid?: boolean;

  @IsOptional()
  @IsString()
  internshipDuration?: string; // e.g. "3 months"

  @IsOptional()
  @IsNumber()
  stipendAmount?: number;
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

export class UpdateCompanyProfileDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  website?: string;

  @IsOptional()
  @IsString()
  hqCity?: string;

  @IsOptional()
  @IsString()
  sector?: string;

  @IsOptional()
  @IsString()
  annualTurnoverRange?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  hrName?: string;

  @IsOptional()
  @IsString()
  hrPhone?: string;


}

export class SubmitRoundResultsDto {
  @IsNumber()
  round: number;

  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(0)
  selectedStudentIds: string[];
}

export class RoundConfigDto {
  @IsString()
  title: string;

  @IsString()
  type: string;
}

export class UpdateJobRoundsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RoundConfigDto)
  roundsConfig: RoundConfigDto[];
}

export class GroupConfigDto {
  @IsString()
  groupName: string;

  @IsOptional()
  @IsString()
  meetingLink?: string;

  @IsOptional()
  @IsString()
  scheduledDate?: string;

  @IsOptional()
  @IsString()
  scheduledTime?: string;

  @IsOptional()
  @IsNumber()
  maxParticipants?: number;

  @IsArray()
  @IsString({ each: true })
  studentIds: string[];
}

export class OneOnOneSlotDto {
  @IsString()
  studentId: string;

  @IsOptional()
  @IsString()
  personalLink?: string;

  @IsOptional()
  @IsString()
  scheduledStart?: string;

  @IsOptional()
  @IsString()
  scheduledEnd?: string;
}

export class CreateRoundMeetingDto {
  @IsString()
  jobId: string;

  @IsNumber()
  roundNumber: number;

  @IsEnum(['virtual', 'group_discussion', 'one_on_one'])
  meetingType: string;

  @IsOptional()
  @IsString()
  meetingLink?: string;

  @IsOptional()
  @IsString()
  scheduledDate?: string;

  @IsOptional()
  @IsString()
  scheduledTime?: string;

  @IsOptional()
  @IsString()
  venue?: string;

  @IsOptional()
  @IsString()
  instructions?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GroupConfigDto)
  groups?: GroupConfigDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OneOnOneSlotDto)
  slots?: OneOnOneSlotDto[];
}

export class UpdateRoundMeetingDto {
  @IsOptional()
  @IsString()
  meetingLink?: string;

  @IsOptional()
  @IsString()
  scheduledDate?: string;

  @IsOptional()
  @IsString()
  scheduledTime?: string;

  @IsOptional()
  @IsString()
  venue?: string;

  @IsOptional()
  @IsString()
  instructions?: string;

  @IsOptional()
  @IsEnum(['scheduled', 'in_progress', 'completed'])
  status?: string;
}
