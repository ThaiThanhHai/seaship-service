import { OrderAddress } from './order-address.dto';

export interface Order {
  readonly id: number;
  name: string;
  sender_name: string;
  sender_phone: string;
  reciever_name: string;
  reciever_phone: string;
  weight: number;
  dimension: number;
  delivery_time: string;
  time_deviation: string;
  order_address: OrderAddress;
}
