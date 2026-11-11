import {
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Query,
} from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { CourseListQueryDto } from "./course-admin.dto";
import { CoursesService } from "./courses.service";

@Controller("courses")
@ApiTags("Courses")
export class CoursesController {
  constructor(private readonly courses: CoursesService) {}

  @Get()
  @ApiOperation({ summary: "List published courses with pagination and filters" })
  list(@Query() query: CourseListQueryDto) {
    return this.courses.listPublished(query);
  }

  @Get(":slug")
  async findBySlug(@Param("slug") slug: string) {
    const course = await this.courses.findPublishedBySlug(slug);
    if (!course) throw new NotFoundException("Course not found");
    return course;
  }
}

@Controller("instructors")
@ApiTags("Instructors")
export class InstructorsController {
  constructor(private readonly courses: CoursesService) {}

  @Get(":id")
  profile(@Param("id", ParseUUIDPipe) id: string) {
    return this.courses.getInstructor(id);
  }
}
