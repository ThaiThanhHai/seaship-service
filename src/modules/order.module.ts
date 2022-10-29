import { Module } from '@nestjs/common';
import { DatabaseModule } from '../models/databases/database.module';
import { orderProviders } from '../models/providers/order.provider';
import { orderAddressProviders } from '../models/providers/order-address.provider';
import { deliveryTypeProviders } from '../models/providers/delivery-type.provider';
import { OrderService } from '../services/order.service';
import { OrderController } from '../controllers/order.controller';
import { PythonService } from '../services/python.service';

@Module({
  imports: [DatabaseModule],
  controllers: [OrderController],
  providers: [
    ...orderProviders,
    ...orderAddressProviders,
    ...deliveryTypeProviders,
    OrderService,
    PythonService,
  ],
})
export class OrderModule {}
