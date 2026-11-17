import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RestaurantsService } from './restaurants.service.js';
import { Restaurant } from './entities/restaurant.entity.js';
import { ResourceNotFoundError, ConflictDomainError } from '../../common/errors/index.js';
import { AppLoggerService } from '../../common/logger/index.js';

const mockRestaurantRepository = {
  findOne: vi.fn(),
  find:    vi.fn(),
  create:  vi.fn(),
  save:    vi.fn(),
};

const mockLogger = {
  log:     vi.fn(),
  warn:    vi.fn(),
  error:   vi.fn(),
  debug:   vi.fn(),
  verbose: vi.fn(),
};

const buildMockRestaurant = (overrides: Partial<Restaurant> = {}): Restaurant => {
  const r      = new Restaurant();
  r.id         = 'rest-uuid-1';
  r.name       = 'La Trattoria';
  r.slug       = 'la-trattoria';
  r.address    = 'Av. Corrientes 1234';
  r.phone      = '+54 11 1234-5678';
  r.logoUrl    = null;
  r.timezone   = 'America/Argentina/Buenos_Aires';
  r.currency   = 'ARS';
  r.taxRate    = 0.21;
  r.isActive   = true;
  r.users      = [];
  r.createdAt  = new Date();
  r.updatedAt  = new Date();
  return Object.assign(r, overrides);
};

describe('RestaurantsService', () => {
  let service: RestaurantsService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new RestaurantsService(
      mockRestaurantRepository as never,
      mockLogger as unknown as AppLoggerService,
    );
  });

  describe('create()', () => {
    it('debe crear un restaurante con slug auto-generado', async () => {
      mockRestaurantRepository.findOne.mockResolvedValue(null);
      const restaurant = buildMockRestaurant();
      mockRestaurantRepository.create.mockReturnValue(restaurant);
      mockRestaurantRepository.save.mockResolvedValue(restaurant);

      const result = await service.create({ name: 'La Trattoria' });

      expect(result.slug).toBe('la-trattoria');
      expect(mockRestaurantRepository.save).toHaveBeenCalledOnce();
    });

    it('debe usar el slug provisto si se envía', async () => {
      mockRestaurantRepository.findOne.mockResolvedValue(null);
      const restaurant = buildMockRestaurant({ slug: 'mi-slug-custom' });
      mockRestaurantRepository.create.mockReturnValue(restaurant);
      mockRestaurantRepository.save.mockResolvedValue(restaurant);

      const result = await service.create({ name: 'La Trattoria', slug: 'mi-slug-custom' });

      expect(result.slug).toBe('mi-slug-custom');
    });

    it('debe lanzar ConflictDomainError si el slug ya existe', async () => {
      mockRestaurantRepository.findOne.mockResolvedValue(buildMockRestaurant());

      await expect(service.create({ name: 'La Trattoria' })).rejects.toThrow(ConflictDomainError);
    });
  });

  describe('findOne()', () => {
    it('debe retornar el restaurante si existe', async () => {
      const restaurant = buildMockRestaurant();
      mockRestaurantRepository.findOne.mockResolvedValue(restaurant);

      const result = await service.findOne('rest-uuid-1');
      expect(result.id).toBe('rest-uuid-1');
    });

    it('debe lanzar ResourceNotFoundError si no existe', async () => {
      mockRestaurantRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('no-existe')).rejects.toThrow(ResourceNotFoundError);
    });
  });

  describe('remove()', () => {
    it('debe hacer soft delete (isActive = false)', async () => {
      const restaurant = buildMockRestaurant();
      mockRestaurantRepository.findOne.mockResolvedValue(restaurant);
      mockRestaurantRepository.save.mockResolvedValue({ ...restaurant, isActive: false });

      await service.remove('rest-uuid-1');

      expect(mockRestaurantRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ isActive: false }),
      );
    });
  });
});
