import { ShipperDto } from './dto/shipper.dto';
import { Controller, Post, Body, Get, Param, Query, Put } from '@nestjs/common';
import { ShipperService } from 'src/services/shipper.service';
import { Status } from 'src/models/shipper.entity';

@Controller('shippers')
export class ShipperController {
  constructor(private readonly shipperService: ShipperService) {}

  @Post('')
  createShipper(@Body() shipperDto: ShipperDto) {
    return this.shipperService.createShipper(shipperDto);
  }

  @Get()
  getListOfShipper(@Query('filter') filter: Status[]) {
    return this.shipperService.getListOfShipper(filter);
  }

  @Get(':id')
  getDeliveryTypeById(@Param('id') id: string) {
    return this.shipperService.getShipperById(parseInt(id));
  }

  @Put()
  deleteShipper(@Body('ids') ids: Array<number>) {
    return this.shipperService.deleteShipper(ids);
  }
}
