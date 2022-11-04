import { Controller, Get, Post, Body, Param } from '@nestjs/common';
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
  public getListOfOrder() {
    return this.orderService.getListOfOrder();
  }
  @Get(':id')
  getOrderById(@Param('id') id: string) {
    return this.orderService.getOrderById(parseInt(id));
  }
}
