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

  @DeleteDateColumn({
    type: 'timestamp',
  })
  deleted_at: Date;

  @ManyToOne(() => Shipper, (shipper) => shipper.delivery, {
    nullable: false,
  })
  @JoinColumn({
    name: 'shipper_id',
  })
  shippers: Shipper;

  @OneToOne(() => Order, (order) => order.delivery, {
    nullable: false,
  })
  @JoinColumn({
    name: 'order_id',
  })
  order: Order;
}
