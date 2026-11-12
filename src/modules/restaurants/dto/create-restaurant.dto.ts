import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, MaxLength } from 'class-validator';

export class CreateRestaurantDto {
  @ApiProperty({ example: 'La Trattoria' })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 'la-trattoria', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  slug?: string;

  @ApiProperty({ example: 'Av. Corrientes 1234, CABA', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  address?: string;

  @ApiProperty({ example: '+54 11 1234-5678', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @ApiProperty({ example: 'America/Argentina/Buenos_Aires', required: false })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiProperty({ example: 'ARS', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(3)
  currency?: string;

  @ApiProperty({ example: 0.21, required: false, description: 'Tax rate as decimal' })
  @IsOptional()
  taxRate?: number;
}

