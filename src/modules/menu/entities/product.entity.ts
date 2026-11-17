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
import { Category } from './category.entity.js';
import { ModifierGroup } from './modifier-group.entity.js';

@Entity('products')
export class Product {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'Sándwich de Milanesa Completo' })
  @Column({ length: 100 })
  name: string;

  @ApiProperty({
    example: 'Pan artesanal, milanesa de ternera, lechuga, tomate, jamón y queso',
    required: false,
  })
  @Column({ nullable: true, type: 'text' })
  description: string | null;

  @ApiProperty({ example: 4500.0 })
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @ApiProperty({
    example: 1525.0,
    description: 'Costo calculado de la receta (suma de insumos)',
    default: 0,
  })
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  cost: number;

  @ApiProperty({ example: 'https://images.example.com/mila.jpg', required: false })
  @Column({ nullable: true })
  imageUrl: string | null;

  @ApiProperty({ example: 15, description: 'Tiempo de cocción en minutos', required: false })
  @Column({ type: 'int', nullable: true })
  preparationTime: number | null;

  @ApiProperty({ default: true })
  @Column({ default: true })
  isAvailable: boolean;

  @ApiProperty()
  @Column()
  categoryId: string;

  @ManyToOne(() => Category, (category) => category.products, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'categoryId' })
  category: Category;

  @ApiProperty()
  @Column()
  restaurantId: string;

  @ManyToOne(() => Restaurant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'restaurantId' })
  restaurant: Restaurant;

  @OneToMany(() => ModifierGroup, (group) => group.product)
  modifierGroups: ModifierGroup[];

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updatedAt: Date;
}

