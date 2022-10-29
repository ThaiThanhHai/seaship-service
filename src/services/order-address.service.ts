import { OrderAddress } from './../models/entities/order-address.entity';
import { OrderAddressDto } from 'src/controllers/dto/order-address.dto';
import { OrderAddressConverter } from '../controllers/converters/order-address.converter';
import { Injectable, Inject } from '@nestjs/common';
import { Repository } from 'typeorm';

@Injectable()
export class OrderAddressService {
  constructor(
    @Inject('ORDER_ADDRESS_REPOSITORY')
    private orderAddressRepository: Repository<OrderAddress>,
    private readonly orderAddressConverter: OrderAddressConverter,
  ) {}

  async createOrderAddress(
    orderAddressDto: OrderAddressDto,
  ): Promise<OrderAddress> {
    const orderAddressEntity =
      this.orderAddressConverter.toEntity(orderAddressDto);

    const createdOrderAddress = await this.orderAddressRepository.save(
      orderAddressEntity,
    );

    return createdOrderAddress;
  }

  async deleteOrderAddress(id: number) {
    await this.orderAddressRepository.delete(id);
  }
}
