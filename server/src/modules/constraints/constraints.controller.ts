import type { Request, Response, NextFunction } from 'express';
import type { ConstraintsService } from './constraints.service';
import type {
  CreateIronConstraintDto,
  UpdateIronConstraintDto,
  CreateDateConstraintDto,
  UpdateDateConstraintDto,
  UpsertDepartmentConstraintDto,
  CreateSemesterDto,
  UpdateSemesterDto,
} from './constraints.schema';

export function createConstraintsController(service: ConstraintsService) {
  return {
    // ─── Iron Constraints ──────────────────────────────────

    async getAllIron(_req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const constraints = await service.getAllIron();
        res.json(constraints);
      } catch (err) {
        next(err);
      }
    },

    async createIron(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const constraint = await service.createIron(req.body as CreateIronConstraintDto);
        res.status(201).json(constraint);
      } catch (err) {
        next(err);
      }
    },

    async updateIron(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const constraint = await service.updateIron(
          Number(req.params.id),
          req.body as UpdateIronConstraintDto,
        );
        res.json(constraint);
      } catch (err) {
        next(err);
      }
    },

    async deleteIron(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        await service.deleteIron(Number(req.params.id));
        res.status(204).send();
      } catch (err) {
        next(err);
      }
    },

    // ─── Date Constraints ──────────────────────────────────

    async getAllDate(_req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const constraints = await service.getAllDate();
        res.json(constraints);
      } catch (err) {
        next(err);
      }
    },

    async createDate(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const constraint = await service.createDate(req.body as CreateDateConstraintDto);
        res.status(201).json(constraint);
      } catch (err) {
        next(err);
      }
    },

    async updateDate(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const constraint = await service.updateDate(
          Number(req.params.id),
          req.body as UpdateDateConstraintDto,
        );
        res.json(constraint);
      } catch (err) {
        next(err);
      }
    },

    async deleteDate(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        await service.deleteDate(Number(req.params.id));
        res.status(204).send();
      } catch (err) {
        next(err);
      }
    },

    // ─── Departments ───────────────────────────────────────

    async getAllDepartments(_req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const departments = await service.getAllDepartments();
        res.json(departments);
      } catch (err) {
        next(err);
      }
    },

    async getDepartmentConstraint(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const constraint = await service.getDepartmentConstraint(Number(req.params.id));
        res.json(constraint);
      } catch (err) {
        next(err);
      }
    },

    async upsertDepartmentConstraint(
      req: Request,
      res: Response,
      next: NextFunction,
    ): Promise<void> {
      try {
        const constraint = await service.upsertDepartmentConstraint(
          Number(req.params.id),
          req.body as UpsertDepartmentConstraintDto,
        );
        res.json(constraint);
      } catch (err) {
        next(err);
      }
    },

    // ─── Semesters ─────────────────────────────────────────

    async getSemesters(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const semesters = await service.getSemesters(Number(req.params.universityId));
        res.json(semesters);
      } catch (err) {
        next(err);
      }
    },

    async createSemester(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const semester = await service.createSemester(req.body as CreateSemesterDto);
        res.status(201).json(semester);
      } catch (err) {
        next(err);
      }
    },

    async updateSemester(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const semester = await service.updateSemester(
          Number(req.params.id),
          req.body as UpdateSemesterDto,
        );
        res.json(semester);
      } catch (err) {
        next(err);
      }
    },
  };
}
