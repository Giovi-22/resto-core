import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../entities/category.entity.js';
import { Product } from '../entities/product.entity.js';
import { CreateCategoryDto } from '../dto/create-category.dto.js';
import { UpdateCategoryDto } from '../dto/update-category.dto.js';
import {
  ResourceNotFoundError,
  UnprocessableError,
} from '../../../common/errors/index.js';
import { AppLoggerService, LogEvent } from '../../../common/logger/index.js';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    private readonly logger: AppLoggerService,
  ) {}

  async findAll(restaurantId: string): Promise<Category[]> {
    return this.categoryRepository.find({
      where: { restaurantId, isActive: true },
      order: { sortOrder: 'ASC', name: 'ASC' },
      relations: { products: true },
    });
  }

  async findOne(id: string, restaurantId: string): Promise<Category> {
    const category = await this.categoryRepository.findOne({
      where: { id, restaurantId },
      relations: { products: true },
    });

    if (!category) {
      throw new ResourceNotFoundError(
        `Categoría con id "${id}" no encontrada en este restaurante`,
        LogEvent.RESTAURANT,
      );
    }

    return category;
  }

  async create(restaurantId: string, dto: CreateCategoryDto): Promise<Category> {
    const category = this.categoryRepository.create({
      ...dto,
      restaurantId,
    });

    const saved = await this.categoryRepository.save(category);
    this.logger.log(`Categoría creada: ${saved.name} (${saved.id})`, LogEvent.RESTAURANT, CategoriesService.name);
    return saved;
  }

  async update(id: string, restaurantId: string, dto: UpdateCategoryDto): Promise<Category> {
    const category = await this.findOne(id, restaurantId);

    Object.assign(category, dto);
    const updated = await this.categoryRepository.save(category);

    this.logger.log(`Categoría actualizada: ${updated.id}`, LogEvent.RESTAURANT, CategoriesService.name);
    return updated;
  }

  async remove(id: string, restaurantId: string): Promise<void> {
    const category = await this.findOne(id, restaurantId);

    const activeProducts = await this.productRepository.count({
      where: { categoryId: id, isAvailable: true },
    });

    if (activeProducts > 0) {
      throw new UnprocessableError(
        `No se puede eliminar la categoría "${category.name}" porque contiene ${activeProducts} producto(s) activo(s)`,
      );
    }

    category.isActive = false;
    await this.categoryRepository.save(category);

    this.logger.log(`Categoría desactivada: ${id}`, LogEvent.RESTAURANT, CategoriesService.name);
  }
}
