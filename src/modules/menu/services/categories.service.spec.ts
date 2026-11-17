import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CategoriesService } from './categories.service.js';
import { Category } from '../entities/category.entity.js';
import {
  ResourceNotFoundError,
  UnprocessableError,
} from '../../../common/errors/index.js';
import { AppLoggerService } from '../../../common/logger/index.js';

const mockCategoryRepository = {
  find: vi.fn(),
  findOne: vi.fn(),
  create: vi.fn(),
  save: vi.fn(),
};

const mockProductRepository = {
  count: vi.fn(),
};

const mockLogger = {
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
  verbose: vi.fn(),
};

const buildMockCategory = (overrides: Partial<Category> = {}): Category => {
  const c = new Category();
  c.id = 'cat-uuid-1';
  c.name = 'Parrilla';
  c.description = 'Cortes a las brasas';
  c.imageUrl = null;
  c.sortOrder = 1;
  c.isActive = true;
  c.restaurantId = 'rest-uuid-1';
  c.products = [];
  c.createdAt = new Date();
  c.updatedAt = new Date();
  return Object.assign(c, overrides);
};

describe('CategoriesService', () => {
  let service: CategoriesService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new CategoriesService(
      mockCategoryRepository as never,
      mockProductRepository as never,
      mockLogger as unknown as AppLoggerService,
    );
  });

  describe('findAll()', () => {
    it('debe listar categorías activas ordenadas por sortOrder', async () => {
      const categories = [buildMockCategory()];
      mockCategoryRepository.find.mockResolvedValue(categories);

      const result = await service.findAll('rest-uuid-1');

      expect(result).toEqual(categories);
      expect(mockCategoryRepository.find).toHaveBeenCalledWith({
        where: { restaurantId: 'rest-uuid-1', isActive: true },
        order: { sortOrder: 'ASC', name: 'ASC' },
        relations: { products: true },
      });
    });
  });

  describe('findOne()', () => {
    it('debe retornar la categoría si existe', async () => {
      const category = buildMockCategory();
      mockCategoryRepository.findOne.mockResolvedValue(category);

      const result = await service.findOne('cat-uuid-1', 'rest-uuid-1');
      expect(result.id).toBe('cat-uuid-1');
    });

    it('debe lanzar ResourceNotFoundError si no existe en el restaurante', async () => {
      mockCategoryRepository.findOne.mockResolvedValue(null);

      await expect(
        service.findOne('cat-uuid-1', 'rest-uuid-1'),
      ).rejects.toThrow(ResourceNotFoundError);
    });
  });

  describe('create()', () => {
    it('debe crear una categoría exitosamente', async () => {
      const category = buildMockCategory();
      mockCategoryRepository.create.mockReturnValue(category);
      mockCategoryRepository.save.mockResolvedValue(category);

      const result = await service.create('rest-uuid-1', {
        name: 'Parrilla',
        sortOrder: 1,
      });

      expect(result.name).toBe('Parrilla');
      expect(mockCategoryRepository.save).toHaveBeenCalledOnce();
    });
  });

  describe('update()', () => {
    it('debe actualizar los datos de la categoría', async () => {
      const category = buildMockCategory();
      mockCategoryRepository.findOne.mockResolvedValue(category);
      mockCategoryRepository.save.mockResolvedValue({
        ...category,
        name: 'Parrilla Gourmet',
      });

      const result = await service.update('cat-uuid-1', 'rest-uuid-1', {
        name: 'Parrilla Gourmet',
      });

      expect(result.name).toBe('Parrilla Gourmet');
      expect(mockCategoryRepository.save).toHaveBeenCalled();
    });
  });

  describe('remove()', () => {
    it('debe desactivar la categoría si no tiene productos activos', async () => {
      const category = buildMockCategory();
      mockCategoryRepository.findOne.mockResolvedValue(category);
      mockProductRepository.count.mockResolvedValue(0);
      mockCategoryRepository.save.mockResolvedValue({ ...category, isActive: false });

      await service.remove('cat-uuid-1', 'rest-uuid-1');

      expect(mockCategoryRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ isActive: false }),
      );
    });

    it('debe lanzar UnprocessableError si contiene productos activos', async () => {
      const category = buildMockCategory();
      mockCategoryRepository.findOne.mockResolvedValue(category);
      mockProductRepository.count.mockResolvedValue(3);

      await expect(
        service.remove('cat-uuid-1', 'rest-uuid-1'),
      ).rejects.toThrow(UnprocessableError);
    });
  });
});
