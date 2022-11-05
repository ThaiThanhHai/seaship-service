import { Order } from '../models/order.entity';
import { DataSource } from 'typeorm';
import { DeliveryDto } from '../controllers/dto/delivery.dto';
import { Injectable, BadRequestException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios/dist';
import { Shipper } from 'src/models/shipper.entity';
import { InjectDataSource } from '@nestjs/typeorm';
import { lastValueFrom, map } from 'rxjs';
import { Delivery } from 'src/models/delivery.entity';

@Injectable()
export class DeliveryService {
  constructor(
    @InjectDataSource()
    private dataSource: DataSource,
    private httpService: HttpService,
  ) {}
  async getListOfDelivery() {
    const page = 0;
    const limit = 10;
    const deliveryRepository = this.dataSource.manager.getRepository(Delivery);

    const [listOfDeliverys, count] = await deliveryRepository.findAndCount({
      relations: ['order', 'shippers', 'order.cargo', 'order.order_address'],
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
      deliveries: listOfDeliverys,
    };
  }

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
        const fristShipper = await shipperRepository.findOne({
          where: { id: id },
          relations: ['vehicle'],
        });
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
    const weights: number[] = [0];
    listOfOrder.map((item) => {
      weights.push(item.cargo.weight);
    });

    return weights;
  }

  private parseDimension(listOfOrder: Order[]) {
    const dimensions: number[] = [0];
    listOfOrder.map((item) => {
      dimensions.push(item.cargo.dimension);
    });

    return dimensions;
  }

  private parseVehicleCapacities(listOfShipper: Shipper[]) {
    const vehicleCapacities: number[] = [];
    listOfShipper.map((item) => {
      vehicleCapacities.push(item.vehicle.capacity);
    });
    return vehicleCapacities;
  }

  private parseVehicleDimensions(listOfShipper: Shipper[]) {
    const vehicleDimensions: number[] = [];
    listOfShipper.map((item) => {
      vehicleDimensions.push(item.vehicle.dimension);
    });
    return vehicleDimensions;
  }

  private async getVehicleRouting(
    coordinates: number[][],
    num_vehicles: number,
    weights: number[],
    vehicle_capacities: number[],
    dimensions: number[],
    vehicle_dimensions: number[],
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
      {
        coordinates,
        num_vehicles,
        weights,
        vehicle_capacities,
        dimensions,
        vehicle_dimensions,
        depot,
      },
      requestConfig,
    );
    const response = media.pipe(
      map((res) => {
        return res.data;
      }),
    );
    const result = await lastValueFrom(response);

    return { result };
  }

  private parseDeliveries(
    listOfOrder: any,
    listOfShipper: any,
    schedule: any[],
  ) {
    const result = [];
    schedule.forEach((value, shipper) => {
      const routes = value.route.filter((item: any) => item !== 0);
      const weights = value.weights.filter((item: any) => item !== 0);
      value.distances.pop();
      const distances = value.distances;
      const dimensions = value.dimensions.filter((item: any) => item !== 0);
      routes.forEach((order: any, index: any) => {
        const data = {
          distance: distances[index],
          weight: weights[index],
          dimension: dimensions[index],
          shippers: listOfShipper[shipper],
          order: listOfOrder[order - 1],
        };
        result.push(data);
      });
    });

    return result;
  }

  private async createDeliveries(listOfDelivery: any) {
    const createdListofDelivery = await this.dataSource.transaction(
      async (manager) => {
        const deliveryRepository = manager.getRepository(Delivery);
        const orderRepository = manager.getRepository(Order);
        const shipperRepository = manager.getRepository(Shipper);
        const createdDelivery = Promise.all(
          listOfDelivery.map(async (delivery: any) => {
            const deliveryEntity = new Delivery();
            deliveryEntity.distance = delivery.distance;
            deliveryEntity.weight = delivery.weight;
            deliveryEntity.dimension = delivery.dimension;
            deliveryEntity.date = new Date();
            deliveryEntity.order = delivery.order;
            deliveryEntity.shippers = delivery.shippers;
            const created = await deliveryRepository.save(deliveryEntity);

            delivery.order.status = 'delivering';
            delivery.shippers.status = 'off';
            await orderRepository.save(delivery.order);
            await shipperRepository.save(delivery.shippers);

            return created;
          }),
        );

        return createdDelivery;
      },
    );
    return createdListofDelivery;
  }

  async deliverySchedule(deliveryDto: DeliveryDto) {
    const listOfOrder = await this.getOrderByIds(deliveryDto.list_order);
    const listOfShipper = await this.getShipperByIds(deliveryDto.list_shipper);
    const num_vehicles = listOfShipper.length;
    const vehicle_capacities = this.parseVehicleCapacities(listOfShipper);
    const vehicle_dimensions = this.parseVehicleDimensions(listOfShipper);
    const coordinates = this.parseCordinates(listOfOrder);
    const weights = this.parseWeight(listOfOrder);
    const dimensions = this.parseDimension(listOfOrder);
    const depot = 0;

    const schedule = await this.getVehicleRouting(
      coordinates,
      num_vehicles,
      weights,
      vehicle_capacities,
      dimensions,
      vehicle_dimensions,
      depot,
    );

    const deliveryEntity = this.parseDeliveries(
      listOfOrder,
      listOfShipper,
      schedule.result,
    );

    const createdDeliveries = await this.createDeliveries(deliveryEntity);

    return createdDeliveries;
  }
}
