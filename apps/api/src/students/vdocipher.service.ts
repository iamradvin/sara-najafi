import { Injectable, ServiceUnavailableException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

type VdoCipherOtp = {
  otp?: unknown;
  playbackInfo?: unknown;
};

@Injectable()
export class VdoCipherService {
  constructor(private readonly config: ConfigService) {}

  async createPlaybackToken(videoId: string): Promise<{ otp: string; playbackInfo: string }> {
    const secret = this.config.get<string>("VDOCIPHER_API_SECRET")?.trim();
    if (!secret) {
      throw new ServiceUnavailableException("پخش امن ویدیو هنوز پیکربندی نشده است.");
    }

    let response: Response;
    try {
      response = await fetch(
        `https://dev.vdocipher.com/api/videos/${encodeURIComponent(videoId)}/otp`,
        {
          method: "POST",
          headers: {
            Authorization: `Apisecret ${secret}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ ttl: 300 }),
          signal: AbortSignal.timeout(10_000),
          cache: "no-store",
        },
      );
    } catch {
      throw new ServiceUnavailableException("ارتباط با سرویس پخش امن برقرار نشد.");
    }

    let payload: VdoCipherOtp;
    try {
      payload = (await response.json()) as VdoCipherOtp;
    } catch {
      throw new ServiceUnavailableException("پاسخ سرویس پخش امن معتبر نیست.");
    }

    if (
      !response.ok ||
      typeof payload.otp !== "string" ||
      typeof payload.playbackInfo !== "string" ||
      payload.otp.length < 8 ||
      payload.playbackInfo.length < 8
    ) {
      throw new ServiceUnavailableException("صدور مجوز موقت پخش ویدیو انجام نشد.");
    }

    return { otp: payload.otp, playbackInfo: payload.playbackInfo };
  }
}
