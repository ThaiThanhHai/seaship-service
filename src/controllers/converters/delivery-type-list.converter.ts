import { Injectable } from '@nestjs/common';
import { DeliveryTypeConverter } from './delivery-type.converter';
import { DeliveryType } from '../../models/entities/delivery-type.entity';
import { DeliveryTypeListDto } from '../dto/delivery-type-list.dto';

@Injectable()
export class DeliveryTypeListConverter {
  constructor(private readonly deliveryTypeConverter: DeliveryTypeConverter) {}
  toDto(page: number, limit: number, total: number, entity: DeliveryType[]) {
    const dto = {
      page: page,
      limit: limit,
      total: total,
      delivery_types: entity.map((data) =>
        this.deliveryTypeConverter.toDto(data),
      ),
    } as DeliveryTypeListDto;

    return dto;
  }
}
