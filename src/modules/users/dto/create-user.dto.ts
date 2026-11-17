import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';
import { UserRole } from '../entities/user.entity.js';

export class CreateUserDto {
  @ApiProperty({ example: 'waiter@restaurant.com' })
  @IsEmail({}, { message: 'Email inválido' })
  email: string;

  @ApiProperty({ example: 'SecurePass123!', minLength: 8 })
  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  password: string;

  @ApiProperty({ example: 'Carlos' })
  @IsString()
  @MaxLength(50)
  firstName: string;

  @ApiProperty({ example: 'López' })
  @IsString()
  @MaxLength(50)
  lastName: string;

  @ApiPropertyOptional({ enum: UserRole, default: UserRole.WAITER })
  @IsOptional()
  @IsEnum(UserRole, { message: 'Rol inválido' })
  role?: UserRole;

  @ApiPropertyOptional({ example: 'd3b07384-d113-4a11-b062-81498b31a59f' })
  @IsOptional()
  @IsUUID('4', { message: 'restaurantId debe ser un UUID válido' })
  restaurantId?: string;
}

