import type { Request, Response, NextFunction } from 'express';
import type { ConstraintService } from './constraint.service';

export function createConstraintController(service: ConstraintService) {
  return {
    async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const yearParam = req.query['year'];
        if (!yearParam) {
          res.status(400).json({ message: 'year query parameter is required' });
          return;
        }
        // Accept comma-separated years: ?year=2025,2026
        const years = String(yearParam).split(',').map(Number).filter((n) => !isNaN(n));
        if (years.length === 0) {
          res.status(400).json({ message: 'year must contain valid numbers' });
          return;
        }
        const constraints = await service.getConstraintsForYears(years);
        res.json(constraints);
      } catch (err) {
        next(err);
      }
    },
  };
}
