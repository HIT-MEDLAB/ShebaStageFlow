import type { Request, Response, NextFunction } from 'express';
import type { DepartmentService } from './department.service';

export function createDepartmentController(service: DepartmentService) {
  return {
    async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const raw = req.query['academicYearId'];
        const parsed = raw !== undefined ? Number(raw) : NaN;
        const academicYearId = Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
        const departments = await service.getAll(academicYearId);
        res.json(departments);
      } catch (err) {
        next(err);
      }
    },
  };
}
