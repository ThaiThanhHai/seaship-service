import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Delivery } from './delivery.entity';
import { Vehicle } from './vehicle.entity';

export enum Status {
  ACTIVE = 'on',
  NONACTIVE = 'off',
}

@Entity()
export class Shipper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  name: string;

  @Column({ type: 'integer' })
  age: number;

  @Column({ length: 255 })
  phone: string;

  @Column({ length: 255 })
  email: string;

  @Column({
    type: 'enum',
    enum: Status,
    default: Status.ACTIVE,
  })
  status: Status;

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

  @OneToMany(() => Delivery, (delivery) => delivery.shippers)
  delivery: Delivery[];

  @OneToOne(() => Vehicle, (vehicle) => vehicle.shipper)
  @JoinColumn({
    name: 'vehicle_id',
    foreignKeyConstraintName: 'fk-shipper-vehicle',
  })
  vehicle: Vehicle;
}
