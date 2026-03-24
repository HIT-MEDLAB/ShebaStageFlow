import type { Request, Response, NextFunction } from 'express';
import type { ConstraintService } from './constraint.service';

export function createConstraintController(service: ConstraintService) {
  return {
    async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const year = Number(req.query['year']);
        if (!year || isNaN(year)) {
          res.status(400).json({ message: 'year query parameter is required and must be a number' });
          return;
        }
        const constraints = await service.getConstraintsForYear(year);
        res.json(constraints);
      } catch (err) {
        next(err);
      }
    },
  };
}
