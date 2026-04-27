import type { Request, Response, NextFunction } from 'express';
import type { ConstraintService } from './constraint.service';

export function createConstraintController(service: ConstraintService) {
  return {
    async getSchedulerConstraints(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const yearParam = req.query['year'];
        if (!yearParam) {
          res.status(400).json({ message: 'year query parameter is required' });
          return;
        }
        const years = String(yearParam).split(',').map(Number).filter((n) => !isNaN(n));
        if (years.length === 0) {
          res.status(400).json({ message: 'year must contain valid numbers' });
          return;
        }
        const academicYearId = req.query['academicYearId'] ? Number(req.query['academicYearId']) : undefined;
        const constraints = await service.getConstraintsForYears(years, academicYearId);
        res.json(constraints);
      } catch (err) {
        next(err);
      }
    },

    async getAllConstraints(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const academicYearId = req.query['academicYearId'] ? Number(req.query['academicYearId']) : undefined;
        const year = req.query['year'] ? Number(req.query['year']) : undefined;
        const data = await service.getAllConstraintsForManagement(academicYearId, year);
        res.json(data);
      } catch (err) {
        next(err);
      }
    },

    async toggleIronConstraint(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const id = Number(req.params['id']);
        const { isActive } = req.body;
        const result = await service.toggleIronConstraint(id, isActive);
        res.json(result);
      } catch (err) {
        next(err);
      }
    },

    async toggleDateConstraint(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const id = Number(req.params['id']);
        const { isActive } = req.body;
        const result = await service.toggleDateConstraint(id, isActive);
        res.json(result);
      } catch (err) {
        next(err);
      }
    },

    async toggleSoftConstraint(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const id = Number(req.params['id']);
        const { isActive } = req.body;
        const result = await service.toggleSoftConstraint(id, isActive);
        res.json(result);
      } catch (err) {
        next(err);
      }
    },

    async toggleHoliday(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const id = Number(req.params['id']);
        const { isActive } = req.body;
        const result = await service.toggleHoliday(id, isActive);
        res.json(result);
      } catch (err) {
        next(err);
      }
    },

    async createSoftConstraint(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const result = await service.createSoftConstraint(req.body);
        res.status(201).json(result);
      } catch (err) {
        next(err);
      }
    },

    async updateSoftConstraint(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const id = Number(req.params['id']);
        const result = await service.updateSoftConstraint(id, req.body);
        res.json(result);
      } catch (err) {
        next(err);
      }
    },

    async deleteSoftConstraint(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const id = Number(req.params['id']);
        await service.deleteSoftConstraint(id);
        res.status(204).send();
      } catch (err) {
        next(err);
      }
    },

    async createDepartmentWithConstraint(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const result = await service.createDepartmentWithConstraint(req.body);
        res.status(201).json(result);
      } catch (err) {
        next(err);
      }
    },

    async updateDepartmentWithConstraint(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const id = Number(req.params['id']);
        const result = await service.updateDepartmentWithConstraint(id, req.body);
        res.json(result);
      } catch (err) {
        next(err);
      }
    },

    async createUniversityWithSemester(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const data = { ...req.body };
        if (req.body.semesterStart) {
          data.year = new Date(req.body.semesterStart).getUTCFullYear();
        }
        const result = await service.createUniversityWithSemester(data);
        res.status(201).json(result);
      } catch (err) {
        next(err);
      }
    },

    async updateUniversityWithSemester(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const id = Number(req.params['id']);
        const data = { ...req.body };
        if (req.body.semesterStart) {
          data.year = new Date(req.body.semesterStart).getUTCFullYear();
        }
        // Use calendarYear from query if no year derived from semesterStart
        if (!data.year && req.query['calendarYear']) {
          data.year = Number(req.query['calendarYear']);
        }
        const result = await service.updateUniversityWithSemester(id, data);
        res.json(result);
      } catch (err) {
        next(err);
      }
    },

    async deleteDepartment(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const id = Number(req.params['id']);
        await service.deleteDepartment(id);
        res.status(204).send();
      } catch (err) {
        next(err);
      }
    },

    async deleteUniversity(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const id = Number(req.params['id']);
        await service.deleteUniversity(id);
        res.status(204).send();
      } catch (err) {
        next(err);
      }
    },

    async setDepartmentActive(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const id = Number(req.params['id']);
        const { isActive, academicYearId } = req.body;
        const result = await service.setDepartmentActive(id, academicYearId, isActive);
        res.json(result);
      } catch (err) {
        next(err);
      }
    },

    async setUniversityActive(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const id = Number(req.params['id']);
        const { isActive, year } = req.body;
        const result = await service.setUniversityActive(id, year, isActive);
        res.json(result);
      } catch (err) {
        next(err);
      }
    },

    async copyYear(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const { targetAcademicYearId, sourceAcademicYearId } = req.body;
        await service.copyConstraintsToNewYear(targetAcademicYearId, sourceAcademicYearId);
        res.json({ message: 'Constraints copied successfully' });
      } catch (err) {
        next(err);
      }
    },
  };
}
