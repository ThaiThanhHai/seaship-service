import { Injectable } from '@nestjs/common';
import { DeliveryType } from '../../models/entities/delivery-type.entity';
import { DeliveryTypeDto } from '../dto/delivery-type.dto';

@Injectable()
export class DeliveryTypeConverter {
  toEntity(dto: DeliveryTypeDto) {
    const entity = new DeliveryType();
    entity.name = dto.name;
    entity.priceInner = dto.price_inner;
    entity.priceOuter = dto.price_outer;
    entity.overpriced = dto.overpriced;
    entity.deliveryDays = dto.delivery_hours;
    return entity;
  }

  toDto(entity: DeliveryType) {
    const dto = {
      id: entity.id,
      name: entity.name,
      price_inner: entity.priceInner,
      price_outer: entity.priceOuter,
      overpriced: entity.overpriced,
      delivery_hours: entity.deliveryDays,
    } as DeliveryTypeDto;

    return dto;
  }
}
