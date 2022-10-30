import { OrderDto } from './order.dto';
export interface OrderListDto {
  page: number;
  limit: number;
  total: number;
  orders: Array<OrderDto>;
}
