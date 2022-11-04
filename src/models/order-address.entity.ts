import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
} from 'typeorm';
import { Order } from './order.entity';

@Entity()
export class OrderAddress {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  address: string;

  @Column({ length: 255 })
  longitude: string;

  @Column({ length: 255 })
  latitude: string;

  @CreateDateColumn({
    type: 'timestamp',
  })
  created_at: Date;

  @UpdateDateColumn({
    type: 'timestamp',
  })
  updated_at: Date;

  @OneToOne(() => Order, (order) => order.order_address)
  order: Order;
}
