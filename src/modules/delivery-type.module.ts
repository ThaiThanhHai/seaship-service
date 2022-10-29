import { DeliveryTypeService } from './../services/delivery-type.service';
import { DeliveryTypeController } from './../controllers/delivery-type.controller';
import { Module } from '@nestjs/common';
import { DatabaseModule } from '../models/databases/database.module';
import { deliveryTypeProviders } from '../models/providers/delivery-type.provider';
import { DeliveryTypeConverter } from 'src/controllers/converters/delivery-type.converter';
import { DeliveryTypeListConverter } from 'src/controllers/converters/delivery-type-list.converter';

@Module({
  imports: [DatabaseModule],
  controllers: [DeliveryTypeController],
  providers: [
    ...deliveryTypeProviders,
    DeliveryTypeService,
    DeliveryTypeConverter,
    DeliveryTypeListConverter,
  ],
})
export class DeliveryTypeModule {}
