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
import { isArray } from 'lodash';

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
        vehicleEntity.dimension = 250;
        vehicleEntity.capacity = 50;

        if (shipperDto.vehicle === 'truck') {
          vehicleEntity.name = 'truck';
          vehicleEntity.dimension = 8000;
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
}
