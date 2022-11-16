import { OrderAddress } from './order-address.entity';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToOne,
  DeleteDateColumn,
} from 'typeorm';
import { DeliveryType } from './delivery-type.entity';
import { Delivery } from './delivery.entity';
import { Cargo } from './cargo.entity';
import { Supervisor } from './supervisor.entity';

export enum Status {
  NEW = 'new',
  DELIVERING = 'delivering',
  FINISHED = 'finished',
  ERROR = 'error',
}

@Entity()
export class Order {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  sender_name: string;

  @Column({ length: 255 })
  sender_phone: string;

  @Column({ length: 255 })
  receiver_name: string;

  @Column({ length: 255 })
  receiver_phone: string;

  @Column({ type: 'date' })
  delivery_time: Date;

  @Column({ type: 'float' })
  shipping_fee: number;

  @Column({ length: 255, nullable: true })
  note: string;

  @Column({
    type: 'enum',
    enum: Status,
    default: Status.NEW,
  })
  status: Status;

  @CreateDateColumn({
    type: 'timestamp',
  })
  created_at: Date;

  @UpdateDateColumn({
    type: 'timestamp',
  })
  updated_at: Date;

  @DeleteDateColumn({
    type: 'timestamp',
  })
  deleted_at: Date;

  @OneToOne(() => OrderAddress, (orderAddress) => orderAddress.order, {
    nullable: false,
  })
  @JoinColumn({
    name: 'order_address_id',
  })
  order_address: OrderAddress;

  @OneToOne(() => Cargo, (cargo) => cargo.order, {
    nullable: false,
  })
  @JoinColumn({
    name: 'cargo_id',
  })
  cargo: Cargo;

  @ManyToOne(() => DeliveryType, (deliveryType) => deliveryType.orders, {
    nullable: false,
  })
  @JoinColumn({
    name: 'delivery_type_id',
  })
  delivery_type: DeliveryType;

  @OneToOne(() => Delivery, (delivery) => delivery.order)
  delivery: Delivery;

  @ManyToOne(() => Supervisor, (supervisor) => supervisor.order, {
    nullable: false,
  })
  @JoinColumn({
    name: 'supervisor_id',
  })
  supervisor: Supervisor;
}
