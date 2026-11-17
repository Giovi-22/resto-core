import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Restaurant } from '../../restaurants/entities/restaurant.entity.js';
import { Zone } from '../../zones/entities/zone.entity.js';

export enum TableStatus {
  AVAILABLE = 'AVAILABLE',
  OCCUPIED = 'OCCUPIED',
  RESERVED = 'RESERVED',
  CLEANING = 'CLEANING',
}

@Entity('tables')
export class Table {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 5, description: 'Número de mesa dentro del local' })
  @Column({ type: 'int' })
  number: number;

  @ApiProperty({ example: 'Mesa Redonda Principal', required: false })
  @Column({ nullable: true, length: 100 })
  name: string | null;

  @ApiProperty({ example: 4, default: 4 })
  @Column({ type: 'int', default: 4 })
  capacity: number;

  @ApiProperty({ enum: TableStatus, default: TableStatus.AVAILABLE })
  @Column({
    type: 'enum',
    enum: TableStatus,
    default: TableStatus.AVAILABLE,
  })
  status: TableStatus;

  @ApiProperty({ required: false })
  @Column({ nullable: true })
  zoneId: string | null;

  @ManyToOne(() => Zone, (zone) => zone.tables, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'zoneId' })
  zone: Zone | null;

  @ApiProperty()
  @Column()
  restaurantId: string;

  @ManyToOne(() => Restaurant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'restaurantId' })
  restaurant: Restaurant;

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updatedAt: Date;
}

