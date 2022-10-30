import { OrderConverter } from 'src/controllers/converters/order.converter';
import { Injectable } from '@nestjs/common';
import { Order } from '../../models/entities/order.entity';
import { OrderListDto } from '../dto/order-list.dto';

@Injectable()
export class OrderListConverter {
  constructor(private readonly orderConverter: OrderConverter) {}
  toDto(page: number, limit: number, total: number, entity: Order[]) {
    const dto = {
      page: page,
      limit: limit,
      total: total,
      orders: entity.map((data) => this.orderConverter.toDto(data)),
    } as OrderListDto;

    return dto;
  }
}
