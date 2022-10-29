import { OrderAddressService } from './../services/order-address.service';
import { Controller } from '@nestjs/common';

@Controller('order-address')
export class OrderAddressController {
  constructor(private readonly orderAddressService: OrderAddressService) {}
}
