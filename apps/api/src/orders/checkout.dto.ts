import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsString,
  Matches,
  MaxLength,
} from "class-validator";

export class CreateCheckoutDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  @ArrayUnique()
  @IsString({ each: true })
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, { each: true })
  @MaxLength(180, { each: true })
  courseSlugs!: string[];
}
