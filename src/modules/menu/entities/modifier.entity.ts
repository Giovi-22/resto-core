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
import { ModifierGroup } from './modifier-group.entity.js';

@Entity('modifiers')
export class Modifier {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'Bien Cocido' })
  @Column({ length: 100 })
  name: string;

  @ApiProperty({
    example: 0,
    description: 'Ajuste de precio adicional al producto (puede ser 0)',
    default: 0,
  })
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  priceAdjustment: number;

  @ApiProperty({ default: true })
  @Column({ default: true })
  isAvailable: boolean;

  @ApiProperty()
  @Column()
  modifierGroupId: string;

  @ManyToOne(() => ModifierGroup, (group) => group.modifiers, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'modifierGroupId' })
  modifierGroup: ModifierGroup;

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updatedAt: Date;
}

