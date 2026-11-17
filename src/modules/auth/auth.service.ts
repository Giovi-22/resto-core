import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';
import { JwtPayload } from './strategies/jwt.strategy.js';
import { ConflictDomainError, UnauthorizedError } from '../../common/errors/index.js';
import { AppLoggerService, LogEvent } from '../../common/logger/index.js';

export interface AuthResponse {
  accessToken: string;
  user: Omit<User, 'password' | 'hashPassword' | 'validatePassword'>;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    private jwtService: JwtService,
    private readonly logger: AppLoggerService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponse> {
    const existing = await this.userRepository.findOne({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictDomainError('Ya existe un usuario con ese email', LogEvent.AUTH);
    }

    const user = this.userRepository.create({
      email:     dto.email,
      password:  dto.password,
      firstName: dto.firstName,
      lastName:  dto.lastName,
    });

    await this.userRepository.save(user);
    this.logger.log(`Usuario registrado: ${user.email}`, LogEvent.AUTH, AuthService.name);

    return this.buildAuthResponse(user);
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const user = await this.userRepository.findOne({
      where: { email: dto.email, isActive: true },
    });

    if (!user || !(await user.validatePassword(dto.password))) {
      throw new UnauthorizedError('Credenciales inválidas');
    }

    await this.userRepository.update(user.id, { lastLogin: new Date() });
    this.logger.log(`Login exitoso: ${user.email}`, LogEvent.AUTH, AuthService.name);

    return this.buildAuthResponse(user);
  }

  private buildAuthResponse(user: User): AuthResponse {
    const payload: JwtPayload = {
      sub:          user.id,
      email:        user.email,
      role:         user.role,
      restaurantId: user.restaurantId,
    };

    const { password: _pw, ...safeUser } = user;

    return {
      accessToken: this.jwtService.sign(payload),
      user: safeUser as Omit<User, 'password' | 'hashPassword' | 'validatePassword'>,
    };
  }
}
