import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Order } from './order.entity';
import { Shipper } from './shipper.entity';

@Entity()
export class Schedule {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'date' })
  date: Date;

  @CreateDateColumn({
    type: 'timestamp',
  })
  created_at: Date;

  @UpdateDateColumn({
    type: 'timestamp',
  })
  updated_at: Date;

  @ManyToOne(() => Shipper, (shipper) => shipper.schedule, {
    nullable: false,
  })
  @JoinColumn({
    name: 'shipper_id',
    foreignKeyConstraintName: 'fk-schedules-shipper',
  })
  shippers: Shipper;

  @ManyToOne(() => Order, (order) => order.schedule, {
    nullable: false,
  })
  @JoinColumn({
    name: 'order_id',
    foreignKeyConstraintName: 'fk-schedules-orders',
  })
  orders: Shipper;
}
