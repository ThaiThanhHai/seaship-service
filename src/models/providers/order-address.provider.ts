import { DataSource } from 'typeorm';
import { OrderAddress } from '../entities/order-address.entity';

export const orderAddressProviders = [
  {
    provide: 'ORDER_ADDRESS_REPOSITORY',
    useFactory: (dataSource: DataSource) =>
      dataSource.getRepository(OrderAddress),
    inject: ['DATA_SOURCE'],
  },
];
