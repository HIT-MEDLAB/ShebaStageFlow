import { Router } from 'express';
import { authenticate } from '../../shared/middlewares/authenticate';
import { authorize } from '../../shared/middlewares/authorize';
import { validateRequest } from '../../shared/middlewares/validateRequest';
import { CoordinatorRepository } from './coordinator.repository';
import { CoordinatorService } from './coordinator.service';
import { createCoordinatorController } from './coordinator.controller';
import { createCoordinatorSchema, updateCoordinatorSchema } from './coordinator.schema';

const repository = new CoordinatorRepository();
const service = new CoordinatorService(repository);
const controller = createCoordinatorController(service);

const adminOnly = authorize('SUPER_ADMIN', 'ADMIN');

export const coordinatorRouter = Router();

coordinatorRouter.use(authenticate);
coordinatorRouter.use(adminOnly);

coordinatorRouter.get('/', controller.getAll);
coordinatorRouter.post('/', validateRequest(createCoordinatorSchema), controller.create);
coordinatorRouter.patch('/:id', validateRequest(updateCoordinatorSchema), controller.update);
coordinatorRouter.delete('/:id', controller.remove);
