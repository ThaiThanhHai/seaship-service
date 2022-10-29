import { OrderModule } from './modules/order.module';
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { OrderAddressModule } from './modules/order-address.module';
import { DeliveryTypeModule } from './modules/delivery-type.module';

@Module({
  imports: [OrderModule, OrderAddressModule, DeliveryTypeModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
