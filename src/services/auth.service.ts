import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { Shipper } from 'src/models/shipper.entity';
import { LoginDto } from 'src/controllers/dto/login.dto';
import { RegisterDto } from 'src/controllers/dto/register.dto';
import { Vehicle } from 'src/models/vehicle.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectDataSource()
    private dataSource: DataSource,
  ) {}

  async login(loginDto: LoginDto) {
    const shipperRepository = this.dataSource.manager.getRepository(Shipper);
    const firstShipper = await shipperRepository.findOneBy({
      phone: loginDto.phone,
    });

    if (!firstShipper) {
      throw new Error('Phone not found');
    }

    return firstShipper;
  }

  private async checkPhoneNotExist(phone: string) {
    const shipperRepository = this.dataSource.manager.getRepository(Shipper);
    const firstShipper = await shipperRepository.findOneBy({
      phone: phone,
    });

    if (firstShipper) {
      return true;
    }

    return false;
  }

  async register(registerDto: RegisterDto) {
    const createdShipper = await this.dataSource.transaction(
      async (manager) => {
        const shipperRepository = manager.getRepository(Shipper);
        const vehicleRepository = manager.getRepository(Vehicle);
        const vehicleEntity = new Vehicle();
        vehicleEntity.dimension = 250;
        vehicleEntity.capacity = 50;

        if (registerDto.vehicle === 'truck') {
          vehicleEntity.dimension = 8000;
          vehicleEntity.capacity = 1000;
        }
        const createdVehicle = await vehicleRepository.save(vehicleEntity);

        const isPhone = await this.checkPhoneNotExist(registerDto.phone);
        if (isPhone) {
          throw new Error('Phone is exist');
        }

        const shipperEntity = new Shipper();
        shipperEntity.name = registerDto.name;
        shipperEntity.phone = registerDto.phone;
        shipperEntity.email = registerDto.email;
        shipperEntity.avatar = 'https://i.imgur.com/TFSas8Z.png';
        shipperEntity.vehicle = createdVehicle;
        const createdShipper = await shipperRepository.save(shipperEntity);

        return createdShipper;
      },
    );
    return createdShipper;
  }
}
