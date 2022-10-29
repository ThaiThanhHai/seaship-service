import { Controller, Get, Res, Post, Body } from '@nestjs/common';
import { OrderService } from 'src/services/order.service';
import { Order as OrderDto } from '../controllers/dto/order.dto';

@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post('')
  createOrder(@Body() orderDto: OrderDto) {
    return this.orderService.createOrder(orderDto);
  }

  @Get('schedule')
  deliverySchedule(@Res() res) {
    return this.orderService.deliverySchedule(res);
  }
}
