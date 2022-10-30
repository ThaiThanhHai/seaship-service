import { OrderAddressDto } from './order-address.dto';

export interface OrderDto {
  readonly id: number;
  order_name: string;
  sender_name: string;
  sender_phone: string;
  receiver_name: string;
  receiver_phone: string;
  weight: number;
  dimension: number;
  delivery_time: Date;
  note: string;
  status: string;
  delivery_type_id: number;
  order_address: OrderAddressDto;
}
