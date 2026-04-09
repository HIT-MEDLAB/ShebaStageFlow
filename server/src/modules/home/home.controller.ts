import type { Request, Response, NextFunction } from 'express';
import type { HomeService } from './home.service';

export function createHomeController(service: HomeService) {
  return {
    async getSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const academicYearId = Number(req.query.academicYearId);
        if (!academicYearId || isNaN(academicYearId)) {
          res.status(400).json({ message: 'academicYearId query parameter is required' });
          return;
        }

        const timeframe = req.query.timeframe as string;
        if (!timeframe || !['weekly', 'calendarYear', 'academicYear'].includes(timeframe)) {
          res.status(400).json({ message: 'timeframe must be "weekly", "calendarYear", or "academicYear"' });
          return;
        }

        let weekStart: string | undefined;
        let weekEnd: string | undefined;

        if (!req.query.weekStart || !req.query.weekEnd) {
          if (timeframe === 'weekly') {
            res.status(400).json({ message: 'weekStart and weekEnd are required for weekly timeframe' });
            return;
          }
        } else {
          weekStart = req.query.weekStart as string;
          weekEnd = req.query.weekEnd as string;
        }

        const data = await service.getSummary(
          academicYearId,
          timeframe as 'weekly' | 'calendarYear' | 'academicYear',
          weekStart,
          weekEnd,
        );
        res.json(data);
      } catch (err) {
        next(err);
      }
    },
  };
}
