import { Injectable } from '@nestjs/common';
import { OrderAddress } from '../../models/entities/order-address.entity';
import { OrderAddressDto } from '../dto/order-address.dto';

@Injectable()
export class OrderAddressConverter {
  toEntity(dto: OrderAddressDto) {
    const entity = new OrderAddress();
    entity.address = dto.address;
    entity.longitude = dto.longitude;
    entity.latitude = dto.latitude;
    entity.shippingFee = dto.shipping_fee;
    return entity;
  }

  toDto(entity: OrderAddress) {
    const dto = {
      id: entity.id,
      address: entity.address,
      longitude: entity.longitude,
      latitude: entity.latitude,
      shipping_fee: entity.shippingFee,
    } as OrderAddressDto;

    return dto;
  }
}
