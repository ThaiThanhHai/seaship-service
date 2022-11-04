import { ShipperDto } from './dto/shipper.dto';
import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { ShipperService } from 'src/services/shipper.service';

@Controller('shippers')
export class ShipperController {
  constructor(private readonly shipperService: ShipperService) {}

  @Post('')
  createShipper(@Body() shipperDto: ShipperDto) {
    return this.shipperService.createShipper(shipperDto);
  }

  @Get()
  getListOfDeliveryType() {
    return this.shipperService.getListOfShipper();
  }

  @Get(':id')
  getDeliveryTypeById(@Param('id') id: string) {
    return this.shipperService.getShipperById(parseInt(id));
  }
}
