import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
} from 'typeorm';
import { Order } from './order.entity';

export enum Status {
  NEW = 'new',
  DELIVERING = 'delivering',
  FINISHED = 'finished',
  ERROR = 'error',
}

@Entity()
export class Cargo {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  name: string;

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

  @OneToOne(() => Order, (order) => order.cargo)
  order: Order;
}
