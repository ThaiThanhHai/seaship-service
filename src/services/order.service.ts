import { DeliveryType } from './../models/delivery-type.entity';
import { OrderAddress } from './../models/order-address.entity';
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Repository, DataSource } from 'typeorm';
import { Order, Status } from '../models/order.entity';
import {
  OrderDto,
  CargoDto,
  OrderAddressDto,
} from '../controllers/dto/order.dto';
import { InjectDataSource } from '@nestjs/typeorm';
import { Cargo } from 'src/models/cargo.entity';

@Injectable()
export class OrderService {
  constructor(
    @InjectDataSource()
    private dataSource: DataSource,
  ) {}

  private async getDeliveryTypeById(
    id: number,
    deliveryTypeRepository: Repository<DeliveryType>,
  ) {
    const firstDeliveryType = await deliveryTypeRepository.findOneBy({ id });

    if (!firstDeliveryType) {
      throw new BadRequestException('The delivery type id not found');
    }

    return firstDeliveryType;
  }

  private async createCargo(
    cargoDto: CargoDto,
    cargoRepository: Repository<Cargo>,
  ) {
    const cargoEntity = new Cargo();
    cargoEntity.name = cargoDto.name;
    cargoEntity.weight = cargoDto.weight;
    cargoEntity.dimension = cargoDto.dimension;

    const createdCargo = await cargoRepository.save(cargoEntity);

    return createdCargo;
  }

  private async createOrderAddress(
    orderAddressDto: OrderAddressDto,
    orderAddressRepository: Repository<OrderAddress>,
  ) {
    const orderAddressEntity = new OrderAddress();
    orderAddressEntity.address = orderAddressDto.address;
    orderAddressEntity.longitude = orderAddressDto.longitude;
    orderAddressEntity.latitude = orderAddressDto.latitude;

    const createdOrderAddress = orderAddressRepository.save(orderAddressEntity);

    return createdOrderAddress;
  }

  private parseDeliveryTime(numberDay: number) {
    const today = new Date();
    const deliveryTime = new Date(today.setDate(today.getDate() + numberDay));

    return deliveryTime;
  }

  async createdOrder(orderDto: OrderDto) {
    const createdOrder = await this.dataSource.transaction(async (manager) => {
      const orderRepository = manager.getRepository(Order);
      const deliveryTypeRepository = manager.getRepository(DeliveryType);
      const cargoRepository = manager.getRepository(Cargo);
      const orderAddressRepository = manager.getRepository(OrderAddress);

      const deliveryType = await this.getDeliveryTypeById(
        orderDto.delivery_type_id,
        deliveryTypeRepository,
      );

      const createdCargo = await this.createCargo(
        orderDto.cargo,
        cargoRepository,
      );

      const createdOrderAddress = await this.createOrderAddress(
        orderDto.order_address,
        orderAddressRepository,
      );

      const orderEntity = new Order();
      orderEntity.sender_name = orderDto.sender_name;
      orderEntity.sender_phone = orderDto.sender_phone;
      orderEntity.receiver_name = orderDto.receiver_name;
      orderEntity.receiver_phone = orderDto.receiver_phone;
      orderEntity.shipping_fee = orderDto.shipping_fee;
      orderEntity.note = orderDto.note;
      orderEntity.delivery_type = deliveryType;
      orderEntity.cargo = createdCargo;
      orderEntity.order_address = createdOrderAddress;
      orderEntity.delivery_time = this.parseDeliveryTime(
        deliveryType.delivery_days,
      );

      const createdOrder = await orderRepository.save(orderEntity);

      return createdOrder;
    });

    return createdOrder;
  }

  async getListOfOrder(filter: Status) {
    const page = 0;
    const limit = 10;
    const orderRepository = this.dataSource.manager.getRepository(Order);
    const [listOfOrders, count] = await orderRepository.findAndCount({
      where: {
        status: filter,
      },
      relations: ['order_address', 'cargo'],
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
      orders: listOfOrders,
    };
  }

  async getOrderById(id: number) {
    const orderRepository = this.dataSource.manager.getRepository(Order);

    const order = await orderRepository.findOne({
      where: { id: id },
      relations: ['order_address', 'cargo'],
    });

    if (!order) {
      throw new NotFoundException('The order id not found');
    }

    return order;
  }

  // async schedule(res) {
  //   const data = await this.getCoordinates();
  //   const coordinates = data.coordinates;
  //   // const coordinates = [
  //   //   [10.045162, 105.746857],
  //   //   [10.762622, 106.660172],
  //   //   [10.086128, 106.016997],
  //   //   [9.812741, 106.299291],
  //   // ];
  //   const num_vehicles = 4;
  //   const depot = 0;
  //   const weight = 100;
  //   const dimension = 50;
  //   const result = this.pythonService.getVehicleRouting(
  //     coordinates,
  //     num_vehicles,
  //     depot,
  //     weight,
  //     dimension,
  //     res,
  //   );

  //   return result;
  // }

  // async getCoordinates() {
  //   const today = new Date();
  //   const date = `${today.getFullYear()}-${
  //     today.getMonth() + 1
  //   }-${today.getDate()}`;

  //   const [orders, count] = await this.orderRepository.findAndCount({
  //     where: {
  //       delivery_time: Raw((alias) => `${alias} = :date`, {
  //         date: date,
  //       }),
  //     },
  //     relations: ['orderAddress'],
  //     order: {
  //       created_at: 'DESC',
  //     },
  //   });

  //   const coordinates = [];
  //   orders.map((item) => {
  //     coordinates.push([
  //       parseFloat(item.order_address.latitude),
  //       parseFloat(item.order_address.longitude),
  //     ]);
  //   });
  //   return { coordinates, count };
  // }

  // async deliverySchedule() {
  //   const media = this.httpService.get(
  //     'http://localhost:3000/api/v1/orders/schedule',
  //   );
  //   const response = media.pipe(
  //     map((res) => {
  //       return res.data;
  //     }),
  //   );
  //   const result = await lastValueFrom(response);

  //   const route = result[0];

  //   return { route };
  // }
}
