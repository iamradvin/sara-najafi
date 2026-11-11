import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { ConfigService } from "@nestjs/config";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { SessionAuthGuard } from "../auth/session-auth.guard";
import { TrustedOriginGuard } from "../auth/trusted-origin.guard";

type UploadedCourseImage = {
  mimetype: string;
  buffer: Buffer;
};

const imageTypes = {
  "image/jpeg": { extension: ".jpg", signature: (buffer: Buffer) =>
    buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff },
  "image/png": { extension: ".png", signature: (buffer: Buffer) =>
    buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) },
  "image/webp": { extension: ".webp", signature: (buffer: Buffer) =>
    buffer.length >= 12 && buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP" },
} as const;

@Controller("admin/course-images")
@UseGuards(SessionAuthGuard, RolesGuard, TrustedOriginGuard)
@Roles("INSTRUCTOR", "SUPER_ADMIN")
export class CourseImagesController {
  constructor(private readonly config: ConfigService) {}

  @Post()
  @UseInterceptors(
    FileInterceptor("file", {
      limits: { fileSize: 8 * 1024 * 1024, files: 1 },
      fileFilter: (_request, file, callback) => {
        callback(null, Object.hasOwn(imageTypes, file.mimetype));
      },
    }),
  )
  async upload(@UploadedFile() file: UploadedCourseImage | undefined) {
    if (!file) {
      throw new BadRequestException("یک تصویر JPG، PNG یا WebP حداکثر ۸ مگابایتی انتخاب کن.");
    }

    const type = imageTypes[file.mimetype as keyof typeof imageTypes];
    if (!type || !type.signature(file.buffer)) {
      throw new BadRequestException("محتوای فایل با نوع تصویر انتخاب‌شده مطابقت ندارد.");
    }

    const directory = resolve(this.config.get<string>("COURSE_UPLOAD_DIR") || "uploads");
    const filename = `${randomUUID()}${type.extension}`;
    await mkdir(directory, { recursive: true });
    await writeFile(resolve(directory, filename), file.buffer, { flag: "wx" });

    return { url: `/uploads/${filename}` };
  }
}
