import { Router } from 'express';
import { authenticate } from '../../shared/middlewares/authenticate';
import { HomeRepository } from './home.repository';
import { HomeService } from './home.service';
import { createHomeController } from './home.controller';

const repository = new HomeRepository();
const service = new HomeService(repository);
const controller = createHomeController(service);

export const homeRouter = Router();

homeRouter.use(authenticate);

homeRouter.get('/summary', controller.getSummary);
