import { Router } from 'express';
import { authenticate } from '../../shared/middlewares/authenticate';
import { authorize } from '../../shared/middlewares/authorize';
import { validateRequest } from '../../shared/middlewares/validateRequest';
import { ConstraintRepository } from './constraint.repository';
import { ConstraintService } from './constraint.service';
import { createConstraintController } from './constraint.controller';
import {
  toggleConstraintSchema,
  createSoftConstraintSchema,
  updateSoftConstraintSchema,
  createDepartmentSchema,
  updateDepartmentSchema,
  createUniversityWithSemesterSchema,
  updateUniversityWithSemesterSchema,
} from './constraint.schema';

const repository = new ConstraintRepository();
const service = new ConstraintService(repository);
const controller = createConstraintController(service);

const adminOnly = authorize('SUPER_ADMIN', 'ADMIN');

export const constraintRouter = Router();

constraintRouter.use(authenticate);

// Existing scheduler endpoint (kept as-is)
constraintRouter.get('/', controller.getSchedulerConstraints);

// Management endpoint (all authenticated users)
constraintRouter.get('/management', controller.getAllConstraints);

// Iron constraints
constraintRouter.patch('/iron/:id/toggle', adminOnly, validateRequest(toggleConstraintSchema), controller.toggleIronConstraint);

// Date constraints
constraintRouter.patch('/date/:id/toggle', adminOnly, validateRequest(toggleConstraintSchema), controller.toggleDateConstraint);

// Holidays
constraintRouter.patch('/holidays/:id/toggle', adminOnly, validateRequest(toggleConstraintSchema), controller.toggleHoliday);

// Soft constraints
constraintRouter.post('/soft', adminOnly, validateRequest(createSoftConstraintSchema), controller.createSoftConstraint);
constraintRouter.patch('/soft/:id', adminOnly, validateRequest(updateSoftConstraintSchema), controller.updateSoftConstraint);
constraintRouter.delete('/soft/:id', adminOnly, controller.deleteSoftConstraint);
constraintRouter.patch('/soft/:id/toggle', adminOnly, validateRequest(toggleConstraintSchema), controller.toggleSoftConstraint);

// Departments (transactional)
constraintRouter.post('/departments', adminOnly, validateRequest(createDepartmentSchema), controller.createDepartmentWithConstraint);
constraintRouter.patch('/departments/:id', adminOnly, validateRequest(updateDepartmentSchema), controller.updateDepartmentWithConstraint);

// Universities (transactional)
constraintRouter.post('/universities', adminOnly, validateRequest(createUniversityWithSemesterSchema), controller.createUniversityWithSemester);
constraintRouter.patch('/universities/:id', adminOnly, validateRequest(updateUniversityWithSemesterSchema), controller.updateUniversityWithSemester);
