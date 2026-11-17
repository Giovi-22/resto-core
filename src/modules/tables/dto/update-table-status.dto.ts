import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { TableStatus } from '../entities/table.entity.js';

export class UpdateTableStatusDto {
  @ApiProperty({ enum: TableStatus, example: TableStatus.OCCUPIED })
  @IsNotEmpty({ message: 'El estado es requerido' })
  @IsEnum(TableStatus, { message: 'Estado de mesa inválido' })
  status: TableStatus;
}

