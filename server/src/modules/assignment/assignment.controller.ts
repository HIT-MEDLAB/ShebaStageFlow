import type { Request, Response, NextFunction } from 'express';
import type { AssignmentService } from './assignment.service';
import type { AssignmentFilters } from './assignment.repository';
import type {
  CreateAssignmentDto,
  UpdateAssignmentDto,
  MoveAssignmentDto,
  ImportAssignmentsDto,
  AddStudentDto,
  ImportStudentsDto,
} from './assignment.schema';

export function createAssignmentController(service: AssignmentService) {
  return {
    async getByAcademicYear(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const academicYearId = Number(req.query.academicYearId);
        if (!academicYearId || isNaN(academicYearId)) {
          res.status(400).json({ message: 'academicYearId query parameter is required' });
          return;
        }

        const filters: AssignmentFilters = {};

        if (req.query.universityId) {
          const raw = req.query.universityId;
          if (Array.isArray(raw)) {
            filters.universityId = raw.map((v) => Number(v));
          } else {
            filters.universityId = [Number(raw)];
          }
        }

        if (req.query.shiftType) {
          filters.shiftType = req.query.shiftType as 'MORNING' | 'EVENING';
        }

        if (req.query.yearInProgram) {
          filters.yearInProgram = Number(req.query.yearInProgram);
        }

        const assignments = await service.getByAcademicYear(academicYearId, filters);
        res.json(assignments);
      } catch (err) {
        next(err);
      }
    },

    async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const assignment = await service.getById(Number(req.params.id));
        res.json(assignment);
      } catch (err) {
        next(err);
      }
    },

    async create(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const userId = req.currentUser!.userId;
        const assignment = await service.create(req.body as CreateAssignmentDto, userId);
        res.status(201).json(assignment);
      } catch (err) {
        next(err);
      }
    },

    async update(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const assignment = await service.update(
          Number(req.params.id),
          req.body as UpdateAssignmentDto,
        );
        res.json(assignment);
      } catch (err) {
        next(err);
      }
    },

    async move(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const assignment = await service.move(
          Number(req.params.id),
          req.body as MoveAssignmentDto,
        );
        res.json(assignment);
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

    async importAssignments(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const userId = req.currentUser!.userId;
        const result = await service.importAssignments(req.body as ImportAssignmentsDto, userId);
        res.status(201).json(result);
      } catch (err) {
        next(err);
      }
    },

    async addStudent(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const result = await service.addStudent(
          Number(req.params.id),
          req.body as AddStudentDto,
        );
        res.status(201).json(result);
      } catch (err) {
        next(err);
      }
    },

    async removeStudent(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        await service.removeStudent(
          Number(req.params.id),
          Number(req.params.studentId),
        );
        res.status(204).send();
      } catch (err) {
        next(err);
      }
    },

    async importStudents(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const result = await service.importStudents(
          Number(req.params.id),
          req.body as ImportStudentsDto,
        );
        res.status(201).json(result);
      } catch (err) {
        next(err);
      }
    },
  };
}
