import type { IHomeRepository, HomeAssignmentRow } from './home.repository';

export interface HomeStatsDto {
  activeStudents: number;
  morningRotations: number;
  eveningRotations: number;
  activeDepartments: number;
}

export interface UniversityRowDto {
  universityId: number;
  universityName: string;
  totalStudents: number;
  morningRotations: number;
  eveningRotations: number;
}

export interface HomeResponse {
  stats: HomeStatsDto;
  universityRows: UniversityRowDto[];
}

export class HomeService {
  constructor(private readonly repository: IHomeRepository) {}

  async getSummary(
    academicYearId: number,
    timeframe: 'weekly' | 'yearly',
    weekStart?: string,
    weekEnd?: string,
  ): Promise<HomeResponse> {
    const startDate = timeframe === 'weekly' && weekStart ? new Date(weekStart) : undefined;
    const endDate = timeframe === 'weekly' && weekEnd ? new Date(weekEnd) : undefined;

    const [assignments, activeDepartments] = await Promise.all([
      this.repository.getApprovedAssignments(academicYearId, startDate, endDate),
      this.repository.getActiveDepartmentCount(startDate, endDate),
    ]);

    const stats = this.computeStats(assignments, activeDepartments);
    const universityRows = this.groupByUniversity(assignments);

    return { stats, universityRows };
  }

  private computeStats(assignments: HomeAssignmentRow[], activeDepartments: number): HomeStatsDto {
    let activeStudents = 0;
    let morningRotations = 0;
    let eveningRotations = 0;

    for (const a of assignments) {
      const studentCount = a._count.students > 0 ? a._count.students : (a.studentCount ?? 0);
      activeStudents += studentCount;

      if (a.shiftType === 'MORNING') {
        morningRotations++;
      } else if (a.shiftType === 'EVENING') {
        eveningRotations++;
      }
    }

    return { activeStudents, morningRotations, eveningRotations, activeDepartments };
  }

  private groupByUniversity(assignments: HomeAssignmentRow[]): UniversityRowDto[] {
    const map = new Map<number, UniversityRowDto>();

    for (const a of assignments) {
      const existing = map.get(a.universityId) ?? {
        universityId: a.universityId,
        universityName: a.university.name,
        totalStudents: 0,
        morningRotations: 0,
        eveningRotations: 0,
      };

      const studentCount = a._count.students > 0 ? a._count.students : (a.studentCount ?? 0);
      existing.totalStudents += studentCount;

      if (a.shiftType === 'MORNING') {
        existing.morningRotations++;
      } else if (a.shiftType === 'EVENING') {
        existing.eveningRotations++;
      }

      map.set(a.universityId, existing);
    }

    return Array.from(map.values()).sort((a, b) => b.totalStudents - a.totalStudents);
  }
}
