import prisma from '../../../lib/prisma';
import { ConstraintEngine } from '../validation/constraintEngine';

const engine = new ConstraintEngine();

function getWeekKey(deptId: number, shiftType: string, weekStart: string): string {
  return `${deptId}:${shiftType}:${weekStart}`;
}

function getSundayOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getThursdayOfWeek(sunday: Date): Date {
  const d = new Date(sunday);
  d.setDate(d.getDate() + 4);
  d.setHours(0, 0, 0, 0);
  return d;
}

function computeAllWeeks(startDate: Date, endDate: Date): Array<{ startDate: Date; endDate: Date }> {
  const weeks: Array<{ startDate: Date; endDate: Date }> = [];
  let current = getSundayOfWeek(startDate);

  while (current <= endDate) {
    const thursday = getThursdayOfWeek(current);
    if (thursday >= startDate && current <= endDate) {
      weeks.push({ startDate: new Date(current), endDate: new Date(thursday) });
    }
    current.setDate(current.getDate() + 7);
  }

  return weeks;
}

export async function findSuggestedWeeks(
  departmentId: number,
  shiftType: 'MORNING' | 'EVENING',
  type: 'GROUP' | 'ELECTIVE',
  universityId: number,
  originStartDate: Date,
  academicYear: { startDate: Date; endDate: Date },
  studentCount: number | null,
  yearInProgram: number,
  excludeAssignmentIds: number[],
  virtuallyOccupied: Set<string>,
  maxResults = 3,
): Promise<Array<{ startDate: Date; endDate: Date }>> {
  const allWeeks = computeAllWeeks(academicYear.startDate, academicYear.endDate);

  // Sort by distance from origin date
  const originTime = originStartDate.getTime();
  allWeeks.sort(
    (a, b) =>
      Math.abs(a.startDate.getTime() - originTime) -
      Math.abs(b.startDate.getTime() - originTime),
  );

  const results: Array<{ startDate: Date; endDate: Date }> = [];

  for (const week of allWeeks) {
    // Skip the original week
    if (week.startDate.getTime() === originTime) continue;

    // Check virtual occupation
    const key = getWeekKey(departmentId, shiftType, week.startDate.toISOString());
    if (virtuallyOccupied.has(key)) continue;

    // Check holidays
    const holiday = await prisma.holiday.findFirst({
      where: {
        isActive: true,
        date: { gte: week.startDate, lte: week.endDate },
      },
    });
    if (holiday) continue;

    // Check date constraints
    const dateConstraint = await prisma.dateConstraint.findFirst({
      where: {
        isActive: true,
        startDate: { lte: week.endDate },
        endDate: { gte: week.startDate },
      },
    });
    if (dateConstraint) continue;

    // Check department blocked dates
    const deptConstraint = await prisma.departmentConstraint.findFirst({
      where: { departmentId },
    });
    if (
      deptConstraint?.blockedStartDate &&
      deptConstraint?.blockedEndDate &&
      week.startDate <= deptConstraint.blockedEndDate &&
      week.endDate >= deptConstraint.blockedStartDate
    ) {
      continue;
    }

    // Run constraint engine
    try {
      await engine.validate({
        departmentId,
        universityId,
        startDate: week.startDate,
        endDate: week.endDate,
        type,
        shiftType,
        studentCount,
        yearInProgram,
        excludeAssignmentIds,
      });
      // No error → valid week
      results.push(week);
      if (results.length >= maxResults) break;
    } catch {
      // Constraint violation → skip
      continue;
    }
  }

  return results;
}
