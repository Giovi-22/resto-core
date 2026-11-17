import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MenuController } from './menu.controller.js';
import { CategoriesService } from './services/categories.service.js';
import { ProductsService } from './services/products.service.js';
import { ModifiersService } from './services/modifiers.service.js';
import { Category } from './entities/category.entity.js';
import { Product } from './entities/product.entity.js';
import { ModifierGroup } from './entities/modifier-group.entity.js';
import { Modifier } from './entities/modifier.entity.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Category, Product, ModifierGroup, Modifier]),
  ],
  controllers: [MenuController],
  providers: [CategoriesService, ProductsService, ModifiersService],
  exports: [CategoriesService, ProductsService, ModifiersService, TypeOrmModule],
})
export class MenuModule {}

