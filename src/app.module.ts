import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './models/databases/database.module';
import { OrderController } from './controllers/order.controller';
import { DeliveryTypeController } from './controllers/delivery-type.controller';
import { OrderAddressController } from './controllers/order-address.controller';
import { orderProviders } from './models/providers/order.provider';
import { orderAddressProviders } from './models/providers/order-address.provider';
import { deliveryTypeProviders } from './models/providers/delivery-type.provider';
import { OrderService } from './services/order.service';
import { DeliveryTypeService } from './services/delivery-type.service';
import { PythonService } from './services/python.service';
import { DeliveryTypeConverter } from './controllers/converters/delivery-type.converter';
import { DeliveryTypeListConverter } from './controllers/converters/delivery-type-list.converter';
import { OrderConverter } from './controllers/converters/order.converter';
import { OrderAddressService } from './services/order-address.service';
import { OrderAddressConverter } from './controllers/converters/order-address.converter';
import { OrderListConverter } from './controllers/converters/order-list.converter';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [DatabaseModule, HttpModule],
  controllers: [
    AppController,
    DeliveryTypeController,
    OrderAddressController,
    OrderController,
  ],
  providers: [
    AppService,
    ...orderProviders,
    ...orderAddressProviders,
    ...deliveryTypeProviders,
    OrderService,
    DeliveryTypeService,
    PythonService,
    DeliveryTypeConverter,
    DeliveryTypeListConverter,
    OrderAddressConverter,
    OrderConverter,
    OrderAddressService,
    OrderListConverter,
  ],
})
export class AppModule {}
