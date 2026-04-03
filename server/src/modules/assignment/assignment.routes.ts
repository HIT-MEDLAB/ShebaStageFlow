import { Router } from 'express';
import { validateRequest } from '../../shared/middlewares/validateRequest';
import { authenticate } from '../../shared/middlewares/authenticate';
import { authorize } from '../../shared/middlewares/authorize';
import {
  createAssignmentSchema,
  updateAssignmentSchema,
  moveAssignmentSchema,
  importAssignmentsSchema,
  addStudentSchema,
  importStudentsSchema,
  rejectAssignmentSchema,
  displaceAssignmentSchema,
  smartImportValidateSchema,
  smartImportExecuteSchema,
  validateDisplacementWeekSchema,
} from './assignment.schema';
import { AssignmentRepository } from './assignment.repository';
import { AssignmentService } from './assignment.service';
import { createAssignmentController } from './assignment.controller';

const repository = new AssignmentRepository();
const service = new AssignmentService(repository);
const controller = createAssignmentController(service);

export const assignmentRouter = Router();

assignmentRouter.use(authenticate);

const adminOnly = authorize('SUPER_ADMIN', 'ADMIN');

// Static paths must be registered before dynamic /:id paths
assignmentRouter.get('/', controller.getByAcademicYear);
assignmentRouter.get('/export', controller.exportAssignments);
assignmentRouter.post('/', validateRequest(createAssignmentSchema), controller.create);
assignmentRouter.post('/import/validate', validateRequest(smartImportValidateSchema), controller.smartImportValidate);
assignmentRouter.post('/import/validate-displacement-week', validateRequest(validateDisplacementWeekSchema), controller.validateDisplacementWeek);
assignmentRouter.post('/import/execute', validateRequest(smartImportExecuteSchema), controller.smartImportExecute);
assignmentRouter.post('/import', validateRequest(importAssignmentsSchema), controller.importAssignments);

// Dynamic :id paths
assignmentRouter.get('/:id', controller.getById);
assignmentRouter.patch('/:id', validateRequest(updateAssignmentSchema), controller.update);
assignmentRouter.patch('/:id/approve', adminOnly, controller.approve);
assignmentRouter.patch('/:id/reject', adminOnly, validateRequest(rejectAssignmentSchema), controller.reject);
assignmentRouter.patch('/:id/move', validateRequest(moveAssignmentSchema), controller.move);
assignmentRouter.patch('/:id/displace', validateRequest(displaceAssignmentSchema), controller.displace);
assignmentRouter.delete('/:id', controller.remove);
assignmentRouter.post('/:id/students', validateRequest(addStudentSchema), controller.addStudent);
assignmentRouter.post('/:id/students/import', validateRequest(importStudentsSchema), controller.importStudents);
assignmentRouter.delete('/:id/students/:studentId', controller.removeStudent);
