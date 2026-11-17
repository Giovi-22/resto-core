import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProductsService } from './products.service.js';
import { Product } from '../entities/product.entity.js';
import { Category } from '../entities/category.entity.js';
import { ResourceNotFoundError } from '../../../common/errors/index.js';
import { AppLoggerService } from '../../../common/logger/index.js';

const mockProductRepository = {
  find: vi.fn(),
  findOne: vi.fn(),
  create: vi.fn(),
  save: vi.fn(),
};

const mockCategoryRepository = {
  findOne: vi.fn(),
};

const mockLogger = {
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
  verbose: vi.fn(),
};

const buildMockProduct = (overrides: Partial<Product> = {}): Product => {
  const p = new Product();
  p.id = 'prod-uuid-1';
  p.name = 'Sándwich de Milanesa';
  p.description = 'Clásico con lechuga y tomate';
  p.price = 4500.0;
  p.cost = 1500.0;
  p.imageUrl = null;
  p.preparationTime = 15;
  p.isAvailable = true;
  p.categoryId = 'cat-uuid-1';
  p.restaurantId = 'rest-uuid-1';
  p.modifierGroups = [];
  p.createdAt = new Date();
  p.updatedAt = new Date();
  return Object.assign(p, overrides);
};

describe('ProductsService', () => {
  let service: ProductsService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new ProductsService(
      mockProductRepository as never,
      mockCategoryRepository as never,
      mockLogger as unknown as AppLoggerService,
    );
  });

  describe('findAll()', () => {
    it('debe listar productos del restaurante con filtros', async () => {
      const products = [buildMockProduct()];
      mockProductRepository.find.mockResolvedValue(products);

      const result = await service.findAll('rest-uuid-1', 'cat-uuid-1', true);

      expect(result).toEqual(products);
      expect(mockProductRepository.find).toHaveBeenCalledWith({
        where: {
          restaurantId: 'rest-uuid-1',
          categoryId: 'cat-uuid-1',
          isAvailable: true,
        },
        order: { name: 'ASC' },
        relations: {
          category: true,
          modifierGroups: {
            modifiers: true,
          },
        },
      });
    });
  });

  describe('findOne()', () => {
    it('debe retornar el producto si existe', async () => {
      const product = buildMockProduct();
      mockProductRepository.findOne.mockResolvedValue(product);

      const result = await service.findOne('prod-uuid-1', 'rest-uuid-1');
      expect(result.id).toBe('prod-uuid-1');
    });

    it('debe lanzar ResourceNotFoundError si el producto no existe', async () => {
      mockProductRepository.findOne.mockResolvedValue(null);

      await expect(
        service.findOne('prod-uuid-1', 'rest-uuid-1'),
      ).rejects.toThrow(ResourceNotFoundError);
    });
  });

  describe('create()', () => {
    it('debe crear un producto exitosamente', async () => {
      const category = new Category();
      category.id = 'cat-uuid-1';
      category.restaurantId = 'rest-uuid-1';
      mockCategoryRepository.findOne.mockResolvedValue(category);

      const product = buildMockProduct();
      mockProductRepository.create.mockReturnValue(product);
      mockProductRepository.save.mockResolvedValue(product);

      const result = await service.create('rest-uuid-1', {
        name: 'Sándwich de Milanesa',
        price: 4500.0,
        categoryId: 'cat-uuid-1',
      });

      expect(result.name).toBe('Sándwich de Milanesa');
      expect(mockProductRepository.save).toHaveBeenCalledOnce();
    });

    it('debe lanzar ResourceNotFoundError si la categoría no existe', async () => {
      mockCategoryRepository.findOne.mockResolvedValue(null);

      await expect(
        service.create('rest-uuid-1', {
          name: 'Sándwich de Milanesa',
          price: 4500.0,
          categoryId: 'cat-inexistente',
        }),
      ).rejects.toThrow(ResourceNotFoundError);
    });
  });

  describe('updateAvailability()', () => {
    it('debe cambiar la disponibilidad del producto', async () => {
      const product = buildMockProduct({ isAvailable: true });
      mockProductRepository.findOne.mockResolvedValue(product);
      mockProductRepository.save.mockResolvedValue({
        ...product,
        isAvailable: false,
      });

      const result = await service.updateAvailability(
        'prod-uuid-1',
        'rest-uuid-1',
        false,
      );

      expect(result.isAvailable).toBe(false);
      expect(mockProductRepository.save).toHaveBeenCalled();
    });
  });

  describe('remove()', () => {
    it('debe desactivar el producto mediante soft delete', async () => {
      const product = buildMockProduct({ isAvailable: true });
      mockProductRepository.findOne.mockResolvedValue(product);
      mockProductRepository.save.mockResolvedValue({
        ...product,
        isAvailable: false,
      });

      await service.remove('prod-uuid-1', 'rest-uuid-1');

      expect(mockProductRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ isAvailable: false }),
      );
    });
  });
});
