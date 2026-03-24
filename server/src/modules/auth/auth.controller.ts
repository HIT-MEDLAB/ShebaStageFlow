import type { Request, Response, NextFunction } from 'express';
import type { AuthService } from './auth.service';
import type { LoginDto, VerifyOtpDto } from './auth.schema';
import { AUTH_COOKIE_NAME, AUTH_COOKIE_OPTIONS, AUTH_COOKIE_CLEAR_OPTIONS } from '../../shared/utils/cookie';

export function createAuthController(service: AuthService) {
  return {
    async login(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        console.log('[auth] login handler called — OTP flow active');
        const result = await service.login(req.body as LoginDto);
        res.clearCookie(AUTH_COOKIE_NAME, AUTH_COOKIE_CLEAR_OPTIONS);
        res.json(result);
      } catch (err) {
        next(err);
      }
    },

    async verifyOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const { otpToken, code } = req.body as VerifyOtpDto;
        const result = await service.verifyOtp(otpToken, code);
        res.cookie(AUTH_COOKIE_NAME, result.token, AUTH_COOKIE_OPTIONS);
        res.json({ user: result.user });
      } catch (err) {
        next(err);
      }
    },

    async me(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const user = await service.getMe(req.currentUser!.userId);
        res.json({ user });
      } catch (err) {
        next(err);
      }
    },

    async logout(_req: Request, res: Response): Promise<void> {
      res.clearCookie(AUTH_COOKIE_NAME, AUTH_COOKIE_CLEAR_OPTIONS);
      res.json({ message: 'Logged out' });
    },
  };
}
