import type { IStatisticsRepository, DepartmentWithCapacity, AssignmentRow } from './statistics.repository';

export interface DepartmentScheduledWeeksDto {
  departmentId: number;
  departmentName: string;
  scheduledWeeks: number;
}

export interface DepartmentStudentCountDto {
  departmentId: number;
  departmentName: string;
  studentCount: number;
}

export interface DepartmentCapacityPercentageDto {
  departmentId: number;
  departmentName: string;
  percentage: number;
  scheduledWeeks: number;
  totalCapacity: number;
}

export interface UniversityWeekCountDto {
  universityId: number;
  universityName: string;
  weekCount: number;
}

export interface StatisticsResponse {
  departmentScheduledWeeks: DepartmentScheduledWeeksDto[];
  departmentStudentCount: DepartmentStudentCountDto[];
  departmentCapacityPercentage: DepartmentCapacityPercentageDto[];
  universityWeekCount: UniversityWeekCountDto[];
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
      this.repository.getDepartmentCapacities(academicYearId),
      this.repository.getApprovedAssignments(academicYearId, startDate, endDate),
    ]);

    const totalWeeks = startDate && endDate
      ? this.computeTotalWeeksInPeriod(startDate, endDate)
      : 0;

    return {
      departmentScheduledWeeks: this.computeDepartmentScheduledWeeks(departments, assignments),
      departmentStudentCount: this.computeDepartmentStudentCount(departments, assignments),
      departmentCapacityPercentage: this.computeCapacityPercentage(departments, assignments, totalWeeks),
      universityWeekCount: this.computeUniversityWeekCount(assignments),
    };
  }

  private computeTotalWeeksInPeriod(start: Date, end: Date): number {
    const d = new Date(start);
    while (d.getDay() !== 0) d.setDate(d.getDate() + 1);
    let count = 0;
    while (d <= end) {
      count++;
      d.setDate(d.getDate() + 7);
    }
    return count;
  }

  private computeDepartmentScheduledWeeks(
    departments: DepartmentWithCapacity[],
    assignments: AssignmentRow[],
  ): DepartmentScheduledWeeksDto[] {
    const weekMap = new Map<number, Set<string>>();

    for (const a of assignments) {
      if (a.type !== 'GROUP') continue;
      const key = new Date(a.startDate).toISOString().split('T')[0];
      if (!weekMap.has(a.departmentId)) weekMap.set(a.departmentId, new Set());
      weekMap.get(a.departmentId)!.add(key);
    }

    return departments.map((dept) => ({
      departmentId: dept.id,
      departmentName: dept.name,
      scheduledWeeks: weekMap.get(dept.id)?.size ?? 0,
    }));
  }

  private computeDepartmentStudentCount(
    departments: DepartmentWithCapacity[],
    assignments: AssignmentRow[],
  ): DepartmentStudentCountDto[] {
    const countMap = new Map<number, number>();

    for (const a of assignments) {
      const students = a._count.students > 0 ? a._count.students : (a.studentCount ?? 0);
      countMap.set(a.departmentId, (countMap.get(a.departmentId) ?? 0) + students);
    }

    return departments.map((dept) => ({
      departmentId: dept.id,
      departmentName: dept.name,
      studentCount: countMap.get(dept.id) ?? 0,
    }));
  }

  private computeCapacityPercentage(
    departments: DepartmentWithCapacity[],
    assignments: AssignmentRow[],
    totalWeeks: number,
  ): DepartmentCapacityPercentageDto[] {
    const weekMap = new Map<number, Set<string>>();

    for (const a of assignments) {
      if (a.type !== 'GROUP') continue;
      const key = new Date(a.startDate).toISOString().split('T')[0];
      if (!weekMap.has(a.departmentId)) weekMap.set(a.departmentId, new Set());
      weekMap.get(a.departmentId)!.add(key);
    }

    return departments.map((dept) => {
      const constraint = dept.departmentConstraints[0];
      const morningCap = constraint?.morningCapacity ?? 0;
      const eveningCap = constraint?.eveningCapacity ?? 0;
      const totalCapacity = totalWeeks * (morningCap + eveningCap);
      const scheduledWeeks = weekMap.get(dept.id)?.size ?? 0;
      const percentage = totalCapacity > 0
        ? Math.round((scheduledWeeks / totalCapacity) * 100)
        : 0;

      return {
        departmentId: dept.id,
        departmentName: dept.name,
        percentage: Math.min(percentage, 100),
        scheduledWeeks,
        totalCapacity,
      };
    });
  }

  private computeUniversityWeekCount(assignments: AssignmentRow[]): UniversityWeekCountDto[] {
    const uniMap = new Map<number, { name: string; weeks: Set<string> }>();

    for (const a of assignments) {
      const key = new Date(a.startDate).toISOString().split('T')[0];
      if (!uniMap.has(a.universityId)) {
        uniMap.set(a.universityId, { name: a.university.name, weeks: new Set() });
      }
      uniMap.get(a.universityId)!.weeks.add(key);
    }

    return Array.from(uniMap.entries())
      .map(([universityId, { name, weeks }]) => ({
        universityId,
        universityName: name,
        weekCount: weeks.size,
      }))
      .sort((a, b) => b.weekCount - a.weekCount);
  }
}
