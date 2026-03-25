import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError';

export function requireAdmin(req: Request, _res: Response, next: NextFunction): void {
  const role = req.currentUser?.role;

  if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
    next(new AppError('Forbidden', 403));
    return;
  }

  next();
}
