import { DeliveryTypeService } from './delivery-type.service';
import { Injectable, Inject, Res } from '@nestjs/common';
import { Repository } from 'typeorm';
import { PythonService } from './python.service';
import { Order } from '../models/entities/order.entity';
import { OrderDto } from '../controllers/dto/order.dto';
import { OrderConverter } from 'src/controllers/converters/order.converter';
import { OrderAddressService } from './order-address.service';
import { OrderAddressConverter } from 'src/controllers/converters/order-address.converter';

@Injectable()
export class OrderService {
  constructor(
    private readonly pythonService: PythonService,
    @Inject('ORDER_REPOSITORY')
    private orderRepository: Repository<Order>,
    private deliveryTypeService: DeliveryTypeService,
    private orderAddressService: OrderAddressService,
    private readonly orderConverter: OrderConverter,
    private readonly orderAddressConverter: OrderAddressConverter,
  ) {}

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
}
