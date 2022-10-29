import { Injectable, Inject, Res } from '@nestjs/common';
import { Repository } from 'typeorm';
import { PythonService } from './python.service';
import { Order } from '../models/entities/order.entity';
import { Order as OrderDto } from '../controllers/dto/order.dto';

@Injectable()
export class OrderService {
  constructor(
    private readonly pythonService: PythonService,
    @Inject('ORDER_REPOSITORY')
    private orderRepository: Repository<Order>,
  ) {}

  createOrder(order: OrderDto) {
    return order;
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
