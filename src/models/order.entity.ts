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
  OneToMany,
} from 'typeorm';
import { DeliveryType } from './delivery-type.entity';
import { Schedule } from './schedule.entity';
import { Cargo } from './cargo.entity';

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

  @OneToOne(() => OrderAddress, (orderAddress) => orderAddress.order, {
    nullable: false,
  })
  @JoinColumn({
    name: 'order_address_id',
    foreignKeyConstraintName: 'fk-order-order_address',
  })
  order_address: OrderAddress;

  @OneToOne(() => Cargo, (cargo) => cargo.order, {
    nullable: false,
  })
  @JoinColumn({
    name: 'cargo_id',
    foreignKeyConstraintName: 'fk-order-cargo',
  })
  cargo: Cargo;

  @ManyToOne(() => DeliveryType, (deliveryType) => deliveryType.orders, {
    nullable: false,
  })
  @JoinColumn({
    name: 'delivery_type_id',
    foreignKeyConstraintName: 'fk-orders-delivery_type',
  })
  delivery_type: DeliveryType;

  @OneToMany(() => Schedule, (schedule) => schedule.shippers)
  schedule: Schedule[];
}
