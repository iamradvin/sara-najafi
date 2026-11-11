import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { AdminCoursesController } from "./admin-courses.controller";
import { AdminCurriculumController } from "./admin-curriculum.controller";
import { CategoriesController } from "./categories.controller";
import { CategoriesService } from "./categories.service";
import { AdminInstructorsController } from "./instructors-admin.controller";
import { CourseImagesController } from "./course-images.controller";
import { CoursesController, InstructorsController } from "./courses.controller";
import { CourseCurriculumService } from "./course-curriculum.service";
import { CoursesService } from "./courses.service";
import { LessonsController, ModulesController } from "./modules.controller";
import { LessonResourcesService } from "./lesson-resources.service";

@Module({
  imports: [AuthModule],
  controllers: [
    CoursesController,
    InstructorsController,
    CategoriesController,
    AdminInstructorsController,
    AdminCoursesController,
    AdminCurriculumController,
    ModulesController,
    LessonsController,
    CourseImagesController,
  ],
  providers: [
    CoursesService,
    CategoriesService,
    CourseCurriculumService,
    LessonResourcesService,
  ],
})
export class CoursesModule {}
