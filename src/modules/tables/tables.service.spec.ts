import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TablesService } from './tables.service.js';
import { Table, TableStatus } from './entities/table.entity.js';
import { Zone } from '../zones/entities/zone.entity.js';
import {
  ResourceNotFoundError,
  ConflictDomainError,
  UnprocessableError,
} from '../../common/errors/index.js';
import { AppLoggerService } from '../../common/logger/index.js';

const mockTableRepository = {
  find: vi.fn(),
  findOne: vi.fn(),
  create: vi.fn(),
  save: vi.fn(),
  remove: vi.fn(),
};

const mockZoneRepository = {
  findOne: vi.fn(),
};

const mockLogger = {
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
  verbose: vi.fn(),
};

const buildMockTable = (overrides: Partial<Table> = {}): Table => {
  const t = new Table();
  t.id = 'table-uuid-1';
  t.number = 1;
  t.name = 'Mesa 1';
  t.capacity = 4;
  t.status = TableStatus.AVAILABLE;
  t.zoneId = 'zone-uuid-1';
  t.restaurantId = 'rest-uuid-1';
  t.createdAt = new Date();
  t.updatedAt = new Date();
  return Object.assign(t, overrides);
};

describe('TablesService', () => {
  let service: TablesService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new TablesService(
      mockTableRepository as never,
      mockZoneRepository as never,
      mockLogger as unknown as AppLoggerService,
    );
  });

  describe('findAll()', () => {
    it('debe listar todas las mesas del restaurante', async () => {
      const tables = [buildMockTable()];
      mockTableRepository.find.mockResolvedValue(tables);

      const result = await service.findAll('rest-uuid-1');

      expect(result).toEqual(tables);
      expect(mockTableRepository.find).toHaveBeenCalledWith({
        where: { restaurantId: 'rest-uuid-1' },
        order: { number: 'ASC' },
        relations: { zone: true },
      });
    });

    it('debe filtrar mesas por zoneId si se especifica', async () => {
      const tables = [buildMockTable()];
      mockTableRepository.find.mockResolvedValue(tables);

      await service.findAll('rest-uuid-1', 'zone-uuid-1');

      expect(mockTableRepository.find).toHaveBeenCalledWith({
        where: { restaurantId: 'rest-uuid-1', zoneId: 'zone-uuid-1' },
        order: { number: 'ASC' },
        relations: { zone: true },
      });
    });
  });

  describe('findOne()', () => {
    it('debe retornar la mesa si existe', async () => {
      const table = buildMockTable();
      mockTableRepository.findOne.mockResolvedValue(table);

      const result = await service.findOne('table-uuid-1', 'rest-uuid-1');
      expect(result.id).toBe('table-uuid-1');
    });

    it('debe lanzar ResourceNotFoundError si no existe en el restaurante', async () => {
      mockTableRepository.findOne.mockResolvedValue(null);

      await expect(
        service.findOne('table-uuid-1', 'rest-uuid-1'),
      ).rejects.toThrow(ResourceNotFoundError);
    });
  });

  describe('create()', () => {
    it('debe crear una mesa exitosamente', async () => {
      mockTableRepository.findOne.mockResolvedValue(null);
      const table = buildMockTable();
      mockTableRepository.create.mockReturnValue(table);
      mockTableRepository.save.mockResolvedValue(table);

      const result = await service.create('rest-uuid-1', {
        number: 1,
        capacity: 4,
      });

      expect(result.number).toBe(1);
      expect(mockTableRepository.save).toHaveBeenCalledOnce();
    });

    it('debe lanzar ConflictDomainError si el número de mesa ya existe', async () => {
      mockTableRepository.findOne.mockResolvedValue(buildMockTable());

      await expect(
        service.create('rest-uuid-1', { number: 1 }),
      ).rejects.toThrow(ConflictDomainError);
    });

    it('debe lanzar ResourceNotFoundError si la zona indicada no existe', async () => {
      mockTableRepository.findOne.mockResolvedValue(null);
      mockZoneRepository.findOne.mockResolvedValue(null);

      await expect(
        service.create('rest-uuid-1', { number: 1, zoneId: 'zone-inexistente' }),
      ).rejects.toThrow(ResourceNotFoundError);
    });
  });

  describe('updateStatus()', () => {
    it('debe actualizar el estado de la mesa', async () => {
      const table = buildMockTable();
      mockTableRepository.findOne.mockResolvedValue(table);
      mockTableRepository.save.mockResolvedValue({
        ...table,
        status: TableStatus.OCCUPIED,
      });

      const result = await service.updateStatus(
        'table-uuid-1',
        'rest-uuid-1',
        TableStatus.OCCUPIED,
      );

      expect(result.status).toBe(TableStatus.OCCUPIED);
      expect(mockTableRepository.save).toHaveBeenCalled();
    });
  });

  describe('remove()', () => {
    it('debe eliminar la mesa si está disponible', async () => {
      const table = buildMockTable({ status: TableStatus.AVAILABLE });
      mockTableRepository.findOne.mockResolvedValue(table);
      mockTableRepository.remove.mockResolvedValue(table);

      await service.remove('table-uuid-1', 'rest-uuid-1');

      expect(mockTableRepository.remove).toHaveBeenCalledWith(table);
    });

    it('debe lanzar UnprocessableError si la mesa está ocupada', async () => {
      const table = buildMockTable({ status: TableStatus.OCCUPIED });
      mockTableRepository.findOne.mockResolvedValue(table);

      await expect(
        service.remove('table-uuid-1', 'rest-uuid-1'),
      ).rejects.toThrow(UnprocessableError);
    });
  });
});
