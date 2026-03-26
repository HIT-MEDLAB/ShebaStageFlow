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
  RejectAssignmentDto,
  DisplaceAssignmentDto,
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

        if (req.query.status) {
          const raw = req.query.status;
          if (Array.isArray(raw)) {
            filters.status = raw as ('PENDING' | 'APPROVED' | 'REJECTED')[];
          } else {
            filters.status = raw as 'PENDING' | 'APPROVED' | 'REJECTED';
          }
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
        const userRole = req.currentUser!.role;
        const assignment = await service.create(req.body as CreateAssignmentDto, userId, userRole);
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
        const userId = req.currentUser!.userId;
        const userRole = req.currentUser!.role;
        const assignment = await service.move(
          Number(req.params.id),
          req.body as MoveAssignmentDto,
          userId,
          userRole,
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

    async approve(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const userId = req.currentUser!.userId;
        const assignment = await service.approve(Number(req.params.id), userId);
        res.json(assignment);
      } catch (err) {
        next(err);
      }
    },

    async reject(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const { rejectionReason } = req.body as RejectAssignmentDto;
        await service.reject(Number(req.params.id), rejectionReason);
        res.status(204).send();
      } catch (err) {
        next(err);
      }
    },

    async displace(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const userId = req.currentUser!.userId;
        const userRole = req.currentUser!.role;
        const assignment = await service.displace(
          Number(req.params.id),
          req.body as DisplaceAssignmentDto,
          userId,
          userRole,
        );
        res.json(assignment);
      } catch (err) {
        next(err);
      }
    },
  };
}
