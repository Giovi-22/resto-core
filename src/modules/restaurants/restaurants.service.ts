import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Restaurant } from './entities/restaurant.entity.js';
import { CreateRestaurantDto } from './dto/create-restaurant.dto.js';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto.js';
import { ResourceNotFoundError, ConflictDomainError } from '../../common/errors/index.js';
import { AppLoggerService, LogEvent } from '../../common/logger/index.js';

@Injectable()
export class RestaurantsService {
  constructor(
    @InjectRepository(Restaurant)
    private restaurantRepository: Repository<Restaurant>,
    private readonly logger: AppLoggerService,
  ) {}

  private slugify(name: string): string {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  async create(dto: CreateRestaurantDto): Promise<Restaurant> {
    const slug = dto.slug ?? this.slugify(dto.name);

    const existing = await this.restaurantRepository.findOne({ where: { slug } });
    if (existing) {
      throw new ConflictDomainError(
        `Ya existe un restaurante con el slug "${slug}"`,
        LogEvent.RESTAURANT,
      );
    }

    const restaurant = this.restaurantRepository.create({ ...dto, slug });
    const saved = await this.restaurantRepository.save(restaurant);

    this.logger.log(`Restaurante creado: ${saved.slug}`, LogEvent.RESTAURANT, RestaurantsService.name);
    return saved;
  }

  async findAll(): Promise<Restaurant[]> {
    return this.restaurantRepository.find({
      where: { isActive: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Restaurant> {
    const restaurant = await this.restaurantRepository.findOne({ where: { id } });

    if (!restaurant) {
      throw new ResourceNotFoundError(
        `Restaurante con id "${id}" no encontrado`,
        LogEvent.RESTAURANT,
      );
    }

    return restaurant;
  }

  async findBySlug(slug: string): Promise<Restaurant> {
    const restaurant = await this.restaurantRepository.findOne({
      where: { slug, isActive: true },
    });

    if (!restaurant) {
      throw new ResourceNotFoundError(
        `Restaurante "${slug}" no encontrado`,
        LogEvent.RESTAURANT,
      );
    }

    return restaurant;
  }

  async update(id: string, dto: UpdateRestaurantDto): Promise<Restaurant> {
    const restaurant = await this.findOne(id);

    if (dto.slug && dto.slug !== restaurant.slug) {
      const existing = await this.restaurantRepository.findOne({ where: { slug: dto.slug } });
      if (existing) {
        throw new ConflictDomainError(
          `El slug "${dto.slug}" ya está en uso`,
          LogEvent.RESTAURANT,
        );
      }
    }

    Object.assign(restaurant, dto);
    const saved = await this.restaurantRepository.save(restaurant);

    this.logger.log(`Restaurante actualizado: ${saved.slug}`, LogEvent.RESTAURANT, RestaurantsService.name);
    return saved;
  }

  async remove(id: string): Promise<void> {
    const restaurant = await this.findOne(id);
    restaurant.isActive = false;
    await this.restaurantRepository.save(restaurant);
    this.logger.log(`Restaurante desactivado: ${restaurant.slug}`, LogEvent.RESTAURANT, RestaurantsService.name);
  }
}
