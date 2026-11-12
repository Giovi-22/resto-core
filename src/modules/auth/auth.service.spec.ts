import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { JwtService } from '@nestjs/jwt';
import { User, UserRole } from '../users/entities/user.entity.js';

// ── Mock del repositorio de usuarios ──────────────────────────────
const mockUserRepository = {
  findOne: vi.fn(),
  create: vi.fn(),
  save: vi.fn(),
  update: vi.fn(),
};

const mockJwtService = {
  sign: vi.fn().mockReturnValue('mock-jwt-token'),
};

// ── Helper: usuario de prueba ──────────────────────────────────────
const buildMockUser = (overrides: Partial<User> = {}): User => {
  const user = new User();
  user.id = 'user-uuid-1';
  user.email = 'test@example.com';
  user.password = '$2b$12$hashedpassword';
  user.firstName = 'Juan';
  user.lastName = 'García';
  user.role = UserRole.OWNER;
  user.restaurantId = null;
  user.isActive = true;
  user.lastLogin = null;
  user.createdAt = new Date();
  user.updatedAt = new Date();
  user.validatePassword = vi.fn();
  return Object.assign(user, overrides);
};

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    vi.clearAllMocks();
    authService = new AuthService(
      mockUserRepository as never,
      mockJwtService as unknown as JwtService,
    );
  });

  // ── register ───────────────────────────────────────────────────
  describe('register()', () => {
    it('debe crear un usuario y retornar accessToken', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);
      const savedUser = buildMockUser();
      mockUserRepository.create.mockReturnValue(savedUser);
      mockUserRepository.save.mockResolvedValue(savedUser);

      const result = await authService.register({
        email: 'test@example.com',
        password: 'SecurePass123!',
        firstName: 'Juan',
        lastName: 'García',
      });

      expect(result.accessToken).toBe('mock-jwt-token');
      expect(result.user.email).toBe('test@example.com');
      expect(mockUserRepository.save).toHaveBeenCalledOnce();
    });

    it('debe lanzar ConflictException si el email ya existe', async () => {
      mockUserRepository.findOne.mockResolvedValue(buildMockUser());

      await expect(
        authService.register({
          email: 'test@example.com',
          password: 'SecurePass123!',
          firstName: 'Juan',
          lastName: 'García',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  // ── login ──────────────────────────────────────────────────────
  describe('login()', () => {
    it('debe retornar accessToken con credenciales válidas', async () => {
      const user = buildMockUser();
      (user.validatePassword as ReturnType<typeof vi.fn>).mockResolvedValue(true);
      mockUserRepository.findOne.mockResolvedValue(user);
      mockUserRepository.update.mockResolvedValue(undefined);

      const result = await authService.login({
        email: 'test@example.com',
        password: 'SecurePass123!',
      });

      expect(result.accessToken).toBe('mock-jwt-token');
      expect(mockUserRepository.update).toHaveBeenCalledWith(
        user.id,
        expect.objectContaining({ lastLogin: expect.any(Date) }),
      );
    });

    it('debe lanzar UnauthorizedException si el usuario no existe', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(
        authService.login({ email: 'no@existe.com', password: '123' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('debe lanzar UnauthorizedException si la contraseña es incorrecta', async () => {
      const user = buildMockUser();
      (user.validatePassword as ReturnType<typeof vi.fn>).mockResolvedValue(false);
      mockUserRepository.findOne.mockResolvedValue(user);

      await expect(
        authService.login({ email: 'test@example.com', password: 'wrong' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});

