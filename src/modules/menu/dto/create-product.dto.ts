import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateProductDto {
  @ApiProperty({ example: 'Sándwich de Milanesa' })
  @IsString()
  @IsNotEmpty({ message: 'El nombre del producto es requerido' })
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ example: 'Pan francés, lechuga, tomate y mayonesa' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 4500.0 })
  @IsNumber({}, { message: 'El precio debe ser un número válido' })
  @IsPositive({ message: 'El precio debe ser mayor a 0' })
  price: number;

  @ApiPropertyOptional({ example: 'https://images.example.com/mila.jpg' })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({ example: 15, description: 'Minutos de preparación' })
  @IsOptional()
  @IsInt()
  @Min(1)
  preparationTime?: number;

  @ApiProperty({ example: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d' })
  @IsUUID('4', { message: 'categoryId debe ser un UUID válido' })
  @IsNotEmpty({ message: 'La categoría es requerida' })
  categoryId: string;
}

