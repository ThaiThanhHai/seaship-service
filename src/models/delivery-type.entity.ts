import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Order } from './order.entity';

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

  @OneToMany(() => Order, (order) => order.delivery_type)
  orders: Order[];
}
