import { DeliveryTypeService } from './delivery-type.service';
import { Injectable, Inject, Res, NotFoundException } from '@nestjs/common';
import { Like, Raw, Repository } from 'typeorm';
import { PythonService } from './python.service';
import { Order } from '../models/entities/order.entity';
import { OrderDto } from '../controllers/dto/order.dto';
import { OrderConverter } from 'src/controllers/converters/order.converter';
import { OrderAddressService } from './order-address.service';
import { OrderListConverter } from 'src/controllers/converters/order-list.converter';

@Injectable()
export class OrderService {
  constructor(
    private readonly pythonService: PythonService,
    @Inject('ORDER_REPOSITORY')
    private orderRepository: Repository<Order>,
    private deliveryTypeService: DeliveryTypeService,
    private orderAddressService: OrderAddressService,
    private readonly orderConverter: OrderConverter,
    private readonly orderListConverter: OrderListConverter,
  ) {}

  async getOrderById(id: number): Promise<OrderDto> {
    const firstOrder = await this.orderRepository.findOne({
      where: { id: id },
      relations: ['orderAddress'],
    });

    if (!firstOrder) {
      throw new NotFoundException('The order id not found');
    }

    return this.orderConverter.toDto(firstOrder);
  }

  async createOrder(orderDto: OrderDto) {
    const today = new Date();
    const orderEntity = this.orderConverter.toEntity(orderDto);

    const firstDeliveryType =
      await this.deliveryTypeService.getDeliveryTypeById(
        orderDto.delivery_type_id,
      );

    orderEntity.deliveryTime = new Date(
      today.setDate(today.getDate() + firstDeliveryType.deliveryDays),
    );

    const orderAddressEntity =
      await this.orderAddressService.createOrderAddress(orderDto.order_address);

    if (!orderAddressEntity) {
      throw new Error('Invalid value');
    }

    orderEntity.orderAddress = orderAddressEntity;
    orderEntity.deliveryType = firstDeliveryType;

    const createdOrder = await this.orderRepository.save(orderEntity);

    if (!createdOrder) {
      await this.orderAddressService.deleteOrderAddress(orderAddressEntity.id);
    }

    return this.orderConverter.toDto(createdOrder);
  }

  deliverySchedule(@Res() res) {
    this.getCoordinates();
    const coordinates = [
      [10.045162, 105.746857],
      [10.762622, 106.660172],
      [10.086128, 106.016997],
      [9.812741, 106.299291],
    ];
    const num_vehicles = 4;
    const depot = 0;
    const weight = 100;
    const dimension = 50;
    const result = this.pythonService.getVehicleRouting(
      coordinates,
      num_vehicles,
      depot,
      weight,
      dimension,
      res,
    );

    return result;
  }

  async getCoordinates() {
    const today = new Date();
    const date = `${today.getFullYear()}-${
      today.getMonth() + 1
    }-${today.getDate()}`;

    const [orders, count] = await this.orderRepository.findAndCount({
      where: {
        deliveryTime: Raw((alias) => `${alias} = :date`, {
          date: date,
        }),
      },
      relations: ['orderAddress'],
      order: {
        createdAt: 'DESC',
      },
    });

    const coordinates = [];
    orders.map((item) => {
      // console.log([item.orderAddress.latitude, item.orderAddress.longitude]);
      coordinates.push([
        item.orderAddress.latitude,
        item.orderAddress.longitude,
      ]);
    });
    return { coordinates, count };
  }

  async getOrders(query) {
    let page = 0;
    let limit = 6;
    if (query['page'] && query['limit']) {
      limit = query['limit'];
      page = (query['page'] - 1) * limit;
    }

    const search = query['search'] ? query['search'] : '';
    const [orders, count] = await this.orderRepository.findAndCount({
      where: {
        orderName: Like(`%${search}%`),
      },
      relations: ['orderAddress'],
      order: {
        createdAt: 'DESC',
      },
      skip: page,
      take: limit,
    });

    return this.orderListConverter.toDto(page, limit, count, orders);
  }
}
