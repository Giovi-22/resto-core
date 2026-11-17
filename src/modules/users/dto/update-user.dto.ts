import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { UserRole } from '../entities/user.entity.js';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'Carlos' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  firstName?: string;

  @ApiPropertyOptional({ example: 'López' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  lastName?: string;

  @ApiPropertyOptional({ enum: UserRole })
  @IsOptional()
  @IsEnum(UserRole, { message: 'Rol inválido' })
  role?: UserRole;

  @ApiPropertyOptional({ example: 'd3b07384-d113-4a11-b062-81498b31a59f' })
  @IsOptional()
  @IsUUID('4', { message: 'restaurantId debe ser un UUID válido' })
  restaurantId?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

