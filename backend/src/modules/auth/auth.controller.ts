import { Request, Response, NextFunction } from 'express';
import * as authService from './auth.service';
import { success } from '../../utils/apiResponse';
import { env } from '../../config/env';

export async function registerController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const ipAddress = req.ip || null;
    const userAgent = req.headers['user-agent'] || null;

    const result = await authService.register(req.body, ipAddress, userAgent);

    // Set refresh token as httpOnly cookie
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/api/auth/refresh',
    });

    // Return ONLY accessToken in response body
    res.status(201).json(
      success(
        { accessToken: result.accessToken, user: result.user },
        'Registration successful'
      )
    );
  } catch (error) {
    next(error);
  }
}

export async function loginController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const ipAddress = req.ip || null;
    const userAgent = req.headers['user-agent'] || null;

    const result = await authService.login(req.body, ipAddress, userAgent);

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/api/auth/refresh',
    });

    res.json(
      success(
        { accessToken: result.accessToken, user: result.user },
        'Login successful'
      )
    );
  } catch (error) {
    next(error);
  }
}

export async function refreshController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const oldRefreshToken = req.cookies?.refreshToken;

    if (!oldRefreshToken) {
      res.status(401).json({
        success: false,
        code: 'INVALID_TOKEN',
        message: 'No refresh token provided',
      });
      return;
    }

    const ipAddress = req.ip || null;
    const userAgent = req.headers['user-agent'] || null;

    const result = await authService.refresh(oldRefreshToken, ipAddress, userAgent);

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/api/auth/refresh',
    });

    res.json(success({ accessToken: result.accessToken }));
  } catch (error) {
    next(error);
  }
}

export async function logoutController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const refreshToken = req.cookies?.refreshToken;

    if (refreshToken) {
      await authService.logout(refreshToken);
    }

    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/api/auth/refresh',
    });

    res.json(success(null, 'Logged out successfully'));
  } catch (error) {
    next(error);
  }
}

export async function getMeController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const user = await authService.getMe(userId);
    res.json(success(user));
  } catch (error) {
    next(error);
  }
}
