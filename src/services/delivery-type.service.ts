import { DeliveryType } from './../models/delivery-type.entity';
import { DeliveryTypeDto } from './../controllers/dto/delivery-type.dto';
import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';

@Injectable()
export class DeliveryTypeService {
  constructor(
    @InjectDataSource()
    private dataSource: DataSource,
  ) {}

  async createDeliveryType(deliveryTypeDto: DeliveryTypeDto) {
    const createdDeliveryType = await this.dataSource.transaction(
      async (manager) => {
        const deliveryTypeRepository = manager.getRepository(DeliveryType);
        const deliveryTypeEntity = new DeliveryType();
        deliveryTypeEntity.name = deliveryTypeDto.name;
        deliveryTypeEntity.price_inner = deliveryTypeDto.price_inner;
        deliveryTypeEntity.price_outer = deliveryTypeDto.price_outer;
        deliveryTypeEntity.overpriced = deliveryTypeDto.overpriced;
        deliveryTypeEntity.delivery_days = deliveryTypeDto.delivery_days;
        const createdDeliveryType = await deliveryTypeRepository.save(
          deliveryTypeEntity,
        );

        return createdDeliveryType;
      },
    );
    return createdDeliveryType;
  }

  async getListOfDeliveryType() {
    const page = 0;
    const limit = 10;
    const deliveryTypeRepository =
      this.dataSource.manager.getRepository(DeliveryType);

    const [listOfDeliveryTypes, count] =
      await deliveryTypeRepository.findAndCount({
        order: {
          created_at: 'DESC',
        },
        skip: page,
        take: limit,
      });
    return {
      page: page,
      limit: limit,
      total: count,
      delivery_types: listOfDeliveryTypes,
    };
  }

  async getDeliveryTypeById(id: number): Promise<DeliveryType> {
    const deliveryTypeRepository =
      this.dataSource.manager.getRepository(DeliveryType);

    const firstDeliveryType = await deliveryTypeRepository.findOneBy({
      id: id,
    });

    if (!firstDeliveryType) {
      throw new NotFoundException('The delivery type id not found');
    }

    return firstDeliveryType;
  }

  async deleteDeliveryType(id: number) {
    const createdListofDelivery = await this.dataSource.transaction(
      async (manager) => {
        const deliveryTypeRepository = manager.getRepository(DeliveryType);

        const firstDelivery = await deliveryTypeRepository.findOne({
          where: {
            id: id,
          },
          relations: ['shippers', 'order'],
        });

        return firstDelivery;
      },
    );
    return createdListofDelivery;
  }
}
