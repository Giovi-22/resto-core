import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty } from 'class-validator';

export class UpdateProductAvailabilityDto {
  @ApiProperty({ example: false, description: 'Disponibilidad del producto en el menú' })
  @IsNotEmpty({ message: 'isAvailable es requerido' })
  @IsBoolean()
  isAvailable: boolean;
}

