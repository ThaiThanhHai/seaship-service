import { Controller, Get, Post, Body, Param, Query, Put } from '@nestjs/common';
import { Status } from 'src/models/order.entity';
import { OrderService } from 'src/services/order.service';
import { OrderDto } from '../controllers/dto/order.dto';
import { Base64Str } from './dto/base64.dto';

@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}
  @Post()
  createOrder(@Body() orderDto: OrderDto) {
    return this.orderService.createdOrder(orderDto);
  }

  @Post('file_excel')
  createOrderByFileExcel(@Body() base64Str: Base64Str) {
    return this.orderService.createOrderByFileExcel(base64Str);
  }

  @Get()
  public getListOfOrder(@Query('filter') filter: Status[]) {
    return this.orderService.getListOfOrder(filter);
  }

  @Get('truck')
  public getListOfOrderForTruck(@Query('filter') filter: Status[]) {
    return this.orderService.getListOfOrderForTruck(filter);
  }

  @Get('motorbike')
  public getListOfOrderForMotorBike(@Query('filter') filter: Status[]) {
    return this.orderService.getListOfOrderForMotorBike(filter);
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
