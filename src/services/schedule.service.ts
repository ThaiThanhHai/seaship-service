import { Order } from './../models/order.entity';
import { DataSource } from 'typeorm';
import { ScheduleDto } from './../controllers/dto/schedule.dto';
import { Injectable, BadRequestException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios/dist';
import { Shipper } from 'src/models/shipper.entity';
import { InjectDataSource } from '@nestjs/typeorm';
import { lastValueFrom, map } from 'rxjs';

@Injectable()
export class ScheduleService {
  constructor(
    @InjectDataSource()
    private dataSource: DataSource,
    private httpService: HttpService,
  ) {}

  private async getOrderByIds(ids: number[]) {
    const listOfOrder = await Promise.all(
      ids.map(async (id) => {
        const orderRepository = this.dataSource.manager.getRepository(Order);
        const fristOrder = await orderRepository.findOne({
          where: {
            id: id,
          },
          relations: ['order_address', 'cargo'],
          order: {
            created_at: 'DESC',
          },
        });

        if (!fristOrder) {
          throw new BadRequestException(`The order_id ${id} not found`);
        }
        return fristOrder;
      }),
    );
    return listOfOrder;
  }

  private async getShipperByIds(ids: number[]) {
    const listOfShipper = await Promise.all(
      ids.map(async (id) => {
        const shipperRepository =
          this.dataSource.manager.getRepository(Shipper);
        const fristShipper = await shipperRepository.findOneBy({ id });
        if (!fristShipper) {
          throw new BadRequestException(`The shipper_id ${id} not found`);
        }
        return fristShipper;
      }),
    );

    return listOfShipper;
  }

  private parseCordinates(listOfOrder: Order[]) {
    // Default depot location: Can Tho University
    const locateDepot = [10.030113295509345, 105.77061529689202];
    const coordinates: number[][] = [locateDepot];
    listOfOrder.map((item) => {
      coordinates.push([
        parseFloat(item.order_address.latitude),
        parseFloat(item.order_address.longitude),
      ]);
    });

    return coordinates;
  }

  private parseWeight(listOfOrder: Order[]) {
    const weights: number[] = [];
    listOfOrder.map((item) => {
      weights.push(item.cargo.weight);
    });

    return weights;
  }

  private parseDimension(listOfOrder: Order[]) {
    const dimensions: number[] = [];
    listOfOrder.map((item) => {
      dimensions.push(item.cargo.dimension);
    });

    return dimensions;
  }

  private async getVehicleRouting(
    coordinates: number[][],
    num_vehicles: number,
    weights: number[],
    dimensions: number[],
    depot: number,
  ) {
    const requestConfig = {
      maxBodyLength: Infinity,
      headers: {
        'Content-Type': 'application/json',
      },
    };
    const url = 'http://localhost:3000/api/v1/python';
    const media = this.httpService.post(
      url,
      { coordinates, num_vehicles, weights, dimensions, depot },
      requestConfig,
    );
    const response = media.pipe(
      map((res) => {
        return res.data;
      }),
    );
    const result = await lastValueFrom(response);

    return { KETQUA: result };
  }

  async deliverySchedule(scheduleDto: ScheduleDto) {
    const listOfOrder = await this.getOrderByIds(scheduleDto.list_order);
    const listOfShipper = await this.getShipperByIds(scheduleDto.list_shipper);
    const num_vehicles = listOfShipper.length;
    const coordinates = this.parseCordinates(listOfOrder);
    const weights = this.parseWeight(listOfOrder);
    const dimensions = this.parseDimension(listOfOrder);
    const depot = 0;

    const result = await this.getVehicleRouting(
      coordinates,
      num_vehicles,
      weights,
      dimensions,
      depot,
    );
    // const result = this.pythonService.getVehicleRouting(
    //   coordinates,
    //   vehicles,
    //   depot,
    //   weights,
    //   dimensions,
    //   res,
    // );

    return result;
  }
}
