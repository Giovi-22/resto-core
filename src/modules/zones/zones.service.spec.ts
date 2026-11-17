import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ZonesService } from './zones.service.js';
import { Zone } from './entities/zone.entity.js';
import { ResourceNotFoundError } from '../../common/errors/index.js';
import { AppLoggerService } from '../../common/logger/index.js';

const mockZoneRepository = {
  find: vi.fn(),
  findOne: vi.fn(),
  create: vi.fn(),
  save: vi.fn(),
};

const mockLogger = {
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
  verbose: vi.fn(),
};

const buildMockZone = (overrides: Partial<Zone> = {}): Zone => {
  const z = new Zone();
  z.id = 'zone-uuid-1';
  z.name = 'Terraza';
  z.description = 'Al aire libre';
  z.restaurantId = 'rest-uuid-1';
  z.isActive = true;
  z.tables = [];
  z.createdAt = new Date();
  z.updatedAt = new Date();
  return Object.assign(z, overrides);
};

describe('ZonesService', () => {
  let service: ZonesService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new ZonesService(
      mockZoneRepository as never,
      mockLogger as unknown as AppLoggerService,
    );
  });

  describe('findAll()', () => {
    it('debe listar todas las zonas activas del restaurante', async () => {
      const zones = [buildMockZone()];
      mockZoneRepository.find.mockResolvedValue(zones);

      const result = await service.findAll('rest-uuid-1');

      expect(result).toEqual(zones);
      expect(mockZoneRepository.find).toHaveBeenCalledWith({
        where: { restaurantId: 'rest-uuid-1', isActive: true },
        order: { name: 'ASC' },
        relations: { tables: true },
      });
    });
  });

  describe('findOne()', () => {
    it('debe retornar la zona si existe en el restaurante', async () => {
      const zone = buildMockZone();
      mockZoneRepository.findOne.mockResolvedValue(zone);

      const result = await service.findOne('zone-uuid-1', 'rest-uuid-1');
      expect(result.id).toBe('zone-uuid-1');
    });

    it('debe lanzar ResourceNotFoundError si no existe en el restaurante', async () => {
      mockZoneRepository.findOne.mockResolvedValue(null);

      await expect(
        service.findOne('zone-uuid-1', 'rest-uuid-1'),
      ).rejects.toThrow(ResourceNotFoundError);
    });
  });

  describe('create()', () => {
    it('debe crear una nueva zona', async () => {
      const zone = buildMockZone();
      mockZoneRepository.create.mockReturnValue(zone);
      mockZoneRepository.save.mockResolvedValue(zone);

      const result = await service.create('rest-uuid-1', {
        name: 'Terraza',
        description: 'Al aire libre',
      });

      expect(result.name).toBe('Terraza');
      expect(mockZoneRepository.save).toHaveBeenCalledOnce();
    });
  });

  describe('update()', () => {
    it('debe actualizar una zona', async () => {
      const zone = buildMockZone();
      mockZoneRepository.findOne.mockResolvedValue(zone);
      mockZoneRepository.save.mockResolvedValue({
        ...zone,
        name: 'Terraza VIP',
      });

      const result = await service.update('zone-uuid-1', 'rest-uuid-1', {
        name: 'Terraza VIP',
      });

      expect(result.name).toBe('Terraza VIP');
      expect(mockZoneRepository.save).toHaveBeenCalled();
    });
  });

  describe('remove()', () => {
    it('debe desactivar la zona con soft delete', async () => {
      const zone = buildMockZone();
      mockZoneRepository.findOne.mockResolvedValue(zone);
      mockZoneRepository.save.mockResolvedValue({ ...zone, isActive: false });

      await service.remove('zone-uuid-1', 'rest-uuid-1');

      expect(mockZoneRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ isActive: false }),
      );
    });
  });
});
