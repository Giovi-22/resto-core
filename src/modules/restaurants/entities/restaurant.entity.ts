import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../users/entities/user.entity.js';

@Entity('restaurants')
export class Restaurant {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  @Column({ length: 100 })
  name: string;

  @ApiProperty({ description: 'URL-friendly unique identifier' })
  @Column({ unique: true, length: 100 })
  slug: string;

  @ApiProperty({ required: false })
  @Column({ nullable: true, length: 255 })
  address: string | null;

  @ApiProperty({ required: false })
  @Column({ nullable: true, length: 20 })
  phone: string | null;

  @ApiProperty({ required: false })
  @Column({ nullable: true })
  logoUrl: string | null;

  @ApiProperty()
  @Column({ default: 'America/Argentina/Buenos_Aires' })
  timezone: string;

  @ApiProperty()
  @Column({ default: 'ARS' })
  currency: string;

  @ApiProperty({ description: 'Tax rate as decimal, e.g. 0.21 for 21%' })
  @Column({ type: 'decimal', precision: 5, scale: 4, default: 0 })
  taxRate: number;

  @ApiProperty()
  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => User, (user) => user.restaurant)
  users: User[];

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updatedAt: Date;
}

