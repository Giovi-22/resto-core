import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Restaurant } from './entities/restaurant.entity.js';
import { CreateRestaurantDto } from './dto/create-restaurant.dto.js';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto.js';

@Injectable()
export class RestaurantsService {
  constructor(
    @InjectRepository(Restaurant)
    private restaurantRepository: Repository<Restaurant>,
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

    const existing = await this.restaurantRepository.findOne({
      where: { slug },
    });

    if (existing) {
      throw new ConflictException(`Ya existe un restaurante con el slug "${slug}"`);
    }

    const restaurant = this.restaurantRepository.create({
      ...dto,
      slug,
    });

    return this.restaurantRepository.save(restaurant);
  }

  async findAll(): Promise<Restaurant[]> {
    return this.restaurantRepository.find({
      where: { isActive: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Restaurant> {
    const restaurant = await this.restaurantRepository.findOne({
      where: { id },
    });

    if (!restaurant) {
      throw new NotFoundException(`Restaurante con id "${id}" no encontrado`);
    }

    return restaurant;
  }

  async findBySlug(slug: string): Promise<Restaurant> {
    const restaurant = await this.restaurantRepository.findOne({
      where: { slug, isActive: true },
    });

    if (!restaurant) {
      throw new NotFoundException(`Restaurante "${slug}" no encontrado`);
    }

    return restaurant;
  }

  async update(id: string, dto: UpdateRestaurantDto): Promise<Restaurant> {
    const restaurant = await this.findOne(id);

    if (dto.slug && dto.slug !== restaurant.slug) {
      const existing = await this.restaurantRepository.findOne({
        where: { slug: dto.slug },
      });
      if (existing) {
        throw new ConflictException(`El slug "${dto.slug}" ya está en uso`);
      }
    }

    Object.assign(restaurant, dto);
    return this.restaurantRepository.save(restaurant);
  }

  async remove(id: string): Promise<void> {
    const restaurant = await this.findOne(id);
    // Soft delete: desactivar en lugar de borrar
    restaurant.isActive = false;
    await this.restaurantRepository.save(restaurant);
  }
}

