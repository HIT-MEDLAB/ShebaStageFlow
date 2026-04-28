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
  createBlockSchema,
  moveBlockSchema,
  findBlockPositionsSchema,
  convertToBlockSchema,
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

// Temporary: clear all assignments
assignmentRouter.delete('/clear-all', adminOnly, controller.removeAll);

// Block (multi-week) routes
assignmentRouter.post('/block', validateRequest(createBlockSchema), controller.createBlock);
assignmentRouter.post('/block/find-positions', validateRequest(findBlockPositionsSchema), controller.findBlockPositions);
assignmentRouter.patch('/block/:groupId/move', validateRequest(moveBlockSchema), controller.moveBlock);

// Dynamic :id paths
assignmentRouter.get('/:id', controller.getById);
assignmentRouter.patch('/:id', validateRequest(updateAssignmentSchema), controller.update);
assignmentRouter.patch('/:id/approve', adminOnly, controller.approve);
assignmentRouter.patch('/:id/reject', adminOnly, validateRequest(rejectAssignmentSchema), controller.reject);
assignmentRouter.patch('/:id/move', validateRequest(moveAssignmentSchema), controller.move);
assignmentRouter.patch('/:id/displace', validateRequest(displaceAssignmentSchema), controller.displace);
assignmentRouter.post('/:id/convert-to-block', validateRequest(convertToBlockSchema), controller.convertToBlock);
assignmentRouter.patch('/:id/detach', adminOnly, controller.detachFromBlock);
assignmentRouter.delete('/:id', controller.remove);
assignmentRouter.post('/:id/students', validateRequest(addStudentSchema), controller.addStudent);
assignmentRouter.post('/:id/students/import', validateRequest(importStudentsSchema), controller.importStudents);
assignmentRouter.delete('/:id/students/:studentId', controller.removeStudent);
