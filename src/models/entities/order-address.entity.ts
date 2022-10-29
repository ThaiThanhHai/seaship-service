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

  @Column({ type: 'float' })
  shippingFee: number;

  @CreateDateColumn({
    type: 'timestamp',
  })
  createdAt: Date;

  @UpdateDateColumn({
    type: 'timestamp',
  })
  updatedAt: Date;

  @OneToOne(() => Order, (order) => order.orderAddress)
  order: Order;
}
