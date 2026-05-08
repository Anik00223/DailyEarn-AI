import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { eq, and } from 'drizzle-orm';
import { db } from '../../db/index';
import { users, sessions } from '../../db/schema/index';
import { env } from '../../config/env';
import { createError } from '../../middleware/errorHandler';
import type { RegisterInput, LoginInput } from './auth.schema';

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

interface AuthResult {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    name: string | null;
    city: string | null;
    state: string | null;
    skillTags: string[] | null;
    dailyIncomeGoal: number | null;
    languagePref: string | null;
  };
}

function generateTokenPair(userId: string, email: string): TokenPair {
  const accessToken = jwt.sign(
    { userId, email },
    env.JWT_ACCESS_SECRET,
    { expiresIn: '15m' }
  );

  const refreshToken = jwt.sign(
    { userId, email, tokenId: crypto.randomUUID() },
    env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );

  return { accessToken, refreshToken };
}

async function storeSession(
  userId: string,
  refreshToken: string,
  tokenFamily: string,
  ipAddress: string | null,
  userAgent: string | null
): Promise<void> {
  const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  await db.insert(sessions).values({
    userId,
    refreshTokenHash,
    tokenFamily,
    ipAddress,
    userAgent,
    expiresAt,
  });
}

export async function register(
  data: RegisterInput,
  ipAddress: string | null,
  userAgent: string | null
): Promise<AuthResult> {
  // Check if user already exists
  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.email, data.email))
    .limit(1);

  if (existingUser.length > 0) {
    throw createError(409, 'CONFLICT', 'An account with this email already exists');
  }

  // Hash password
  const passwordHash = await bcrypt.hash(data.password, env.BCRYPT_ROUNDS);

  // Create user
  const [newUser] = await db
    .insert(users)
    .values({
      email: data.email,
      passwordHash,
      name: data.name,
      city: data.city,
      state: data.state,
    })
    .returning();

  if (!newUser) {
    throw createError(500, 'INTERNAL_ERROR', 'Failed to create user');
  }

  // Generate tokens
  const tokenFamily = crypto.randomUUID();
  const { accessToken, refreshToken } = generateTokenPair(newUser.id, newUser.email);

  // Store session
  await storeSession(newUser.id, refreshToken, tokenFamily, ipAddress, userAgent);

  return {
    accessToken,
    refreshToken,
    user: {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      city: newUser.city,
      state: newUser.state,
      skillTags: newUser.skillTags,
      dailyIncomeGoal: newUser.dailyIncomeGoal,
      languagePref: newUser.languagePref,
    },
  };
}

export async function login(
  data: LoginInput,
  ipAddress: string | null,
  userAgent: string | null
): Promise<AuthResult> {
  // Find user
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, data.email))
    .limit(1);

  if (!user) {
    throw createError(401, 'UNAUTHORIZED', 'Invalid email or password');
  }

  // Verify password
  const isValidPassword = await bcrypt.compare(data.password, user.passwordHash);
  if (!isValidPassword) {
    throw createError(401, 'UNAUTHORIZED', 'Invalid email or password');
  }

  // Generate tokens
  const tokenFamily = crypto.randomUUID();
  const { accessToken, refreshToken } = generateTokenPair(user.id, user.email);

  // Store session
  await storeSession(user.id, refreshToken, tokenFamily, ipAddress, userAgent);

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      city: user.city,
      state: user.state,
      skillTags: user.skillTags,
      dailyIncomeGoal: user.dailyIncomeGoal,
      languagePref: user.languagePref,
    },
  };
}

export async function refresh(
  oldRefreshToken: string,
  ipAddress: string | null,
  userAgent: string | null
): Promise<{ accessToken: string; refreshToken: string }> {
  // Find all non-expired sessions
  const allSessions = await db
    .select()
    .from(sessions)
    .where(eq(sessions.isRevoked, false));

  // Find matching session by comparing hashes
  let matchedSession = null;
  for (const session of allSessions) {
    const isMatch = await bcrypt.compare(oldRefreshToken, session.refreshTokenHash);
    if (isMatch) {
      matchedSession = session;
      break;
    }
  }

  if (!matchedSession) {
    // Check if token matches a revoked session (token reuse attack)
    const revokedSessions = await db
      .select()
      .from(sessions)
      .where(eq(sessions.isRevoked, true));

    for (const session of revokedSessions) {
      const isReuse = await bcrypt.compare(oldRefreshToken, session.refreshTokenHash);
      if (isReuse) {
        // SECURITY: Revoke entire token family
        await db
          .update(sessions)
          .set({ isRevoked: true })
          .where(eq(sessions.tokenFamily, session.tokenFamily));

        throw createError(401, 'REFRESH_TOKEN_REUSE', 'Token reuse detected. All sessions revoked.');
      }
    }

    throw createError(401, 'INVALID_TOKEN', 'Invalid refresh token');
  }

  // Check expiry
  if (new Date() > matchedSession.expiresAt) {
    await db
      .update(sessions)
      .set({ isRevoked: true })
      .where(eq(sessions.id, matchedSession.id));
    throw createError(401, 'TOKEN_EXPIRED', 'Refresh token expired');
  }

  // Get user
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, matchedSession.userId))
    .limit(1);

  if (!user) {
    throw createError(401, 'INVALID_TOKEN', 'User not found');
  }

  // Revoke old session
  await db
    .update(sessions)
    .set({ isRevoked: true })
    .where(eq(sessions.id, matchedSession.id));

  // Generate new token pair
  const { accessToken, refreshToken: newRefreshToken } = generateTokenPair(
    user.id,
    user.email
  );

  // Store new session with same family
  await storeSession(
    user.id,
    newRefreshToken,
    matchedSession.tokenFamily,
    ipAddress,
    userAgent
  );

  return { accessToken, refreshToken: newRefreshToken };
}

export async function logout(refreshToken: string): Promise<void> {
  const allSessions = await db
    .select()
    .from(sessions)
    .where(eq(sessions.isRevoked, false));

  for (const session of allSessions) {
    const isMatch = await bcrypt.compare(refreshToken, session.refreshTokenHash);
    if (isMatch) {
      await db
        .update(sessions)
        .set({ isRevoked: true })
        .where(eq(sessions.id, session.id));
      return;
    }
  }
}

export async function getMe(userId: string) {
  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      city: users.city,
      state: users.state,
      skillTags: users.skillTags,
      dailyIncomeGoal: users.dailyIncomeGoal,
      languagePref: users.languagePref,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) {
    throw createError(404, 'NOT_FOUND', 'User not found');
  }

  return user;
}
