import type { Request, Response, NextFunction } from 'express';
import type { AdminService } from './admin.service';

export function createAdminController(service: AdminService) {
  return {
    async getAll(_req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const data = await service.getAll();
        res.json(data);
      } catch (err) {
        next(err);
      }
    },

    async create(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const result = await service.create(req.body);
        res.status(201).json(result);
      } catch (err) {
        next(err);
      }
    },

    async update(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const id = Number(req.params['id']);
        const result = await service.update(id, req.body);
        res.json(result);
      } catch (err) {
        next(err);
      }
    },

    async remove(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const id = Number(req.params['id']);
        await service.delete(id);
        res.status(204).send();
      } catch (err) {
        next(err);
      }
    },
  };
}
