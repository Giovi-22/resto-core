import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { CategoriesService } from './services/categories.service.js';
import { ProductsService } from './services/products.service.js';
import { ModifiersService } from './services/modifiers.service.js';
import { CreateCategoryDto } from './dto/create-category.dto.js';
import { UpdateCategoryDto } from './dto/update-category.dto.js';
import { CreateProductDto } from './dto/create-product.dto.js';
import { UpdateProductDto } from './dto/update-product.dto.js';
import { UpdateProductAvailabilityDto } from './dto/update-product-availability.dto.js';
import { CreateModifierGroupDto } from './dto/create-modifier-group.dto.js';
import { UpdateModifierGroupDto } from './dto/update-modifier-group.dto.js';
import { CreateModifierDto } from './dto/create-modifier.dto.js';
import { UpdateModifierDto } from './dto/update-modifier.dto.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { UserRole } from '../users/entities/user.entity.js';

@ApiTags('Menu')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('restaurants/:restaurantId')
export class MenuController {
  constructor(
    private readonly categoriesService: CategoriesService,
    private readonly productsService: ProductsService,
    private readonly modifiersService: ModifiersService,
  ) {}

  // ─── Categorías ───────────────────────────────────────────────

  @Post('categories')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Crear una categoría de menú' })
  @ApiResponse({ status: 201, description: 'Categoría creada' })
  createCategory(
    @Param('restaurantId', ParseUUIDPipe) restaurantId: string,
    @Body() dto: CreateCategoryDto,
  ) {
    return this.categoriesService.create(restaurantId, dto);
  }

  @Get('categories')
  @ApiOperation({ summary: 'Listar todas las categorías activas' })
  findAllCategories(@Param('restaurantId', ParseUUIDPipe) restaurantId: string) {
    return this.categoriesService.findAll(restaurantId);
  }

  @Get('categories/:id')
  @ApiOperation({ summary: 'Obtener detalle de una categoría' })
  findOneCategory(
    @Param('restaurantId', ParseUUIDPipe) restaurantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.categoriesService.findOne(id, restaurantId);
  }

  @Patch('categories/:id')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Actualizar una categoría' })
  updateCategory(
    @Param('restaurantId', ParseUUIDPipe) restaurantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(id, restaurantId, dto);
  }

  @Delete('categories/:id')
  @Roles(UserRole.OWNER)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Desactivar una categoría (solo si no tiene productos activos)' })
  removeCategory(
    @Param('restaurantId', ParseUUIDPipe) restaurantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.categoriesService.remove(id, restaurantId);
  }

  // ─── Productos ────────────────────────────────────────────────

  @Post('products')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Crear un producto en el menú' })
  @ApiResponse({ status: 201, description: 'Producto creado' })
  createProduct(
    @Param('restaurantId', ParseUUIDPipe) restaurantId: string,
    @Body() dto: CreateProductDto,
  ) {
    return this.productsService.create(restaurantId, dto);
  }

  @Get('products')
  @ApiOperation({ summary: 'Listar productos con filtros' })
  @ApiQuery({ name: 'categoryId', required: false })
  @ApiQuery({ name: 'isAvailable', required: false, type: Boolean })
  findAllProducts(
    @Param('restaurantId', ParseUUIDPipe) restaurantId: string,
    @Query('categoryId') categoryId?: string,
    @Query('isAvailable') isAvailable?: string,
  ) {
    const isAvail = isAvailable !== undefined ? isAvailable === 'true' : undefined;
    return this.productsService.findAll(restaurantId, categoryId, isAvail);
  }

  @Get('products/:id')
  @ApiOperation({ summary: 'Obtener detalle de un producto' })
  findOneProduct(
    @Param('restaurantId', ParseUUIDPipe) restaurantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.productsService.findOne(id, restaurantId);
  }

  @Patch('products/:id')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Actualizar datos de un producto' })
  updateProduct(
    @Param('restaurantId', ParseUUIDPipe) restaurantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.productsService.update(id, restaurantId, dto);
  }

  @Patch('products/:id/availability')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.KITCHEN)
  @ApiOperation({ summary: 'Cambiar disponibilidad de un producto (Faltante / Disponible)' })
  updateProductAvailability(
    @Param('restaurantId', ParseUUIDPipe) restaurantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProductAvailabilityDto,
  ) {
    return this.productsService.updateAvailability(id, restaurantId, dto.isAvailable);
  }

  @Delete('products/:id')
  @Roles(UserRole.OWNER)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Desactivar un producto' })
  removeProduct(
    @Param('restaurantId', ParseUUIDPipe) restaurantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.productsService.remove(id, restaurantId);
  }

  // ─── Modificadores ────────────────────────────────────────────

  @Post('products/:productId/modifier-groups')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Crear un grupo de modificadores para un producto' })
  createModifierGroup(
    @Param('restaurantId', ParseUUIDPipe) restaurantId: string,
    @Param('productId', ParseUUIDPipe) productId: string,
    @Body() dto: CreateModifierGroupDto,
  ) {
    return this.modifiersService.createGroup(productId, restaurantId, dto);
  }

  @Patch('modifier-groups/:groupId')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Actualizar un grupo de modificadores' })
  updateModifierGroup(
    @Param('restaurantId', ParseUUIDPipe) restaurantId: string,
    @Param('groupId', ParseUUIDPipe) groupId: string,
    @Body() dto: UpdateModifierGroupDto,
  ) {
    return this.modifiersService.updateGroup(groupId, restaurantId, dto);
  }

  @Delete('modifier-groups/:groupId')
  @Roles(UserRole.OWNER)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar un grupo de modificadores' })
  removeModifierGroup(
    @Param('restaurantId', ParseUUIDPipe) restaurantId: string,
    @Param('groupId', ParseUUIDPipe) groupId: string,
  ) {
    return this.modifiersService.removeGroup(groupId, restaurantId);
  }

  @Post('modifier-groups/:groupId/modifiers')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Crear un modificador/opción dentro de un grupo' })
  createModifier(
    @Param('restaurantId', ParseUUIDPipe) restaurantId: string,
    @Param('groupId', ParseUUIDPipe) groupId: string,
    @Body() dto: CreateModifierDto,
  ) {
    return this.modifiersService.createModifier(groupId, restaurantId, dto);
  }

  @Patch('modifiers/:modifierId')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Actualizar un modificador' })
  updateModifier(
    @Param('restaurantId', ParseUUIDPipe) restaurantId: string,
    @Param('modifierId', ParseUUIDPipe) modifierId: string,
    @Body() dto: UpdateModifierDto,
  ) {
    return this.modifiersService.updateModifier(modifierId, restaurantId, dto);
  }

  @Delete('modifiers/:modifierId')
  @Roles(UserRole.OWNER)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar un modificador' })
  removeModifier(
    @Param('restaurantId', ParseUUIDPipe) restaurantId: string,
    @Param('modifierId', ParseUUIDPipe) modifierId: string,
  ) {
    return this.modifiersService.removeModifier(modifierId, restaurantId);
  }
}

