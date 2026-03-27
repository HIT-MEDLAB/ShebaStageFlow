import prisma from '../../lib/prisma';

export interface HomeAssignmentRow {
  universityId: number;
  shiftType: string;
  studentCount: number | null;
  university: { name: string };
  _count: { students: number };
}

export interface IHomeRepository {
  getApprovedAssignments(
    academicYearId: number,
    startDate?: Date,
    endDate?: Date,
  ): Promise<HomeAssignmentRow[]>;
  getActiveDepartmentCount(startDate?: Date, endDate?: Date): Promise<number>;
}

export class HomeRepository implements IHomeRepository {
  async getApprovedAssignments(
    academicYearId: number,
    startDate?: Date,
    endDate?: Date,
  ): Promise<HomeAssignmentRow[]> {
    const where: Record<string, unknown> = {
      academicYearId,
      status: 'APPROVED',
    };

    if (startDate && endDate) {
      where.startDate = { lte: endDate };
      where.endDate = { gte: startDate };
    }

    return prisma.assignment.findMany({
      where,
      select: {
        universityId: true,
        shiftType: true,
        studentCount: true,
        university: { select: { name: true } },
        _count: { select: { students: true } },
      },
    }) as unknown as HomeAssignmentRow[];
  }

  async getActiveDepartmentCount(startDate?: Date, endDate?: Date): Promise<number> {
    const where: Record<string, unknown> = { isActive: true };

    if (startDate && endDate) {
      where.departmentConstraints = {
        none: {
          blockedStartDate: { not: null, lte: endDate },
          blockedEndDate: { not: null, gte: startDate },
        },
      };
    }

    return prisma.department.count({ where });
  }
}
