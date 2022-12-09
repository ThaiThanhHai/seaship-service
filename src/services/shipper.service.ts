import { Shipper, Status } from '../models/shipper.entity';
import { ShipperDto } from '../controllers/dto/shipper.dto';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, In } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { Vehicle } from 'src/models/vehicle.entity';
// import * as fileType from 'file-type';
// import * as path from 'path';
// import { Buffer } from 'buffer';
// import { promises } from 'fs';
// import { uuid } from 'uuidv4';
import { isArray, round } from 'lodash';
import { Delivery } from 'src/models/delivery.entity';

@Injectable()
export class ShipperService {
  constructor(
    @InjectDataSource()
    private dataSource: DataSource,
  ) {}

  // async createAvatar(data: string) {
  //   const allowExtension = ['png', 'jpg', 'jpeg', 'webp'];

  //   const buf = Buffer.from(data, 'base64');
  //   const type = await fileType.fromBuffer(buf);
  //   const fileName = uuid();
  //   const serveStatic = 'http://localhost:3000/resources/';

  //   const filePath = path.join(
  //     __dirname,
  //     `../../resources/${fileName}.${type.ext}`,
  //   );

  //   const url = `${serveStatic}${fileName}.${type.ext}`;

  //   const ext = type.mime.split('/')[1];

  //   if (!allowExtension.includes(ext)) {
  //     throw new BadRequestException('Not allowed extension: ' + ext);
  //   }

  //   await promises.writeFile(filePath, buf);

  //   return url;
  // }

  async createShipper(shipperDto: ShipperDto) {
    const createdShipper = await this.dataSource.transaction(
      async (manager) => {
        const shipperRepository = manager.getRepository(Shipper);
        const vehicleRepository = manager.getRepository(Vehicle);

        const vehicleEntity = new Vehicle();
        vehicleEntity.name = 'motorbike';
        vehicleEntity.dimension = 56;
        vehicleEntity.capacity = 20;

        if (shipperDto.vehicle === 'truck') {
          vehicleEntity.name = 'truck';
          vehicleEntity.dimension = 1360;
          vehicleEntity.capacity = 1000;
        }
        const createdVehicle = await vehicleRepository.save(vehicleEntity);

        const shipperEntity = new Shipper();
        shipperEntity.name = shipperDto.name;
        shipperEntity.email = shipperDto.email;
        shipperEntity.phone = shipperDto.phone;
        shipperEntity.avatar =
          'http://localhost:3000/resources/47a4e00b-a0d2-406f-9199-d32f5f7dc404.png';
        shipperEntity.vehicle = createdVehicle;

        const createdShipper = await shipperRepository.save(shipperEntity);

        return createdShipper;
      },
    );
    return createdShipper;
  }

  async getListOfShipper(filter: Status[], vehicle: string) {
    const page = 0;
    const limit = 10;
    let filterValue = filter;
    if (!isArray(filter)) {
      filterValue = [filter];
    }
    const shipperRepository = this.dataSource.manager.getRepository(Shipper);

    const [listOfShipper, count] = await shipperRepository.findAndCount({
      where: {
        status: filter ? In(filterValue) : undefined,
        vehicle: vehicle
          ? {
              name: vehicle,
            }
          : undefined,
      },
      relations: ['vehicle'],
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
      shippers: listOfShipper,
    };
  }

  async getShipperById(id: number): Promise<Shipper> {
    const shipperRepository = this.dataSource.manager.getRepository(Shipper);

    const firstShipper = await shipperRepository.findOneBy({
      id: id,
    });

    if (!firstShipper) {
      throw new NotFoundException('The delivery type id not found');
    }

    return firstShipper;
  }

  async deleteShipper(ids: Array<number>) {
    const createdListofDelivery = await this.dataSource.transaction(
      async (manager) => {
        const shipperRepository = manager.getRepository(Shipper);

        Promise.all(
          ids.map(async (id) => {
            const deleteResponse = await shipperRepository.delete(id);
            if (!deleteResponse.affected) {
              throw new BadRequestException('Not found');
            }
          }),
        );
      },
    );
    return createdListofDelivery;
  }

  async getDataForRoutingPage(id: number) {
    const shipperRepository = this.dataSource.manager.getRepository(Shipper);

    const firstShipper = await shipperRepository.findOne({
      where: {
        id: id,
      },
      relations: [
        'delivery',
        'delivery.order',
        'delivery.order.cargo',
        'delivery.order.order_address',
      ],
    });

    if (!firstShipper) {
      throw new NotFoundException('The delivery type id not found');
    }

    const coordinates = firstShipper.delivery.length
      ? [
          { lng: 105.77065821314767, lat: 10.03021894409099 },
          ...firstShipper.delivery.map((delivery) => {
            return {
              lng: delivery.order.order_address.longitude,
              lat: delivery.order.order_address.latitude,
            };
          }),
          { lng: 105.77065821314767, lat: 10.03021894409099 },
        ]
      : [];

    const response = {
      total_order: firstShipper.delivery.length,
      total_distance: firstShipper.delivery.length
        ? firstShipper.delivery[0].distance
        : 0,
      total_weight: firstShipper.delivery.length
        ? round(firstShipper.delivery[0].weight, 0)
        : 0,
      coordinates: coordinates,
    };

    return response;
  }

  async getOrderForListOrderPage(id: number) {
    const shipperRepository = this.dataSource.manager.getRepository(Shipper);

    const firstShipper = await shipperRepository.findOne({
      where: {
        id: id,
        delivery: {
          order: {
            status: In([Status.DELIVERING]),
          },
        },
      },
      relations: [
        'delivery',
        'delivery.order',
        'delivery.order.cargo',
        'delivery.order.order_address',
      ],
    });

    if (!firstShipper) {
      throw new NotFoundException('The delivery type id not found');
    }

    const response = firstShipper.delivery.map((delivery) => {
      const data = {
        id: delivery.order.id,
        name: delivery.order.cargo.name,
        address: delivery.order.order_address.address,
      };
      return data;
    });

    return response;
  }

  async getDetailOrderPage(shipper_id: number, order_id: number) {
    const deliveryRepository = this.dataSource.manager.getRepository(Delivery);

    const deliveries = await deliveryRepository.findOne({
      where: {
        order: {
          id: order_id,
        },
        shippers: {
          id: shipper_id,
        },
      },
      relations: ['order', 'order.cargo', 'order.order_address'],
    });

    const response = {
      order_name: deliveries.order.cargo.name,
      receiver_name: deliveries.order.receiver_name,
      phone: deliveries.order.receiver_phone,
      shipping_fee: deliveries.order.shipping_fee,
      address: deliveries.order.order_address.address,
      coordinate: {
        lat: deliveries.order.order_address.latitude,
        lng: deliveries.order.order_address.longitude,
      },
    };

    return response;
  }

  async getDataStatisticPage(id: number) {
    const deliveryRepository = this.dataSource.manager.getRepository(Delivery);

    const deliveries = await deliveryRepository.find({
      where: {
        shippers: {
          id: id,
        },
      },
      relations: ['order', 'order.cargo', 'order.order_address'],
    });

    return deliveries;
  }
}
