import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateZoneDto {
  @ApiProperty({ example: 'Salón Principal' })
  @IsString()
  @IsNotEmpty({ message: 'El nombre de la zona es obligatorio' })
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ example: 'Sector interno planta baja' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;
}

