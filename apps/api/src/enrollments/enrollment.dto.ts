import { Type } from "class-transformer";
import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from "class-validator";

export class FreeEnrollmentDto {
  @IsUUID("4")
  courseId!: string;
}

export class ManualEnrollmentDto {
  @IsUUID("4")
  userId!: string;

  @IsUUID("4")
  courseId!: string;

  @IsOptional()
  @IsDateString()
  expiresAt?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

export class EnrollmentListQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;

  @IsOptional()
  @IsUUID("4")
  courseId?: string;
}

export class RevokeEnrollmentDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
