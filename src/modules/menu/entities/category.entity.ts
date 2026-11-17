import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Restaurant } from '../../restaurants/entities/restaurant.entity.js';
import { Product } from './product.entity.js';

@Entity('categories')
export class Category {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'Parrilla y Carnes' })
  @Column({ length: 100 })
  name: string;

  @ApiProperty({ example: 'Cortes seleccionados a las brasas', required: false })
  @Column({ nullable: true, length: 255 })
  description: string | null;

  @ApiProperty({ example: 'https://images.example.com/cat-meat.jpg', required: false })
  @Column({ nullable: true })
  imageUrl: string | null;

  @ApiProperty({ example: 1, default: 0 })
  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @ApiProperty({ default: true })
  @Column({ default: true })
  isActive: boolean;

  @ApiProperty()
  @Column()
  restaurantId: string;

  @ManyToOne(() => Restaurant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'restaurantId' })
  restaurant: Restaurant;

  @OneToMany(() => Product, (product) => product.category)
  products: Product[];

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updatedAt: Date;
}

