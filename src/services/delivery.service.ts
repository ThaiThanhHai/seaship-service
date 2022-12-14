import { DeliveryStatusDto } from './../controllers/dto/delivery.dto';
import { Order } from '../models/order.entity';
import { DataSource, In } from 'typeorm';
import { DeliveryDto } from '../controllers/dto/delivery.dto';
import { Injectable, BadRequestException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { Shipper } from 'src/models/shipper.entity';
import { InjectDataSource } from '@nestjs/typeorm';
import { lastValueFrom, map } from 'rxjs';
import { Delivery } from 'src/models/delivery.entity';
import { Status } from 'src/models/order.entity';
import { Status as ShipperStatus } from 'src/models/shipper.entity';
import { round, sum } from 'lodash';

@Injectable()
export class DeliveryService {
  constructor(
    @InjectDataSource()
    private dataSource: DataSource,
    private httpService: HttpService,
  ) {}
  async getListOfDelivery() {
    const shipperRepository = this.dataSource.manager.getRepository(Shipper);

    const [listOfShipper] = await shipperRepository.findAndCount({
      where: {
        status: In([ShipperStatus.DELIVERING]),
      },
      relations: [
        'vehicle',
        'delivery',
        'delivery.order',
        'delivery.order.order_address',
      ],
    });

    const response = [];
    listOfShipper.forEach((data) => {
      const statusOrder = data.delivery.map((item) => item.order.status);
      const totalFee = sum(
        data.delivery.map((item) => item.order.shipping_fee),
      );
      const totalDimension = data.delivery.map((item) => item.dimension);
      const totalDistance = data.delivery.map((item) => item.distance);
      const count = data.delivery.length;
      const dataCoord = data.delivery.map((data) => {
        return {
          lat: data.order.order_address.latitude,
          lng: data.order.order_address.longitude,
        };
      });
      const coordinates = [
        { lng: 105.77065821314767, lat: 10.03021894409099 },
        ...dataCoord,
        { lng: 105.77065821314767, lat: 10.03021894409099 },
      ];

      const order_ids = [0, ...data.delivery.map((data) => data.order.id), 0];
      const address = [
        'Kho h??ng (CTU)',
        ...data.delivery.map((data) => data.order.order_address.address),
        'Kho h??ng (CTU)',
      ];

      response.push({
        id: data.id,
        name: data.name,
        totalFee: totalFee,
        maxWeight: data.vehicle.capacity,
        totalDimension: round(sum(totalDimension), 2),
        maxDimension: data.vehicle.dimension,
        totalDistance: totalDistance[0],
        count: count,
        vehicle: data.vehicle.name,
        coordinates: coordinates,
        order_ids: order_ids,
        address: address,
        status: statusOrder,
      });
    });

    return {
      schedule_of_shipper: response,
    };
  }

  async getListOrderOfShipper(shipperId: string) {
    const deliveryRepository = this.dataSource.manager.getRepository(Delivery);

    const [listDeliveryOrder] = await deliveryRepository.findAndCount({
      where: {
        shippers: {
          id: parseInt(shipperId),
        },
      },
      relations: ['order', 'shippers', 'order.order_address', 'order.cargo'],
      order: {
        created_at: 'DESC',
      },
    });
    const response = [];
    listDeliveryOrder.forEach((data) => {
      response.push({
        id: data.id,
        shipper: data.shippers.name,
        name: data.order.cargo.name,
        dimension: data.dimension,
        weight: data.weight,
        address: data.order.order_address.address,
        fee: data.order.shipping_fee,
        status: data.order.status,
      });
    });

    return {
      list_delivery_order: response,
    };
  }

  async getDeliveryForShipper(shipper_id: string) {
    const deliveryRepository = this.dataSource.manager.getRepository(Delivery);

    const [listOfDeliverys, count] = await deliveryRepository.findAndCount({
      where: {
        shippers: {
          id: parseInt(shipper_id),
        },
        order: {
          status: Status.DELIVERING,
        },
      },
      relations: ['order', 'shippers', 'order.cargo', 'order.order_address'],
      order: {
        created_at: 'DESC',
      },
    });

    const data = listOfDeliverys.map((firstOrder) => {
      const result = {
        name: firstOrder.order.receiver_name,
        address: firstOrder.order.order_address.address,
        id: firstOrder.order.id,
      };
      return result;
    });
    return {
      total: count,
      data: data,
    };
  }

  async getOrderDetailForShipper(order_id: string) {
    const orderRepository = this.dataSource.manager.getRepository(Order);

    const firstOrder = await orderRepository.findOne({
      where: {
        id: parseInt(order_id),
      },
      relations: ['cargo', 'order_address', 'delivery', 'delivery_type'],
    });

    const data = {
      id: firstOrder.id,
      name: firstOrder.cargo.name,
      address: firstOrder.order_address.address,
      shipping_fee: firstOrder.shipping_fee,
      distance: firstOrder.delivery.distance,
      delivery_type: firstOrder.delivery_type.name,
    };
    return data;
  }

  async updateStatusDelivery(
    order_id: string,
    deliveryStatusDto: DeliveryStatusDto,
  ) {
    const orderRepository = this.dataSource.manager.getRepository(Order);
    const shipperRepository = this.dataSource.manager.getRepository(Shipper);

    const firstOrder = await orderRepository.findOne({
      where: {
        id: parseInt(order_id),
      },
      relations: ['delivery.shippers'],
    });

    firstOrder.failure_reason =
      deliveryStatusDto.failure_reason ?? deliveryStatusDto.failure_reason;

    const listOrderOfShipper = await this.getDeliveryForShipper(
      firstOrder.delivery.shippers.id.toString(),
    );

    if (listOrderOfShipper.total === 1) {
      const firstShiper = await shipperRepository.findOneBy({
        id: firstOrder.delivery.shippers.id,
      });
      firstShiper.status = ShipperStatus.ACTIVE;
      await shipperRepository.save(firstShiper);
    }

    firstOrder.status = deliveryStatusDto.status;

    const updatedOrder = await orderRepository.save(firstOrder);

    return updatedOrder;
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
    const locateDepot = [10.0301, 105.7706];
    const coordinates: number[][] = [locateDepot];
    listOfOrder.map((firstOrder) => {
      coordinates.push([
        firstOrder.order_address.latitude,
        firstOrder.order_address.longitude,
      ]);
    });

    return coordinates;
  }

  private parseWeight(listOfOrder: Order[]) {
    const weights: number[] = [0];
    listOfOrder.map((firstOrder) => {
      weights.push(firstOrder.cargo.weight);
    });

    return weights;
  }

  private parseDimension(listOfOrder: Order[]) {
    const dimensions: number[] = [0];
    listOfOrder.map((firstOrder) => {
      dimensions.push(firstOrder.cargo.dimension);
    });

    return dimensions;
  }

  private parseVehicleWeights(listOfShipper: Shipper[]) {
    const vehicleWeights: number[] = [];
    listOfShipper.map((firstOrder) => {
      vehicleWeights.push(firstOrder.vehicle.capacity);
    });
    return vehicleWeights;
  }

  private parseVehicleDimensions(listOfShipper: Shipper[]) {
    const vehicleDimensions: number[] = [];
    listOfShipper.map((firstOrder) => {
      vehicleDimensions.push(firstOrder.vehicle.dimension);
    });
    return vehicleDimensions;
  }

  private async getVehicleRouting(
    coordinates: number[][],
    num_vehicles: number,
    dimension: number[],
    vehicle_dimension: number[],
    depot: number,
    max_travel: number,
  ) {
    const requestConfig = {
      maxBodyLength: Infinity,
      headers: {
        'Content-Type': 'application/json',
      },
    };
    const url = 'http://localhost:3000/api/v1/python';
    console.log({
      coordinates,
      num_vehicles,
      dimension,
      vehicle_dimension,
      depot,
      max_travel,
    });
    const media = this.httpService.post(
      url,
      {
        coordinates,
        num_vehicles,
        dimension,
        vehicle_dimension,
        depot,
        max_travel,
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
      const routes = value.route.filter((firstOrder: any) => firstOrder !== 0);
      routes.forEach((order: any) => {
        const data = {
          distance: value.total_distance,
          dimension: value.total_dimension,
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
            deliveryEntity.weight = delivery.order.cargo.weight;
            deliveryEntity.dimension = delivery.order.cargo.dimension;
            deliveryEntity.date = new Date();
            deliveryEntity.order = delivery.order;
            deliveryEntity.shippers = delivery.shippers;
            const created = await deliveryRepository.save(deliveryEntity);

            delivery.order.status = 'delivering';
            delivery.shippers.status = 'delivering';
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

  async deliveryScheduleTruck(deliveryDto: DeliveryDto) {
    const listOfOrder = await this.getOrderByIds(deliveryDto.list_order);
    const listOfShipper = await this.getShipperByIds(deliveryDto.list_shipper);
    const num_vehicles = listOfShipper.length;
    const vehicle_dimension = this.parseVehicleDimensions(listOfShipper);
    const coordinates = this.parseCordinates(listOfOrder);
    const dimensions = this.parseDimension(listOfOrder);
    const depot = 0;
    const max_travel = 500000;

    const schedule = await this.getVehicleRouting(
      coordinates,
      num_vehicles,
      dimensions,
      vehicle_dimension,
      depot,
      max_travel,
    );

    const deliveryEntity = this.parseDeliveries(
      listOfOrder,
      listOfShipper,
      schedule.result,
    );

    const createdDeliveries = await this.createDeliveries(deliveryEntity);

    return createdDeliveries;
  }

  async deliveryScheduleMotorbike(deliveryDto: DeliveryDto) {
    const listOfOrder = await this.getOrderByIds(deliveryDto.list_order);
    const listOfShipper = await this.getShipperByIds(deliveryDto.list_shipper);
    const num_vehicles = listOfShipper.length;
    const vehicle_dimension = this.parseVehicleDimensions(listOfShipper);
    const coordinates = this.parseCordinates(listOfOrder);
    const dimensions = this.parseDimension(listOfOrder);
    const depot = 0;
    const max_travel = 500;

    const schedule = await this.getVehicleRouting(
      coordinates,
      num_vehicles,
      dimensions,
      vehicle_dimension,
      depot,
      max_travel,
    );

    const deliveryEntity = this.parseDeliveries(
      listOfOrder,
      listOfShipper,
      schedule.result,
    );

    const createdDeliveries = await this.createDeliveries(deliveryEntity);

    return createdDeliveries;
  }

  async deleteDelivery(id: number) {
    const createdListofDelivery = await this.dataSource.transaction(
      async (manager) => {
        const deliveryRepository = manager.getRepository(Delivery);

        const firstDelivery = await deliveryRepository.findOne({
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
