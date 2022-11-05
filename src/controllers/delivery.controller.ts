import { Controller, Post, Body, Get } from '@nestjs/common';
import { DeliveryService } from 'src/services/delivery.service';
import { DeliveryDto } from './dto/delivery.dto';

@Controller('deliveries')
export class DeliveryController {
  constructor(private readonly deliveryService: DeliveryService) {}

  @Post()
  public deliverySchedule(@Body() deliveryDto: DeliveryDto) {
    return this.deliveryService.deliverySchedule(deliveryDto);
  }

  @Get()
  getListOfDelivery() {
    return this.deliveryService.getListOfDelivery();
  }
}
