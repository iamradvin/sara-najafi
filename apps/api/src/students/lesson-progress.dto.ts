import { IsInt, Max, Min } from "class-validator";

export class UpdateLessonProgressDto {
  @IsInt()
  @Min(0)
  @Max(2_147_483_647)
  watchedSeconds!: number;

  @IsInt()
  @Min(0)
  @Max(2_147_483_647)
  coveredSeconds!: number;
}
