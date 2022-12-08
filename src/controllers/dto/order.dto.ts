export interface OrderAddressDto {
  readonly id: number;
  address: string;
  longitude: number;
  latitude: number;
}

export interface CargoDto {
  readonly id: number;
  name: string;
  weight: number;
  dimension: number;
}

export interface OrderDto {
  readonly id: number;
  sender_name: string;
  sender_phone: string;
  receiver_name: string;
  receiver_phone: string;
  shipping_fee: number;
  distance: number;
  note: string;
  delivery_type_id: number;
  supervisor_id: number;
  cargo: CargoDto;
  order_address: OrderAddressDto;
}
