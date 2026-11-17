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
import { Product } from './product.entity.js';
import { Modifier } from './modifier.entity.js';

@Entity('modifier_groups')
export class ModifierGroup {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'Punto de Cocción' })
  @Column({ length: 100 })
  name: string;

  @ApiProperty({ example: true, default: false })
  @Column({ default: false })
  isRequired: boolean;

  @ApiProperty({ example: 0, default: 0 })
  @Column({ type: 'int', default: 0 })
  minSelections: number;

  @ApiProperty({ example: 1, default: 1 })
  @Column({ type: 'int', default: 1 })
  maxSelections: number;

  @ApiProperty()
  @Column()
  productId: string;

  @ManyToOne(() => Product, (product) => product.modifierGroups, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'productId' })
  product: Product;

  @OneToMany(() => Modifier, (modifier) => modifier.modifierGroup)
  modifiers: Modifier[];

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updatedAt: Date;
}

