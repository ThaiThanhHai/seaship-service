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
  priceInner: number;

  @Column({ type: 'float' })
  priceOuter: number;

  @Column({ type: 'float' })
  overpriced: number;

  @Column({ type: 'float' })
  deliveryHours: number;

  @CreateDateColumn({
    type: 'timestamp',
  })
  created_at: Date;

  @UpdateDateColumn({
    type: 'timestamp',
  })
  updated_at: Date;

  @OneToMany(() => Order, (order) => order.deliveryType)
  orders: Order[];
}
