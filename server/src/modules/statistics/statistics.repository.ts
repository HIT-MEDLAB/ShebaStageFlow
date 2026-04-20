import prisma from '../../lib/prisma';

export interface DepartmentWithCapacity {
  id: number;
  name: string;
  departmentConstraints: {
    morningCapacity: number;
    eveningCapacity: number;
    electiveCapacity: number;
  }[];
}

export interface AssignmentRow {
  departmentId: number;
  universityId: number;
  shiftType: string;
  type: string;
  startDate: Date;
  studentCount: number | null;
  department: { name: string };
  university: { name: string };
  _count: { students: number };
}

export interface IStatisticsRepository {
  getDepartmentCapacities(academicYearId: number): Promise<DepartmentWithCapacity[]>;
  getApprovedAssignments(
    academicYearId: number,
    startDate?: Date,
    endDate?: Date,
  ): Promise<AssignmentRow[]>;
}

export class StatisticsRepository implements IStatisticsRepository {
  async getDepartmentCapacities(academicYearId: number): Promise<DepartmentWithCapacity[]> {
    return prisma.department.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        departmentConstraints: {
          where: { blockedStartDate: null, academicYearId },
          take: 1,
          select: {
            morningCapacity: true,
            eveningCapacity: true,
            electiveCapacity: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async getApprovedAssignments(
    academicYearId: number,
    startDate?: Date,
    endDate?: Date,
  ): Promise<AssignmentRow[]> {
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
        departmentId: true,
        universityId: true,
        shiftType: true,
        type: true,
        startDate: true,
        studentCount: true,
        department: { select: { name: true } },
        university: { select: { name: true } },
        _count: { select: { students: true } },
      },
    }) as unknown as AssignmentRow[];
  }
}
