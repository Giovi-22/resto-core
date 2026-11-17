import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateTableDto {
  @ApiProperty({ example: 1, description: 'Número de mesa' })
  @IsInt({ message: 'El número de mesa debe ser un entero' })
  @Min(1, { message: 'El número de mesa debe ser mayor a 0' })
  @IsNotEmpty({ message: 'El número de mesa es requerido' })
  number: number;

  @ApiPropertyOptional({ example: 'Mesa Esquina Ventanal' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ example: 4, default: 4 })
  @IsOptional()
  @IsInt()
  @Min(1)
  capacity?: number;

  @ApiPropertyOptional({ example: 'b6e828d0-23a5-48b0-aef2-bc322ecf69ec' })
  @IsOptional()
  @IsUUID('4', { message: 'zoneId debe ser un UUID válido' })
  zoneId?: string;
}

