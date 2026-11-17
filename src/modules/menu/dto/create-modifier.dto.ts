import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateModifierDto {
  @ApiProperty({ example: 'Cheddar extra' })
  @IsString()
  @IsNotEmpty({ message: 'El nombre del modificador es requerido' })
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ example: 450.0, default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  priceAdjustment?: number;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;
}

