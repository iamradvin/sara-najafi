import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { StudentsController } from "./students.controller";
import { StudentsService } from "./students.service";
import { VdoCipherService } from "./vdocipher.service";

@Module({
  imports: [AuthModule],
  controllers: [StudentsController],
  providers: [StudentsService, VdoCipherService],
})
export class StudentsModule {}
