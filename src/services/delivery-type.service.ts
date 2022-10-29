import { DeliveryType } from './../models/entities/delivery-type.entity';
import { DeliveryTypeDto } from './../controllers/dto/delivery-type.dto';
import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { DeliveryTypeConverter } from './../controllers/converters/delivery-type.converter';
import { DeliveryTypeListConverter } from './../controllers/converters/delivery-type-list.converter';
import { DeliveryTypeListDto } from 'src/controllers/dto/delivery-type-list.dto';

@Injectable()
export class DeliveryTypeService {
  constructor(
    @Inject('DELIVERY_TYPE_REPOSITORY')
    private deliveryTypeRepository: Repository<DeliveryType>,
    private readonly deliveryTypeConverter: DeliveryTypeConverter,
    private readonly deliveryTypeListConverter: DeliveryTypeListConverter,
  ) {}

  async createDeliveryType(
    deliveryTypeDto: DeliveryTypeDto,
  ): Promise<DeliveryTypeDto> {
    const deliveryTypeEntity =
      this.deliveryTypeConverter.toEntity(deliveryTypeDto);

    const createdDeliveryType = await this.deliveryTypeRepository.save(
      deliveryTypeEntity,
    );

    return this.deliveryTypeConverter.toDto(createdDeliveryType);
  }

  async getDeliveryTypes(): Promise<DeliveryTypeListDto> {
    const page = 0;
    const limit = 10;
    const [listDeliveryTypes, count] =
      await this.deliveryTypeRepository.findAndCount({
        order: {
          created_at: 'DESC',
        },
        skip: page,
        take: limit,
      });
    return this.deliveryTypeListConverter.toDto(
      page,
      limit,
      count,
      listDeliveryTypes,
    );
  }

  async getDeliveryTypeById(id: number): Promise<DeliveryType> {
    const firstDeliveryType = await this.deliveryTypeRepository.findOneBy({
      id: id,
    });

    if (!firstDeliveryType) {
      throw new NotFoundException('The delivery type id not found');
    }

    return firstDeliveryType;
  }
}
