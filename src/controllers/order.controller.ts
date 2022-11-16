import { Controller, Get, Post, Body, Param, Query, Put } from '@nestjs/common';
import { Status } from 'src/models/order.entity';
import { OrderService } from 'src/services/order.service';
import { OrderDto } from '../controllers/dto/order.dto';

@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}
  @Post()
  createOrder(@Body() orderDto: OrderDto) {
    return this.orderService.createdOrder(orderDto);
  }
  @Get()
  public getListOfOrder(@Query('filter') filter: Status[]) {
    return this.orderService.getListOfOrder(filter);
  }
  @Get(':id')
  getOrderById(@Param('id') id: string) {
    return this.orderService.getOrderById(parseInt(id));
  }

  @Put()
  deleteDeliveryType(@Body('ids') ids: Array<number>) {
    return this.orderService.deleteOrder(ids);
  }
}
