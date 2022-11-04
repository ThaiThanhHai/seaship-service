import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { DeliveryTypeDto } from './dto/delivery-type.dto';
import { DeliveryTypeService } from '../services/delivery-type.service';

@Controller('delivery-type')
export class DeliveryTypeController {
  constructor(private readonly deliveryTypeService: DeliveryTypeService) {}

  @Post('')
  createDeliveryType(@Body() deliveryTypeDto: DeliveryTypeDto) {
    return this.deliveryTypeService.createDeliveryType(deliveryTypeDto);
  }

  @Get('')
  getListOfDeliveryType() {
    return this.deliveryTypeService.getListOfDeliveryType();
  }

  @Get(':id')
  getDeliveryTypeById(@Param('id') id: string) {
    return this.deliveryTypeService.getDeliveryTypeById(parseInt(id));
  }
}
