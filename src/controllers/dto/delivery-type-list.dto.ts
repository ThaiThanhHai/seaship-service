import { DeliveryTypeDto } from './delivery-type.dto';
export interface DeliveryTypeListDto {
  page: number;
  limit: number;
  total: number;
  delivery_types: Array<DeliveryTypeDto>;
}
