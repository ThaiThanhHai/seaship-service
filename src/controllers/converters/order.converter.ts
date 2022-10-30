import { Injectable } from '@nestjs/common';
import { Order } from '../../models/entities/order.entity';
import { OrderDto } from '../dto/order.dto';
import { OrderAddressConverter } from './order-address.converter';

@Injectable()
export class OrderConverter {
  constructor(private readonly orderAddressConverter: OrderAddressConverter) {}
  toEntity(dto: OrderDto) {
    const entity = new Order();
    entity.orderName = dto.order_name;
    entity.senderName = dto.sender_name;
    entity.senderPhone = dto.sender_phone;
    entity.receiverName = dto.receiver_name;
    entity.receiverPhone = dto.receiver_phone;
    entity.weight = dto.weight;
    entity.note = dto.note;
    entity.dimension = dto.dimension;
    return entity;
  }

  toDto(entity: Order) {
    const dto = {
      id: entity.id,
      order_name: entity.orderName,
      sender_name: entity.senderName,
      sender_phone: entity.senderPhone,
      receiver_name: entity.receiverName,
      receiver_phone: entity.receiverPhone,
      weight: entity.weight,
      dimension: entity.dimension,
      status: entity.status,
      note: entity.note,
      delivery_time: entity.deliveryTime,
      order_address: this.orderAddressConverter.toDto(entity.orderAddress),
    } as OrderDto;

    return dto;
  }
}
