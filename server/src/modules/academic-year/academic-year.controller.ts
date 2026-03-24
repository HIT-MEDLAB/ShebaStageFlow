import type { Request, Response, NextFunction } from 'express';
import type { AcademicYearService } from './academic-year.service';
import type { CreateAcademicYearDto, UpdateAcademicYearDto } from './academic-year.schema';

export function createAcademicYearController(service: AcademicYearService) {
  return {
    async getAll(_req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const academicYears = await service.getAll();
        res.json(academicYears);
      } catch (err) {
        next(err);
      }
    },

    async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const academicYear = await service.getById(Number(req.params.id));
        res.json(academicYear);
      } catch (err) {
        next(err);
      }
    },

    async create(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const academicYear = await service.create(req.body as CreateAcademicYearDto);
        res.status(201).json(academicYear);
      } catch (err) {
        next(err);
      }
    },

    async update(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const academicYear = await service.update(
          Number(req.params.id),
          req.body as UpdateAcademicYearDto,
        );
        res.json(academicYear);
      } catch (err) {
        next(err);
      }
    },

    async remove(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        await service.remove(Number(req.params.id));
        res.status(204).send();
      } catch (err) {
        next(err);
      }
    },
  };
}
