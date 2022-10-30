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

  @Column({ type: 'integer' })
  deliveryDays: number;

  @CreateDateColumn({
    type: 'timestamp',
  })
  createdAt: Date;

  @UpdateDateColumn({
    type: 'timestamp',
  })
  updatedAt: Date;

  @OneToMany(() => Order, (order) => order.deliveryType)
  orders: Order[];
}
