import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError';

export function authorize(...allowedRoles: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.currentUser || !allowedRoles.includes(req.currentUser.role)) {
      next(new AppError('Forbidden', 403));
      return;
    }
    next();
  };
}
