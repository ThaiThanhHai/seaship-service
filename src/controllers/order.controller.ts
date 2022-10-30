import { Controller, Get, Res, Post, Body, Param } from '@nestjs/common';
import { Query } from '@nestjs/common/decorators';
import { OrderService } from 'src/services/order.service';
import { OrderDto } from '../controllers/dto/order.dto';

@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Get('')
  public getOrders(@Query() query) {
    return this.orderService.getOrders(query);
  }

  @Get('delivery-schedule')
  deliverySchedule() {
    return this.orderService.deliverySchedule();
  }

  @Get('schedule')
  schedule(@Res() res) {
    return this.orderService.schedule(res);
  }

  @Get(':id')
  getOrderById(@Param('id') id: string) {
    return this.orderService.getOrderById(parseInt(id));
  }

  @Post('')
  createOrder(@Body() orderDto: OrderDto) {
    return this.orderService.createOrder(orderDto);
  }
}
