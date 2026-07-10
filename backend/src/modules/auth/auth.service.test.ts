import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock env variables before importing auth.service
vi.mock('../../config/env', () => ({
  env: {
    NODE_ENV: 'test',
    PORT: 3001,
    DATABASE_URL: 'postgresql://localhost:5432/test',
    REDIS_URL: 'redis://localhost:6379',
    GROQ_API_KEY: 'test_groq_api_key_for_testing_purposes',
    JWT_ACCESS_SECRET: 'test_access_secret_64chars_minimum_so_zod_does_not_fail_validation_schema',
    JWT_REFRESH_SECRET: 'test_refresh_secret_64chars_minimum_so_zod_does_not_fail_validation_schema',
    BCRYPT_ROUNDS: 12,
    CORS_ORIGIN: 'http://localhost:5173',
    ADMIN_SECRET: 'test_admin_secret_32chars_minimum_ok',
  },
}));

import { register, login } from './auth.service';
import { db } from '../../db/index';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

vi.mock('../../db/index', () => {
  const mockSelectLimit = vi.fn();
  const mockSelectWhere = vi.fn().mockReturnValue({
    limit: mockSelectLimit,
  });
  const mockSelectFrom = vi.fn().mockReturnValue({
    where: mockSelectWhere,
  });

  const mockInsertReturning = vi.fn();
  const mockInsertValues = vi.fn().mockReturnValue({
    returning: mockInsertReturning,
  });

  return {
    db: {
      select: vi.fn().mockReturnValue({
        from: mockSelectFrom,
      }),
      insert: vi.fn().mockReturnValue({
        values: mockInsertValues,
      }),
      update: vi.fn(),
    },
  };
});

vi.mock('bcrypt', () => ({
  default: {
    hash: vi.fn(),
    compare: vi.fn(),
  },
}));

vi.mock('jsonwebtoken', () => ({
  default: {
    sign: vi.fn(),
  },
}));

describe('auth.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('register', () => {
    it('should throw an error if the user already exists', async () => {
      // Setup mock select chain to return existing user
      const mockSelect = (db.select as any)();
      const mockFrom = mockSelect.from(null as any);
      const mockWhere = mockFrom.where(null as any);
      vi.mocked(mockWhere.limit).mockResolvedValue([{ id: '1', email: 'test@example.com' }]);

      await expect(
        register(
          {
            email: 'test@example.com',
            password: 'Password123!',
            name: 'Test User',
            city: 'Silchar',
            state: 'Assam',
          },
          '127.0.0.1',
          'Mozilla/5.0'
        )
      ).rejects.toThrow('An account with this email already exists');
    });

    it('should hash the password, insert the user, and return tokens', async () => {
      // Setup mock select to return no users
      const mockSelect = (db.select as any)();
      const mockFrom = mockSelect.from(null as any);
      const mockWhere = mockFrom.where(null as any);
      vi.mocked(mockWhere.limit).mockResolvedValue([]);

      // Mock password hashing
      vi.mocked(bcrypt.hash).mockResolvedValue('hashedPassword' as any);

      // Mock user insertion
      const mockInsert = vi.mocked(db.insert)(null as any);
      const mockValues = mockInsert.values(null as any);
      const newUser = {
        id: 'user_123',
        email: 'new@example.com',
        passwordHash: 'hashedPassword',
        name: 'New User',
        city: 'Silchar',
        state: 'Assam',
        skillTags: [],
        dailyIncomeGoal: 500,
        languagePref: 'en',
      };
      vi.mocked(mockValues.returning).mockResolvedValue([newUser]);

      // Mock JWT token signing
      vi.mocked(jwt.sign).mockReturnValue('token' as any);

      const result = await register(
        {
          email: 'new@example.com',
          password: 'Password123!',
          name: 'New User',
          city: 'Silchar',
          state: 'Assam',
        },
        '127.0.0.1',
        'Mozilla/5.0'
      );

      expect(bcrypt.hash).toHaveBeenCalledWith('Password123!', 12);
      expect(result.accessToken).toBe('token');
      expect(result.refreshToken).toBe('token');
      expect(result.user.id).toBe('user_123');
    });
  });

  describe('login', () => {
    it('should throw an error if the user is not found', async () => {
      const mockSelect = (db.select as any)();
      const mockFrom = mockSelect.from(null as any);
      const mockWhere = mockFrom.where(null as any);
      vi.mocked(mockWhere.limit).mockResolvedValue([]);

      await expect(
        login(
          {
            email: 'nonexistent@example.com',
            password: 'Password123!',
          },
          '127.0.0.1',
          'Mozilla/5.0'
        )
      ).rejects.toThrow('Invalid email or password');
    });

    it('should throw an error if the password is incorrect', async () => {
      const mockSelect = (db.select as any)();
      const mockFrom = mockSelect.from(null as any);
      const mockWhere = mockFrom.where(null as any);
      vi.mocked(mockWhere.limit).mockResolvedValue([{ id: '1', email: 'test@example.com', passwordHash: 'hash' }]);

      vi.mocked(bcrypt.compare).mockResolvedValue(false as any);

      await expect(
        login(
          {
            email: 'test@example.com',
            password: 'WrongPassword!',
          },
          '127.0.0.1',
          'Mozilla/5.0'
        )
      ).rejects.toThrow('Invalid email or password');
    });
  });
});
