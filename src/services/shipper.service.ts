import { Shipper, Status } from '../models/shipper.entity';
import { ShipperDto, VehicleDto } from '../controllers/dto/shipper.dto';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, In, Repository } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { Vehicle } from 'src/models/vehicle.entity';
import * as fileType from 'file-type';
import * as path from 'path';
import { Buffer } from 'buffer';
import { promises } from 'fs';
import { uuid } from 'uuidv4';
import { isArray } from 'lodash';

@Injectable()
export class ShipperService {
  constructor(
    @InjectDataSource()
    private dataSource: DataSource,
  ) {}

  private async createVehicle(
    vehicleDto: VehicleDto,
    vehicleRepository: Repository<Vehicle>,
  ) {
    const vehicleEntity = new Vehicle();
    vehicleEntity.capacity = vehicleDto.capacity;
    vehicleEntity.dimension = vehicleDto.dimension;
    const createdVehicle = vehicleRepository.save(vehicleEntity);

    return createdVehicle;
  }

  async createAvatar(data: string) {
    const allowExtension = ['png', 'jpg', 'jpeg', 'webp'];

    const buf = Buffer.from(data, 'base64');
    const type = await fileType.fromBuffer(buf);
    const fileName = uuid();
    const serveStatic = 'http://localhost:3000/resources/';

    const filePath = path.join(
      __dirname,
      `../../resources/${fileName}.${type.ext}`,
    );

    const url = `${serveStatic}${fileName}.${type.ext}`;

    const ext = type.mime.split('/')[1];

    if (!allowExtension.includes(ext)) {
      throw new BadRequestException('Not allowed extension: ' + ext);
    }

    await promises.writeFile(filePath, buf);

    return url;
  }

  async createShipper(shipperDto: ShipperDto) {
    const createdShipper = await this.dataSource.transaction(
      async (manager) => {
        const shipperRepository = manager.getRepository(Shipper);
        const vehicleRepository = manager.getRepository(Vehicle);

        const createdVehicle = await this.createVehicle(
          shipperDto.vehicle,
          vehicleRepository,
        );
        const avatar = await this.createAvatar(shipperDto.avatar);

        const shipperEntity = new Shipper();
        shipperEntity.name = shipperDto.name;
        shipperEntity.email = shipperDto.email;
        shipperEntity.phone = shipperDto.phone;
        shipperEntity.avatar = avatar;
        shipperEntity.vehicle = createdVehicle;

        const createdShipper = await shipperRepository.save(shipperEntity);

        return createdShipper;
      },
    );
    console.log(createdShipper);
    return createdShipper;
  }

  async getListOfShipper(filter: Status[]) {
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

  async deleteShipper(id: number) {
    console.log(id);
    const createdListofDelivery = await this.dataSource.transaction(
      async (manager) => {
        const shipperRepository = manager.getRepository(Shipper);

        const firstDelivery = await shipperRepository.findOne({
          where: {
            id: id,
          },
          relations: ['vehicle'],
        });

        if (!firstDelivery) {
          throw new Error('The shipper id not found');
        }

        const deletedShipper = await shipperRepository.softRemove(
          firstDelivery,
        );

        return deletedShipper;
      },
    );
    return createdListofDelivery;
  }
}
