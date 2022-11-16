import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Order } from './order.entity';
import { Supervisor } from './supervisor.entity';

@Entity()
export class DeliveryType {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  name: string;

  @Column({ type: 'float' })
  price_inner: number;

  @Column({ type: 'float' })
  price_outer: number;

  @Column({ type: 'float' })
  overpriced: number;

  @Column({ type: 'integer' })
  delivery_days: number;

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

  @OneToMany(() => Order, (order) => order.delivery_type)
  orders: Order[];

  @ManyToOne(() => Supervisor, (supervisor) => supervisor.deliveryType, {
    nullable: false,
  })
  @JoinColumn({
    name: 'supervisor_id',
  })
  supervisor: Supervisor;
}
