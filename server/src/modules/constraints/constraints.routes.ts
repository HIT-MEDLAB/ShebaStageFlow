import { Router } from 'express';
import { validateRequest } from '../../shared/middlewares/validateRequest';
import { authenticate } from '../../shared/middlewares/authenticate';
import { requireAdmin } from '../../shared/middlewares/requireAdmin';
import {
  createIronConstraintSchema,
  updateIronConstraintSchema,
  createDateConstraintSchema,
  updateDateConstraintSchema,
  upsertDepartmentConstraintSchema,
  createSemesterSchema,
  updateSemesterSchema,
} from './constraints.schema';
import { ConstraintsRepository } from './constraints.repository';
import { ConstraintsService } from './constraints.service';
import { createConstraintsController } from './constraints.controller';

const repository = new ConstraintsRepository();
const service = new ConstraintsService(repository);
const controller = createConstraintsController(service);

export const constraintsRouter = Router();

constraintsRouter.use(authenticate);

// ─── Iron Constraints ────────────────────────────────────

constraintsRouter.get('/iron', controller.getAllIron);
constraintsRouter.post('/iron', requireAdmin, validateRequest(createIronConstraintSchema), controller.createIron);
constraintsRouter.patch('/iron/:id', requireAdmin, validateRequest(updateIronConstraintSchema), controller.updateIron);
constraintsRouter.delete('/iron/:id', requireAdmin, controller.deleteIron);

// ─── Date Constraints ────────────────────────────────────

constraintsRouter.get('/date', controller.getAllDate);
constraintsRouter.post('/date', requireAdmin, validateRequest(createDateConstraintSchema), controller.createDate);
constraintsRouter.patch('/date/:id', requireAdmin, validateRequest(updateDateConstraintSchema), controller.updateDate);
constraintsRouter.delete('/date/:id', requireAdmin, controller.deleteDate);

// ─── Departments ─────────────────────────────────────────

constraintsRouter.get('/departments', controller.getAllDepartments);
constraintsRouter.get('/departments/:id', controller.getDepartmentConstraint);
constraintsRouter.put('/departments/:id', requireAdmin, validateRequest(upsertDepartmentConstraintSchema), controller.upsertDepartmentConstraint);

// ─── Semesters ───────────────────────────────────────────

constraintsRouter.get('/semesters/:universityId', controller.getSemesters);
constraintsRouter.post('/semesters', requireAdmin, validateRequest(createSemesterSchema), controller.createSemester);
constraintsRouter.patch('/semesters/:id', requireAdmin, validateRequest(updateSemesterSchema), controller.updateSemester);
