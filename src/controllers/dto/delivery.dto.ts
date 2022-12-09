import { Status } from 'src/models/order.entity';

export interface DeliveryDto {
  list_order: Array<number>;
  list_shipper: Array<number>;
}

export interface DeliveryStatusDto {
  status: Status;
  failure_reason?: string;
}
