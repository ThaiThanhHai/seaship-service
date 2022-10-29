import { Module } from '@nestjs/common';
import { DatabaseModule } from '../models/databases/database.module';
import { orderAddressProviders } from '../models/providers/order-address.provider';
import { OrderAddressController } from '../controllers/order-address.controller';
import { OrderAddressService } from 'src/services/order-address.service';

@Module({
  imports: [DatabaseModule],
  controllers: [OrderAddressController],
  providers: [...orderAddressProviders, OrderAddressService],
})
export class OrderAddressModule {}
