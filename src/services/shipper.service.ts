import { Shipper } from '../models/shipper.entity';
import { ShipperDto, VehicleDto } from '../controllers/dto/shipper.dto';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { Vehicle } from 'src/models/vehicle.entity';
import * as fileType from 'file-type';
import * as path from 'path';
import { Buffer } from 'buffer';
import { promises } from 'fs';
import { uuid } from 'uuidv4';

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
    const allowExtension = ['png', 'jpg', 'jpeg'];

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
        shipperEntity.age = shipperDto.age;
        shipperEntity.email = shipperDto.email;
        shipperEntity.phone = shipperDto.phone;
        shipperEntity.avatar = avatar;
        shipperEntity.vehicle = createdVehicle;

        const createdShipper = await shipperRepository.save(shipperEntity);

        return createdShipper;
      },
    );
    return createdShipper;
  }

  async getListOfShipper() {
    const page = 0;
    const limit = 10;
    const shipperRepository = this.dataSource.manager.getRepository(Shipper);

    const [listOfShipper, count] = await shipperRepository.findAndCount({
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
      delivery_types: listOfShipper,
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
}
