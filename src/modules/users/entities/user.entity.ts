import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import * as bcrypt from 'bcryptjs';
import { Restaurant } from '../../restaurants/entities/restaurant.entity.js';

export enum UserRole {
  OWNER = 'OWNER',
  MANAGER = 'MANAGER',
  WAITER = 'WAITER',
  CASHIER = 'CASHIER',
  KITCHEN = 'KITCHEN',
}

@Entity('users')
export class User {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  @Column({ unique: true, length: 150 })
  email: string;

  @Exclude()
  @Column()
  password: string;

  @ApiProperty()
  @Column({ length: 50 })
  firstName: string;

  @ApiProperty()
  @Column({ length: 50 })
  lastName: string;

  @ApiProperty({ enum: UserRole })
  @Column({ type: 'enum', enum: UserRole, default: UserRole.WAITER })
  role: UserRole;

  @ApiProperty()
  @Column({ nullable: true })
  restaurantId: string | null;

  @ManyToOne(() => Restaurant, (restaurant) => restaurant.users, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'restaurantId' })
  restaurant: Restaurant | null;

  @ApiProperty()
  @Column({ default: true })
  isActive: boolean;

  @ApiProperty({ required: false })
  @Column({ nullable: true, type: 'timestamptz' })
  lastLogin: Date | null;

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updatedAt: Date;

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    if (this.password && !this.password.startsWith('$2')) {
      this.password = await bcrypt.hash(this.password, 12);
    }
  }

  async validatePassword(plainPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, this.password);
  }

  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }
}

