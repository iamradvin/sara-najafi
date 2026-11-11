import { Transform, Type } from "class-transformer";
import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsUUID,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from "class-validator";
import { CourseLevel } from "@prisma/client";

export class CourseListQueryDto {
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
  limit = 12;

  @IsOptional()
  @IsString()
  @MaxLength(140)
  category?: string;

  @IsOptional()
  @IsEnum(CourseLevel)
  level?: CourseLevel;

  @IsOptional()
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsString()
  @MaxLength(120)
  search?: string;

  @IsOptional()
  @IsIn(["newest", "popular", "price_asc", "price_desc"])
  sort?: "newest" | "popular" | "price_asc" | "price_desc";
}

export class CourseCategoryDto {
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @Transform(({ value }) => (typeof value === "string" ? value.trim().toLowerCase() : value))
  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  @MaxLength(140)
  slug!: string;
}

export class CreateCourseDto {
  @Transform(({ value }) => (typeof value === "string" ? value.trim().toLowerCase() : value))
  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  @MaxLength(180)
  slug!: string;

  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsString()
  @MinLength(2)
  @MaxLength(180)
  title!: string;

  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsString()
  @MinLength(10)
  description!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  thumbnailUrl?: string | null;

  @IsOptional()
  @IsEnum(CourseLevel)
  level?: CourseLevel;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(2_000_000_000)
  priceToman?: number | null;

  @IsOptional()
  @IsBoolean()
  isFree?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100_000)
  estimatedMinutes?: number;

  @IsOptional()
  @IsString()
  @IsIn(["TOMAN"])
  currency?: string;

  @IsOptional()
  @IsString()
  @Matches(/^[a-z]{2}(?:-[A-Z]{2})?$/)
  language?: string;

  @IsOptional()
  @IsUUID("4")
  instructorId?: string;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsUUID("4", { each: true })
  categoryIds?: string[];

  @IsOptional()
  @ValidateNested()
  @Type(() => CourseCategoryDto)
  category?: CourseCategoryDto | null;
}

export class UpdateCourseDto {
  @IsOptional()
  @Transform(({ value }) => (typeof value === "string" ? value.trim().toLowerCase() : value))
  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  @MaxLength(180)
  slug?: string;

  @IsOptional()
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsString()
  @MinLength(2)
  @MaxLength(180)
  title?: string;

  @IsOptional()
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsString()
  @MinLength(10)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  thumbnailUrl?: string | null;

  @IsOptional()
  @IsEnum(CourseLevel)
  level?: CourseLevel;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(2_000_000_000)
  priceToman?: number | null;

  @IsOptional()
  @IsBoolean()
  isFree?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100_000)
  estimatedMinutes?: number;

  @IsOptional()
  @IsString()
  @IsIn(["TOMAN"])
  currency?: string;

  @IsOptional()
  @IsString()
  @Matches(/^[a-z]{2}(?:-[A-Z]{2})?$/)
  language?: string;

  @IsOptional()
  @IsUUID("4")
  instructorId?: string | null;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsUUID("4", { each: true })
  categoryIds?: string[];

  @IsOptional()
  @ValidateNested()
  @Type(() => CourseCategoryDto)
  category?: CourseCategoryDto | null;
}
