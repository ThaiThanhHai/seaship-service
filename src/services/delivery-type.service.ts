import { DeliveryType } from './../models/delivery-type.entity';
import { DeliveryTypeDto } from './../controllers/dto/delivery-type.dto';
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { Supervisor } from 'src/models/supervisor.entity';

@Injectable()
export class DeliveryTypeService {
  constructor(
    @InjectDataSource()
    private dataSource: DataSource,
  ) {}

  private async getSupervisorById(
    id: number,
    supervisorRepository: Repository<Supervisor>,
  ) {
    const supervisor = await supervisorRepository.findOneBy({ id });

    if (!supervisor) {
      throw new BadRequestException('The supervisor id not found');
    }

    return supervisor;
  }

  async createDeliveryType(deliveryTypeDto: DeliveryTypeDto) {
    const createdDeliveryType = await this.dataSource.transaction(
      async (manager) => {
        const deliveryTypeRepository = manager.getRepository(DeliveryType);
        const supervisorRepository = manager.getRepository(Supervisor);

        const supervisor = await this.getSupervisorById(
          deliveryTypeDto.supervisor_id,
          supervisorRepository,
        );

        const deliveryTypeEntity = new DeliveryType();
        deliveryTypeEntity.name = deliveryTypeDto.name;
        deliveryTypeEntity.price_inner = deliveryTypeDto.price_inner;
        deliveryTypeEntity.price_outer = deliveryTypeDto.price_outer;
        deliveryTypeEntity.overpriced = deliveryTypeDto.overpriced;
        deliveryTypeEntity.supervisor = supervisor;
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

  async deleteDeliveryType(ids: Array<number>) {
    const createdListofDelivery = await this.dataSource.transaction(
      async (manager) => {
        const deliveryTypeRepository = manager.getRepository(DeliveryType);

        Promise.all(
          ids.map(async (id) => {
            const deleteResponse = await deliveryTypeRepository.softDelete(id);
            if (!deleteResponse.affected) {
              throw new BadRequestException('Not found');
            }
          }),
        );
      },
    );
    return createdListofDelivery;
  }
}
