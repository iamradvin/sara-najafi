import { Transform } from "class-transformer";
import {
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";

export class CreateSectionDto {
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsString()
  @MinLength(2)
  @MaxLength(180)
  title!: string;
}

export class UpdateSectionDto {
  @IsOptional()
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsString()
  @MinLength(2)
  @MaxLength(180)
  title?: string;
}

export class ReorderSectionsDto {
  @IsArray()
  @ArrayUnique()
  @IsUUID("4", { each: true })
  sectionIds!: string[];
}

export class CreateLessonDto {
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsString()
  @MinLength(2)
  @MaxLength(180)
  title!: string;

  @IsOptional()
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsString()
  @MaxLength(10_000)
  description?: string | null;

  @IsOptional()
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsString()
  @Matches(/^[A-Za-z0-9_-]{6,120}$/)
  videoKey?: string | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(2_147_483_647)
  durationSec?: number;

  @IsOptional()
  @IsBoolean()
  isPreview?: boolean;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}

export class UpdateLessonDto {
  @IsOptional()
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsString()
  @MinLength(2)
  @MaxLength(180)
  title?: string;

  @IsOptional()
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsString()
  @MaxLength(10_000)
  description?: string | null;

  @IsOptional()
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsString()
  @Matches(/^[A-Za-z0-9_-]{6,120}$/)
  videoKey?: string | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(2_147_483_647)
  durationSec?: number;

  @IsOptional()
  @IsBoolean()
  isPreview?: boolean;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}

export class CreateLessonResourceDto {
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsString()
  @MinLength(2)
  @MaxLength(180)
  title!: string;

  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsString()
  @Matches(/^(https:\/\/[^\s]+|\/uploads\/(?!.*\.\.)[A-Za-z0-9._/-]+)$/)
  @MaxLength(1000)
  url!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  fileName?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  mimeType?: string | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(2_147_483_647)
  sizeBytes?: number | null;
}

export class ReorderLessonsDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique()
  @IsUUID("4", { each: true })
  lessonIds!: string[];
}
