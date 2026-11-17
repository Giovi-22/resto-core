import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UsersService } from './users.service.js';
import { User, UserRole } from './entities/user.entity.js';
import {
  ResourceNotFoundError,
  ConflictDomainError,
} from '../../common/errors/index.js';
import { AppLoggerService } from '../../common/logger/index.js';

const mockUserRepository = {
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

const buildMockUser = (overrides: Partial<User> = {}): User => {
  const u = new User();
  u.id = 'user-uuid-1';
  u.email = 'carlos@restaurant.com';
  u.password = '$2b$12$hashedpassword';
  u.firstName = 'Carlos';
  u.lastName = 'López';
  u.role = UserRole.WAITER;
  u.restaurantId = 'rest-uuid-1';
  u.isActive = true;
  u.lastLogin = null;
  u.createdAt = new Date();
  u.updatedAt = new Date();
  return Object.assign(u, overrides);
};

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new UsersService(
      mockUserRepository as never,
      mockLogger as unknown as AppLoggerService,
    );
  });

  describe('findAll()', () => {
    it('debe listar usuarios activos filtrados por restaurante', async () => {
      const users = [buildMockUser()];
      mockUserRepository.find.mockResolvedValue(users);

      const result = await service.findAll('rest-uuid-1');

      expect(result).toEqual(users);
      expect(mockUserRepository.find).toHaveBeenCalledWith({
        where: { isActive: true, restaurantId: 'rest-uuid-1' },
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('findOne()', () => {
    it('debe retornar el usuario si existe', async () => {
      const user = buildMockUser();
      mockUserRepository.findOne.mockResolvedValue(user);

      const result = await service.findOne('user-uuid-1');
      expect(result.id).toBe('user-uuid-1');
    });

    it('debe lanzar ResourceNotFoundError si no existe', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('inexistente')).rejects.toThrow(
        ResourceNotFoundError,
      );
    });
  });

  describe('create()', () => {
    it('debe crear un usuario exitosamente', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);
      const user = buildMockUser();
      mockUserRepository.create.mockReturnValue(user);
      mockUserRepository.save.mockResolvedValue(user);

      const result = await service.create({
        email: 'carlos@restaurant.com',
        password: 'Password123!',
        firstName: 'Carlos',
        lastName: 'López',
        role: UserRole.WAITER,
        restaurantId: 'rest-uuid-1',
      });

      expect(result.email).toBe('carlos@restaurant.com');
      expect(mockUserRepository.save).toHaveBeenCalledOnce();
    });

    it('debe lanzar ConflictDomainError si el email ya existe', async () => {
      mockUserRepository.findOne.mockResolvedValue(buildMockUser());

      await expect(
        service.create({
          email: 'carlos@restaurant.com',
          password: 'Password123!',
          firstName: 'Carlos',
          lastName: 'López',
        }),
      ).rejects.toThrow(ConflictDomainError);
    });
  });

  describe('update()', () => {
    it('debe actualizar los datos del usuario', async () => {
      const user = buildMockUser();
      mockUserRepository.findOne.mockResolvedValue(user);
      mockUserRepository.save.mockResolvedValue({
        ...user,
        firstName: 'Carlos Alberto',
      });

      const result = await service.update('user-uuid-1', {
        firstName: 'Carlos Alberto',
      });

      expect(result.firstName).toBe('Carlos Alberto');
      expect(mockUserRepository.save).toHaveBeenCalled();
    });
  });

  describe('assignToRestaurant()', () => {
    it('debe asignar el usuario a un nuevo restaurante', async () => {
      const user = buildMockUser({ restaurantId: null });
      mockUserRepository.findOne.mockResolvedValue(user);
      mockUserRepository.save.mockResolvedValue({
        ...user,
        restaurantId: 'rest-uuid-99',
      });

      const result = await service.assignToRestaurant(
        'user-uuid-1',
        'rest-uuid-99',
      );

      expect(result.restaurantId).toBe('rest-uuid-99');
      expect(mockUserRepository.save).toHaveBeenCalled();
    });
  });

  describe('remove()', () => {
    it('debe realizar soft delete desactivando el usuario', async () => {
      const user = buildMockUser();
      mockUserRepository.findOne.mockResolvedValue(user);
      mockUserRepository.save.mockResolvedValue({ ...user, isActive: false });

      await service.remove('user-uuid-1');

      expect(mockUserRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ isActive: false }),
      );
    });
  });
});

