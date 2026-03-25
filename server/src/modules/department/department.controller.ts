import type { Request, Response, NextFunction } from 'express';
import type { DepartmentService } from './department.service';

export function createDepartmentController(service: DepartmentService) {
  return {
    async getAll(_req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const departments = await service.getAll();
        res.json(departments);
      } catch (err) {
        next(err);
      }
    },
  };
}
