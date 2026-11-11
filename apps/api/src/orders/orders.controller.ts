import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Res,
  UseGuards,
} from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { CurrentUser } from "../auth/current-user.decorator";
import { AuthRequest } from "../auth/auth.types";
import { SessionAuthGuard } from "../auth/session-auth.guard";
import { TrustedOriginGuard } from "../auth/trusted-origin.guard";
import { CreateCheckoutDto } from "./checkout.dto";
import { OrdersService } from "./orders.service";

type RedirectResponse = { redirect(url: string): void };

@Controller("checkout")
@UseGuards(SessionAuthGuard)
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Post()
  @UseGuards(TrustedOriginGuard)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  create(
    @CurrentUser() user: AuthRequest["user"],
    @Body() input: CreateCheckoutDto,
  ) {
    return this.orders.createCheckout(user!.id, input);
  }

  @Get("orders")
  history(@CurrentUser() user: AuthRequest["user"]) {
    return this.orders.listOrders(user!.id);
  }

  @Get("orders/:orderNumber")
  findOrder(
    @CurrentUser() user: AuthRequest["user"],
    @Param("orderNumber") orderNumber: string,
  ) {
    return this.orders.findOrder(user!.id, orderNumber);
  }
}

@Controller("payments/zarinpal")
export class PaymentCallbackController {
  constructor(private readonly orders: OrdersService) {}

  @Get("callback")
  async callback(
    @Query("Authority") authority: string | undefined,
    @Query("Status") status: string | undefined,
    @Res() response: RedirectResponse,
  ) {
    const result = await this.orders.completeZarinpalCallback(authority, status);
    const target = new URL("/checkout/result", this.orders.webOrigin);
    target.searchParams.set("status", result.status);
    if (result.orderNumber) target.searchParams.set("order", result.orderNumber);
    response.redirect(target.toString());
  }
}
