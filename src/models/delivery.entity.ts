import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToOne,
} from 'typeorm';
import { Order } from './order.entity';
import { Shipper } from './shipper.entity';

@Entity()
export class Delivery {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'date' })
  date: Date;

  @Column({ type: 'float' })
  distance: number;

  @Column({ type: 'float' })
  weight: number;

  @Column({ type: 'float' })
  dimension: number;

  @CreateDateColumn({
    type: 'timestamp',
  })
  created_at: Date;

  @UpdateDateColumn({
    type: 'timestamp',
  })
  updated_at: Date;

  @ManyToOne(() => Shipper, (shipper) => shipper.delivery, {
    nullable: false,
  })
  @JoinColumn({
    name: 'shipper_id',
    foreignKeyConstraintName: 'fk-deliveries-shipper',
  })
  shippers: Shipper;

  @OneToOne(() => Order, (order) => order.delivery, {
    nullable: false,
  })
  @JoinColumn({
    name: 'order_id',
    foreignKeyConstraintName: 'fk-delivery-orders',
  })
  order: Order;
}
