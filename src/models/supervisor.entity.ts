import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  DeleteDateColumn,
} from 'typeorm';
import { DeliveryType } from './delivery-type.entity';
import { Order } from './order.entity';

@Entity()
export class Supervisor {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  name: string;

  @Column({ length: 255 })
  password: string;

  @Column({ length: 255 })
  phone: string;

  @Column({ length: 255, unique: true })
  email: string;

  @Column()
  avatar: string;

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

  @OneToMany(() => DeliveryType, (deliveryType) => deliveryType.supervisor)
  deliveryType: DeliveryType[];
  s;
  @OneToMany(() => Order, (order) => order.supervisor)
  order: Order[];
}
