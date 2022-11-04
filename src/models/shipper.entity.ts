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
import { Schedule } from './schedule.entity';
import { Vehicle } from './vehicle.entity';

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

  @OneToMany(() => Schedule, (schedule) => schedule.shippers)
  schedule: Schedule[];

  @OneToOne(() => Vehicle, (vehicle) => vehicle.shipper)
  @JoinColumn({
    name: 'vehicle_id',
    foreignKeyConstraintName: 'fk-shipper-vehicle',
  })
  vehicle: Vehicle;
}
