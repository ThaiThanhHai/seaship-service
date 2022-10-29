import { DataSource } from 'typeorm';
import { DeliveryType } from '../entities/delivery-type.entity';

export const deliveryTypeProviders = [
  {
    provide: 'DELIVERY_TYPE_REPOSITORY',
    useFactory: (dataSource: DataSource) =>
      dataSource.getRepository(DeliveryType),
    inject: ['DATA_SOURCE'],
  },
];
