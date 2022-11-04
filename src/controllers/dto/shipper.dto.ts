export interface VehicleDto {
  readonly id: number;
  capacity: number;
  dimension: number;
}

export interface ShipperDto {
  readonly id: number;
  name: string;
  age: number;
  phone: string;
  email: string;
  avatar: string;
  vehicle: VehicleDto;
}
