import type { Request, Response, NextFunction } from 'express';
import type { UniversityService } from './university.service';
import type { CreateUniversityDto, UpdateUniversityDto } from './university.schema';

export function createUniversityController(service: UniversityService) {
  return {
    async getAll(_req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const universities = await service.getAll();
        res.json(universities);
      } catch (err) {
        next(err);
      }
    },

    async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const university = await service.getById(Number(req.params.id));
        res.json(university);
      } catch (err) {
        next(err);
      }
    },

    async create(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const university = await service.create(req.body as CreateUniversityDto);
        res.status(201).json(university);
      } catch (err) {
        next(err);
      }
    },

    async update(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const university = await service.update(
          Number(req.params.id),
          req.body as UpdateUniversityDto,
        );
        res.json(university);
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
