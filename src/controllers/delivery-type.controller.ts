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
  getDeliveryTypes() {
    return this.deliveryTypeService.getDeliveryTypes();
  }

  @Get(':id')
  getDeliveryTypeById(@Param('id') id: string) {
    return this.deliveryTypeService.getDeliveryTypeById(parseInt(id));
  }
}
