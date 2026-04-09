import type { IStatisticsRepository, DepartmentWithCapacity, AssignmentRow } from './statistics.repository';

export interface DepartmentCapacityDto {
  departmentId: number;
  departmentName: string;
  morningCapacity: number;
  eveningCapacity: number;
  electiveCapacity: number;
  totalCapacity: number;
}

export interface DepartmentUtilizationDto {
  departmentId: number;
  departmentName: string;
  morningActual: number;
  eveningActual: number;
  morningCapacity: number;
  eveningCapacity: number;
}

export interface StudentEnrollmentDto {
  universityId: number;
  universityName: string;
  studentCount: number;
}

export interface UtilizationGaugeDto {
  departmentId: number;
  departmentName: string;
  percentage: number;
  actual: number;
  capacity: number;
}

export interface StatisticsResponse {
  departmentCapacities: DepartmentCapacityDto[];
  departmentUtilization: DepartmentUtilizationDto[];
  studentEnrollment: StudentEnrollmentDto[];
  utilizationGauges: UtilizationGaugeDto[];
}

export class StatisticsService {
  constructor(private readonly repository: IStatisticsRepository) {}

  async getStatistics(
    academicYearId: number,
    timeframe: 'weekly' | 'calendarYear' | 'academicYear',
    weekStart?: string,
    weekEnd?: string,
  ): Promise<StatisticsResponse> {
    const startDate = weekStart ? new Date(weekStart) : undefined;
    const endDate = weekEnd ? new Date(weekEnd) : undefined;

    const [departments, assignments] = await Promise.all([
      this.repository.getDepartmentCapacities(),
      this.repository.getApprovedAssignments(academicYearId, startDate, endDate),
    ]);

    const departmentCapacities = this.formatCapacities(departments);
    const departmentUtilization = this.formatUtilization(departments, assignments);
    const studentEnrollment = this.formatStudentEnrollment(assignments);
    const utilizationGauges = this.computeUtilizationGauges(departments, assignments);

    return {
      departmentCapacities,
      departmentUtilization,
      studentEnrollment,
      utilizationGauges,
    };
  }

  private formatCapacities(departments: DepartmentWithCapacity[]): DepartmentCapacityDto[] {
    return departments.map((dept) => {
      const constraint = dept.departmentConstraints[0];
      const morning = constraint?.morningCapacity ?? 0;
      const evening = constraint?.eveningCapacity ?? 0;
      const elective = constraint?.electiveCapacity ?? 0;

      return {
        departmentId: dept.id,
        departmentName: dept.name,
        morningCapacity: morning,
        eveningCapacity: evening,
        electiveCapacity: elective,
        totalCapacity: morning + evening + elective,
      };
    });
  }

  private formatUtilization(
    departments: DepartmentWithCapacity[],
    assignments: AssignmentRow[],
  ): DepartmentUtilizationDto[] {
    const countMap = new Map<number, { morning: number; evening: number }>();

    for (const a of assignments) {
      const existing = countMap.get(a.departmentId) ?? { morning: 0, evening: 0 };
      if (a.shiftType === 'MORNING') {
        existing.morning++;
      } else if (a.shiftType === 'EVENING') {
        existing.evening++;
      }
      countMap.set(a.departmentId, existing);
    }

    return departments.map((dept) => {
      const constraint = dept.departmentConstraints[0];
      const counts = countMap.get(dept.id) ?? { morning: 0, evening: 0 };

      return {
        departmentId: dept.id,
        departmentName: dept.name,
        morningActual: counts.morning,
        eveningActual: counts.evening,
        morningCapacity: constraint?.morningCapacity ?? 0,
        eveningCapacity: constraint?.eveningCapacity ?? 0,
      };
    });
  }

  private formatStudentEnrollment(assignments: AssignmentRow[]): StudentEnrollmentDto[] {
    const universityMap = new Map<number, { name: string; count: number }>();

    for (const a of assignments) {
      const existing = universityMap.get(a.universityId) ?? { name: a.university.name, count: 0 };
      const studentCount = a._count.students > 0 ? a._count.students : (a.studentCount ?? 0);
      existing.count += studentCount;
      universityMap.set(a.universityId, existing);
    }

    return Array.from(universityMap.entries())
      .map(([universityId, { name, count }]) => ({
        universityId,
        universityName: name,
        studentCount: count,
      }))
      .sort((a, b) => b.studentCount - a.studentCount);
  }

  private computeUtilizationGauges(
    departments: DepartmentWithCapacity[],
    assignments: AssignmentRow[],
  ): UtilizationGaugeDto[] {
    const countMap = new Map<number, number>();

    for (const a of assignments) {
      countMap.set(a.departmentId, (countMap.get(a.departmentId) ?? 0) + 1);
    }

    return departments.map((dept) => {
      const constraint = dept.departmentConstraints[0];
      const capacity = (constraint?.morningCapacity ?? 0) + (constraint?.eveningCapacity ?? 0);
      const actual = countMap.get(dept.id) ?? 0;
      const percentage = capacity > 0 ? Math.round((actual / capacity) * 100) : 0;

      return {
        departmentId: dept.id,
        departmentName: dept.name,
        percentage: Math.min(percentage, 100),
        actual,
        capacity,
      };
    });
  }
}
