import { ShipperDto } from './dto/shipper.dto';
import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Query,
  Delete,
} from '@nestjs/common';
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
  getListOfDeliveryType(@Query('filter') filter: Status[]) {
    return this.shipperService.getListOfShipper(filter);
  }

  @Get(':id')
  getDeliveryTypeById(@Param('id') id: string) {
    return this.shipperService.getShipperById(parseInt(id));
  }

  @Delete(':id')
  deleteShipper(@Param('id') id: string) {
    return this.shipperService.deleteShipper(parseInt(id));
  }
}
