import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import prisma from './lib/prisma';
import { authRouter } from './modules/auth/auth.routes';
import { universityRouter } from './modules/university/university.routes';
import { academicYearRouter } from './modules/academic-year/academic-year.routes';
import { departmentRouter } from './modules/department/department.routes';
import { assignmentRouter } from './modules/assignment/assignment.routes';
import { constraintRouter } from './modules/constraint/constraint.routes';
import { coordinatorRouter } from './modules/coordinator/coordinator.routes';
import { adminRouter } from './modules/admin/admin.routes';
import { statisticsRouter } from './modules/statistics/statistics.routes';
import { homeRouter } from './modules/home/home.routes';
import { errorHandler } from './shared/middlewares/errorHandler';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env['CLIENT_URL'] || 'http://localhost:5173',
  credentials: true,
}));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check route
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Module routes
app.use('/api/auth', authRouter);
app.use('/api/universities', universityRouter);
app.use('/api/academic-years', academicYearRouter);
app.use('/api/departments', departmentRouter);
app.use('/api/assignments', assignmentRouter);
app.use('/api/constraints', constraintRouter);
app.use('/api/coordinators', coordinatorRouter);
app.use('/api/admins', adminRouter);
app.use('/api/statistics', statisticsRouter);
app.use('/api/home', homeRouter);

// Error handler (must be last)
app.use(errorHandler);

async function ensureAcademicYears() {
  const years = [
    { name: '2025-2026', startDate: new Date('2025-10-01'), endDate: new Date('2026-06-30') },
    { name: '2026-2027', startDate: new Date('2026-10-01'), endDate: new Date('2027-06-30') },
    { name: '2027-2028', startDate: new Date('2027-10-01'), endDate: new Date('2028-06-30') },
    { name: '2028-2029', startDate: new Date('2028-10-01'), endDate: new Date('2029-06-30') },
    { name: '2029-2030', startDate: new Date('2029-10-01'), endDate: new Date('2030-06-30') },
    { name: '2030-2031', startDate: new Date('2030-10-01'), endDate: new Date('2031-06-30') },
  ];
  for (const y of years) {
    await prisma.academicYear.upsert({
      where: { name: y.name },
      update: {},
      create: y,
    });
  }
  console.log('Academic years 2025-2031 ensured.');
}

ensureAcademicYears()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to ensure academic years:', err);
    process.exit(1);
  });

export { prisma };
export default app;
