import { Controller, Get, Res, Post, Body, Param } from '@nestjs/common';
import { Query } from '@nestjs/common/decorators';
import { OrderService } from 'src/services/order.service';
import { OrderDto } from '../controllers/dto/order.dto';

@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Get()
  public getOrders(@Query() query) {
    return this.orderService.getOrders(query);
  }

  @Get(':id')
  getOrderById(@Param('id') id: string) {
    return this.orderService.getOrderById(parseInt(id));
  }

  @Post('')
  createOrder(@Body() orderDto: OrderDto) {
    console.log(orderDto);
    return this.orderService.createOrder(orderDto);
  }

  @Get('schedule')
  deliverySchedule(@Res() res) {
    return this.orderService.deliverySchedule(res);
  }
}
