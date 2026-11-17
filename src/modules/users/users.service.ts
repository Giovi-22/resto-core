import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { User } from './entities/user.entity.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import {
  ResourceNotFoundError,
  ConflictDomainError,
} from '../../common/errors/index.js';
import { AppLoggerService, LogEvent } from '../../common/logger/index.js';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly logger: AppLoggerService,
  ) {}

  async findAll(restaurantId?: string): Promise<User[]> {
    const where: FindOptionsWhere<User> = { isActive: true };
    if (restaurantId) {
      where.restaurantId = restaurantId;
    }

    return this.userRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: { restaurant: true },
    });

    if (!user) {
      throw new ResourceNotFoundError(
        `Usuario con id "${id}" no encontrado`,
        LogEvent.USER,
      );
    }

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email },
      relations: { restaurant: true },
    });
  }

  async create(dto: CreateUserDto): Promise<User> {
    const existing = await this.userRepository.findOne({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictDomainError(
        `Ya existe un usuario con el email "${dto.email}"`,
        LogEvent.USER,
      );
    }

    const user = this.userRepository.create(dto);
    const saved = await this.userRepository.save(user);

    this.logger.log(`Usuario creado: ${saved.email}`, LogEvent.USER, UsersService.name);
    return saved;
  }

  async update(id: string, dto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);

    Object.assign(user, dto);
    const updated = await this.userRepository.save(user);

    this.logger.log(`Usuario actualizado: ${updated.id}`, LogEvent.USER, UsersService.name);
    return updated;
  }

  async assignToRestaurant(userId: string, restaurantId: string): Promise<User> {
    const user = await this.findOne(userId);
    user.restaurantId = restaurantId;
    const updated = await this.userRepository.save(user);

    this.logger.log(
      `Usuario ${user.id} asignado al restaurante ${restaurantId}`,
      LogEvent.USER,
      UsersService.name,
    );
    return updated;
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    user.isActive = false;
    await this.userRepository.save(user);

    this.logger.log(`Usuario desactivado: ${id}`, LogEvent.USER, UsersService.name);
  }
}
