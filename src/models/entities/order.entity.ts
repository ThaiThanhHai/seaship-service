import { OrderAddress } from './order-address.entity';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToOne,
} from 'typeorm';
import { DeliveryType } from './delivery-type.entity';

@Entity()
export class Order {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  orderName: string;

  @Column({ length: 255 })
  senderName: string;

  @Column({ length: 255 })
  senderPhone: string;

  @Column({ length: 255 })
  receiverName: string;

  @Column({ length: 255 })
  receiverPhone: string;

  @Column({ type: 'float' })
  weight: number;

  @Column({ type: 'float' })
  dimension: number;

  @Column({ type: 'datetime' })
  deliveryTime: Date;

  @CreateDateColumn({
    type: 'timestamp',
  })
  createdAt: Date;

  @UpdateDateColumn({
    type: 'timestamp',
  })
  updatedAt: Date;

  @OneToOne(() => OrderAddress, (orderAddress) => orderAddress.order, {
    nullable: false,
  })
  @JoinColumn({
    name: 'orderAddressId',
    foreignKeyConstraintName: 'fk-order-order_address',
  })
  orderAddress: OrderAddress;

  @ManyToOne(() => DeliveryType, (deliveryType) => deliveryType.orders, {
    nullable: false,
  })
  @JoinColumn({
    name: 'deliveryTypeId',
    foreignKeyConstraintName: 'fk-orders-delivery_type',
  })
  deliveryType: DeliveryType;
}
