import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { OrdersController, PaymentCallbackController } from "./orders.controller";
import { OrdersService } from "./orders.service";

@Module({
  imports: [AuthModule],
  controllers: [OrdersController, PaymentCallbackController],
  providers: [OrdersService],
})
export class OrdersModule {}
