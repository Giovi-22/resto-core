import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { Product } from '../entities/product.entity.js';
import { Category } from '../entities/category.entity.js';
import { CreateProductDto } from '../dto/create-product.dto.js';
import { UpdateProductDto } from '../dto/update-product.dto.js';
import { ResourceNotFoundError } from '../../../common/errors/index.js';
import { AppLoggerService, LogEvent } from '../../../common/logger/index.js';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    private readonly logger: AppLoggerService,
  ) {}

  async findAll(
    restaurantId: string,
    categoryId?: string,
    isAvailable?: boolean,
  ): Promise<Product[]> {
    const where: FindOptionsWhere<Product> = { restaurantId };
    if (categoryId) {
      where.categoryId = categoryId;
    }
    if (isAvailable !== undefined) {
      where.isAvailable = isAvailable;
    }

    return this.productRepository.find({
      where,
      order: { name: 'ASC' },
      relations: {
        category: true,
        modifierGroups: {
          modifiers: true,
        },
      },
    });
  }

  async findOne(id: string, restaurantId: string): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id, restaurantId },
      relations: {
        category: true,
        modifierGroups: {
          modifiers: true,
        },
      },
    });

    if (!product) {
      throw new ResourceNotFoundError(
        `Producto con id "${id}" no encontrado en este restaurante`,
        LogEvent.RESTAURANT,
      );
    }

    return product;
  }

  async create(restaurantId: string, dto: CreateProductDto): Promise<Product> {
    const category = await this.categoryRepository.findOne({
      where: { id: dto.categoryId, restaurantId, isActive: true },
    });

    if (!category) {
      throw new ResourceNotFoundError(
        `Categoría con id "${dto.categoryId}" no encontrada en este restaurante`,
        LogEvent.RESTAURANT,
      );
    }

    const product = this.productRepository.create({
      ...dto,
      restaurantId,
    });

    const saved = await this.productRepository.save(product);
    this.logger.log(`Producto creado: ${saved.name} (${saved.id})`, LogEvent.RESTAURANT, ProductsService.name);
    return saved;
  }

  async update(id: string, restaurantId: string, dto: UpdateProductDto): Promise<Product> {
    const product = await this.findOne(id, restaurantId);

    if (dto.categoryId && dto.categoryId !== product.categoryId) {
      const category = await this.categoryRepository.findOne({
        where: { id: dto.categoryId, restaurantId, isActive: true },
      });

      if (!category) {
        throw new ResourceNotFoundError(
          `Categoría con id "${dto.categoryId}" no encontrada en este restaurante`,
          LogEvent.RESTAURANT,
        );
      }
    }

    Object.assign(product, dto);
    const updated = await this.productRepository.save(product);

    this.logger.log(`Producto actualizado: ${updated.id}`, LogEvent.RESTAURANT, ProductsService.name);
    return updated;
  }

  async updateAvailability(
    id: string,
    restaurantId: string,
    isAvailable: boolean,
  ): Promise<Product> {
    const product = await this.findOne(id, restaurantId);
    product.isAvailable = isAvailable;
    const updated = await this.productRepository.save(product);

    this.logger.log(
      `Disponibilidad de producto "${product.name}" cambiada a ${isAvailable}`,
      LogEvent.RESTAURANT,
      ProductsService.name,
    );
    return updated;
  }

  async remove(id: string, restaurantId: string): Promise<void> {
    const product = await this.findOne(id, restaurantId);
    product.isAvailable = false;
    await this.productRepository.save(product);

    this.logger.log(`Producto desactivado: ${id}`, LogEvent.RESTAURANT, ProductsService.name);
  }
}
