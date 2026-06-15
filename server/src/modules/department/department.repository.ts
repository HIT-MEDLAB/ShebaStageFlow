import prisma from '../../lib/prisma';
import type { Department } from '@prisma/client';

export interface IDepartmentRepository {
  findAll(academicYearId?: number): Promise<Department[]>;
}

export class DepartmentRepository implements IDepartmentRepository {
  async findAll(academicYearId?: number): Promise<Department[]> {
    return prisma.department.findMany({
      where: { isActive: true },
      include: {
        departmentConstraints: academicYearId
          ? { where: { academicYearId }, take: 1 }
          : { take: 1 },
      },
      orderBy: { name: 'asc' },
    });
  }
}
