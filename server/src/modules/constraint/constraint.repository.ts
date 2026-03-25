import prisma from '../../lib/prisma';
import type { DepartmentConstraint, IronConstraint, Holiday } from '@prisma/client';

export interface IConstraintRepository {
  findDepartmentConstraints(): Promise<(DepartmentConstraint & { department: { id: number; name: string } })[]>;
  findIronConstraints(activeOnly?: boolean): Promise<IronConstraint[]>;
  findHolidays(years: number[]): Promise<Holiday[]>;
}

export class ConstraintRepository implements IConstraintRepository {
  async findDepartmentConstraints() {
    return prisma.departmentConstraint.findMany({
      include: { department: { select: { id: true, name: true } } },
    });
  }

  async findIronConstraints(activeOnly?: boolean): Promise<IronConstraint[]> {
    return prisma.ironConstraint.findMany({
      where: activeOnly ? { isActive: true } : undefined,
    });
  }

  async findHolidays(years: number[]): Promise<Holiday[]> {
    return prisma.holiday.findMany({
      where: { year: { in: years } },
      orderBy: { date: 'asc' },
    });
  }
}
