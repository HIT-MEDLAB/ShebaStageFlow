import { Router } from 'express';
import { authenticate } from '../../shared/middlewares/authenticate';
import { ConstraintRepository } from './constraint.repository';
import { ConstraintService } from './constraint.service';
import { createConstraintController } from './constraint.controller';

const repository = new ConstraintRepository();
const service = new ConstraintService(repository);
const controller = createConstraintController(service);

export const constraintRouter = Router();

constraintRouter.use(authenticate);

constraintRouter.get('/', controller.getAll);
