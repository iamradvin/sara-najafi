import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { ApiCookieAuth, ApiTags } from "@nestjs/swagger";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { SessionAuthGuard } from "../auth/session-auth.guard";
import { TrustedOriginGuard } from "../auth/trusted-origin.guard";
import { CategoriesService } from "./categories.service";
import { CategoryInputDto, CategoryPatchDto } from "./category.dto";

@ApiTags("Categories")
@Controller("categories")
export class CategoriesController {
  constructor(private readonly categories: CategoriesService) {}

  @Get()
  list() {
    return this.categories.list();
  }

  @Get("admin")
  @UseGuards(SessionAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN")
  @ApiCookieAuth("attractory_session")
  listForAdmin() {
    return this.categories.listForAdmin();
  }

  @Get("manage")
  @UseGuards(SessionAuthGuard, RolesGuard)
  @Roles("INSTRUCTOR", "SUPER_ADMIN")
  @ApiCookieAuth("attractory_session")
  listForManager() {
    return this.categories.listForAdmin();
  }

  @Post()
  @UseGuards(SessionAuthGuard, RolesGuard, TrustedOriginGuard)
  @Roles("SUPER_ADMIN")
  @ApiCookieAuth("attractory_session")
  create(@Body() input: CategoryInputDto) {
    return this.categories.create(input);
  }

  @Patch(":id")
  @UseGuards(SessionAuthGuard, RolesGuard, TrustedOriginGuard)
  @Roles("SUPER_ADMIN")
  @ApiCookieAuth("attractory_session")
  update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() input: CategoryPatchDto,
  ) {
    return this.categories.update(id, input);
  }

  @Delete(":id")
  @UseGuards(SessionAuthGuard, RolesGuard, TrustedOriginGuard)
  @Roles("SUPER_ADMIN")
  @ApiCookieAuth("attractory_session")
  delete(@Param("id", ParseUUIDPipe) id: string) {
    return this.categories.delete(id);
  }
}
