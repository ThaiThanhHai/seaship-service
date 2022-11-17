import {
  Controller,
  Post,
  Body,
  Get,
  Delete,
  Param,
  Put,
} from '@nestjs/common';
import { DeliveryService } from 'src/services/delivery.service';
import { DeliveryDto, DeliveryStatusDto } from './dto/delivery.dto';

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
  @Get('order_of_shipper/:shipper_id')
  getListOrderOfShipper(@Param('shipper_id') shipper_id: string) {
    return this.deliveryService.getListOrderOfShipper(shipper_id);
  }

  @Get('shipper/:shipper_id')
  getDeliveryForShipper(@Param('shipper_id') shipper_id: string) {
    return this.deliveryService.getDeliveryForShipper(shipper_id);
  }

  @Get('order/:order_id')
  getOrderDetailForShipper(@Param('order_id') order_id: string) {
    return this.deliveryService.getOrderDetailForShipper(order_id);
  }

  @Put('order/:order_id')
  updateStatusDelivery(
    @Param('order_id') order_id: string,
    @Body() deliveryStatusDto: DeliveryStatusDto,
  ) {
    return this.deliveryService.updateStatusDelivery(
      order_id,
      deliveryStatusDto,
    );
  }

  @Delete(':id')
  deleteDelivery(@Param('id') id: string) {
    return this.deliveryService.deleteDelivery(parseInt(id));
  }
}
