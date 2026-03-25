import { Router } from 'express';
import { authenticate } from '../../shared/middlewares/authenticate';
import { DepartmentRepository } from './department.repository';
import { DepartmentService } from './department.service';
import { createDepartmentController } from './department.controller';

const repository = new DepartmentRepository();
const service = new DepartmentService(repository);
const controller = createDepartmentController(service);

export const departmentRouter = Router();

departmentRouter.use(authenticate);

departmentRouter.get('/', controller.getAll);
