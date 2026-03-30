import prisma from '../../../lib/prisma';
import { NameResolver } from './nameResolver';
import { findSuggestedWeeks } from './suggestionEngine';
import { ConstraintEngine } from '../validation/constraintEngine';
import { ConstraintValidationError } from '../../../shared/errors/ConstraintValidationError';
import type { SmartImportRow, ImportValidationResult, ImportRowResult } from './importTypes';
import type { CreateAssignmentDto } from '../assignment.schema';

const engine = new ConstraintEngine();

function getWeekKey(deptId: number, shiftType: string, startDate: Date): string {
  return `${deptId}:${shiftType}:${startDate.toISOString()}`;
}

export class ImportValidationService {
  async validate(
    rows: SmartImportRow[],
    academicYearId: number,
  ): Promise<ImportValidationResult> {
    const resolver = new NameResolver();
    await resolver.init();

    const academicYear = await prisma.academicYear.findUnique({
      where: { id: academicYearId },
    });
    if (!academicYear) {
      return { rows: rows.map((_, i) => ({
        rowIndex: i,
        status: 'parse_error' as const,
        parseErrors: ['Academic year not found'],
      }))};
    }

    // Virtual state: tracks provisionally placed GROUP rows
    const virtuallyOccupied = new Set<string>();
    // Track IDs that are virtually displaced (so later rows don't try to bump them again)
    const virtuallyDisplacedIds = new Set<number>();

    // Pre-flight: check if any iron constraints are configured
    const activeIronConstraints = await prisma.ironConstraint.findMany({
      where: { isActive: true },
    });
    const globalWarnings: string[] = [];
    if (activeIronConstraints.length === 0) {
      globalWarnings.push('grid.warning.noConstraintsConfigured');
    }

    const results: ImportRowResult[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const result = await this.processRow(
        row,
        i,
        academicYearId,
        academicYear,
        resolver,
        virtuallyOccupied,
        virtuallyDisplacedIds,
      );
      results.push(result);
    }

    return { rows: results, globalWarnings: globalWarnings.length > 0 ? globalWarnings : undefined };
  }

  private async processRow(
    row: SmartImportRow,
    rowIndex: number,
    academicYearId: number,
    academicYear: { startDate: Date; endDate: Date },
    resolver: NameResolver,
    virtuallyOccupied: Set<string>,
    virtuallyDisplacedIds: Set<number>,
  ): Promise<ImportRowResult> {
    // 1. Parse & resolve names
    const parseErrors: string[] = [];

    const dept = resolver.resolveDepartment(row.departmentName);
    if (!dept) parseErrors.push(`Department not found: "${row.departmentName}"`);

    const universityId = resolver.resolveUniversity(row.universityName);
    if (!universityId) parseErrors.push(`University not found: "${row.universityName}"`);

    const shiftType = NameResolver.resolveShiftType(row.shiftType);
    if (!shiftType) parseErrors.push(`Invalid shift type: "${row.shiftType}"`);

    const { type: assignmentType, yearInProgram } = NameResolver.resolvePlacementType(
      row.placementType,
      row.yearInProgram,
    );

    if (parseErrors.length > 0) {
      return { rowIndex, status: 'parse_error', parseErrors };
    }

    // 1.5 Check department supports this shift type
    const shiftAvailable = shiftType === 'MORNING' ? dept!.hasMorningShift : dept!.hasEveningShift;
    if (!shiftAvailable) {
      return {
        rowIndex,
        status: 'failed',
        resolvedDto: {
          departmentId: dept!.id,
          universityId: universityId!,
          academicYearId,
          startDate: row.startDate,
          endDate: row.endDate,
          type: assignmentType,
          shiftType: shiftType!,
          studentCount: row.studentCount ?? null,
          yearInProgram,
          tutorName: row.tutorName ?? null,
        },
        failureReason: 'grid.blocked.shiftUnavailable',
      };
    }

    const dto: CreateAssignmentDto = {
      departmentId: dept!.id,
      universityId: universityId!,
      academicYearId,
      startDate: row.startDate,
      endDate: row.endDate,
      type: assignmentType,
      shiftType: shiftType!,
      studentCount: row.studentCount ?? null,
      yearInProgram,
      tutorName: row.tutorName ?? null,
    };

    // 2. Check holidays
    const holiday = await prisma.holiday.findFirst({
      where: {
        isActive: true,
        date: { gte: dto.startDate, lte: dto.endDate },
      },
    });
    if (holiday) {
      const suggestions = await findSuggestedWeeks(
        dto.departmentId, dto.shiftType, dto.type, dto.universityId,
        dto.startDate, academicYear, dto.studentCount ?? null,
        dto.yearInProgram, [], virtuallyOccupied,
      );
      return {
        rowIndex,
        status: 'failed',
        resolvedDto: dto,
        failureReason: 'grid.blocked.holiday',
        suggestedWeeks: suggestions.map((w) => ({
          startDate: w.startDate.toISOString(),
          endDate: w.endDate.toISOString(),
        })),
      };
    }

    // 3. Check date constraints
    const dateConstraint = await prisma.dateConstraint.findFirst({
      where: {
        isActive: true,
        startDate: { lte: dto.endDate },
        endDate: { gte: dto.startDate },
      },
    });
    if (dateConstraint) {
      const suggestions = await findSuggestedWeeks(
        dto.departmentId, dto.shiftType, dto.type, dto.universityId,
        dto.startDate, academicYear, dto.studentCount ?? null,
        dto.yearInProgram, [], virtuallyOccupied,
      );
      return {
        rowIndex,
        status: 'failed',
        resolvedDto: dto,
        failureReason: 'grid.blocked.dateConstraint',
        failureParams: { name: dateConstraint.name },
        suggestedWeeks: suggestions.map((w) => ({
          startDate: w.startDate.toISOString(),
          endDate: w.endDate.toISOString(),
        })),
      };
    }

    // 4. Check department blocked dates
    const deptConstraint = await prisma.departmentConstraint.findFirst({
      where: { departmentId: dto.departmentId },
    });
    if (
      deptConstraint?.blockedStartDate &&
      deptConstraint?.blockedEndDate &&
      dto.startDate <= deptConstraint.blockedEndDate &&
      dto.endDate >= deptConstraint.blockedStartDate
    ) {
      const suggestions = await findSuggestedWeeks(
        dto.departmentId, dto.shiftType, dto.type, dto.universityId,
        dto.startDate, academicYear, dto.studentCount ?? null,
        dto.yearInProgram, [], virtuallyOccupied,
      );
      return {
        rowIndex,
        status: 'failed',
        resolvedDto: dto,
        failureReason: 'grid.blocked.dateBlock',
        suggestedWeeks: suggestions.map((w) => ({
          startDate: w.startDate.toISOString(),
          endDate: w.endDate.toISOString(),
        })),
      };
    }

    // 5. Check virtual occupation (earlier import row already claimed this slot)
    if (dto.type === 'GROUP') {
      const key = getWeekKey(dto.departmentId, dto.shiftType, dto.startDate);
      if (virtuallyOccupied.has(key)) {
        const suggestions = await findSuggestedWeeks(
          dto.departmentId, dto.shiftType, dto.type, dto.universityId,
          dto.startDate, academicYear, dto.studentCount ?? null,
          dto.yearInProgram, [], virtuallyOccupied,
        );
        return {
          rowIndex,
          status: 'failed',
          resolvedDto: dto,
          failureReason: 'grid.blocked.oneGroupPerShift',
          suggestedWeeks: suggestions.map((w) => ({
            startDate: w.startDate.toISOString(),
            endDate: w.endDate.toISOString(),
          })),
        };
      }
    }

    // 5.5 Check for duplicate assignment already in the database
    const existingDuplicate = await prisma.assignment.findFirst({
      where: {
        departmentId: dto.departmentId,
        universityId: dto.universityId,
        type: dto.type,
        shiftType: dto.shiftType,
        status: { in: ['APPROVED', 'PENDING'] },
        startDate: { lte: dto.endDate },
        endDate: { gte: dto.startDate },
      },
    });
    if (existingDuplicate) {
      return {
        rowIndex,
        status: 'failed',
        resolvedDto: dto,
        failureReason: 'grid.blocked.duplicateAssignment',
      };
    }

    // 6. Run constraint engine
    try {
      const engineWarnings = await engine.validate({
        departmentId: dto.departmentId,
        universityId: dto.universityId,
        startDate: dto.startDate,
        endDate: dto.endDate,
        type: dto.type,
        shiftType: dto.shiftType,
        studentCount: dto.studentCount,
        yearInProgram: dto.yearInProgram,
      });

      const warnings: string[] = engineWarnings.map(w => w.messageKey);

      // 7. Check soft constraints
      const softConstraints = await prisma.softConstraint.findMany({
        where: {
          isActive: true,
          OR: [
            { departmentId: dto.departmentId },
            { departmentId: null },
          ],
          AND: [
            { OR: [{ startDate: null }, { startDate: { lte: dto.endDate } }] },
            { OR: [{ endDate: null }, { endDate: { gte: dto.startDate } }] },
          ],
        },
      });
      if (softConstraints.length > 0) {
        return {
          rowIndex,
          status: 'failed' as const,
          failureReason: 'validation.softConstraintBlocked',
          failureParams: { name: softConstraints.map(sc => sc.name).join(', ') },
        };
      }

      // Success — track virtual state for GROUP
      if (dto.type === 'GROUP') {
        virtuallyOccupied.add(getWeekKey(dto.departmentId, dto.shiftType, dto.startDate));
      }

      return { rowIndex, status: 'success', resolvedDto: dto, warnings: warnings.length > 0 ? warnings : undefined };
    } catch (err) {
      if (!(err instanceof ConstraintValidationError)) throw err;

      const violations = err.errors;
      const oneGroupViolation = violations.find((v) => v.code === 'ONE_GROUP_PER_SHIFT');

      if (oneGroupViolation && dto.type === 'GROUP') {
        // Try to bump the conflicting assignment
        return this.tryBump(
          dto, rowIndex, academicYear,
          virtuallyOccupied, virtuallyDisplacedIds,
        );
      }

      // Other constraint violations → failed
      const primary = violations[0] ?? err.warnings[0];
      const suggestions = await findSuggestedWeeks(
        dto.departmentId, dto.shiftType, dto.type, dto.universityId,
        dto.startDate, academicYear, dto.studentCount ?? null,
        dto.yearInProgram, [], virtuallyOccupied,
      );
      return {
        rowIndex,
        status: 'failed',
        resolvedDto: dto,
        failureReason: primary?.messageKey ?? 'Constraint violation',
        failureParams: primary?.params as Record<string, string | number> | undefined,
        suggestedWeeks: suggestions.map((w) => ({
          startDate: w.startDate.toISOString(),
          endDate: w.endDate.toISOString(),
        })),
      };
    }
  }

  private async tryBump(
    dto: CreateAssignmentDto,
    rowIndex: number,
    academicYear: { startDate: Date; endDate: Date },
    virtuallyOccupied: Set<string>,
    virtuallyDisplacedIds: Set<number>,
  ): Promise<ImportRowResult> {
    // Find the conflicting assignment
    const overlapping = await prisma.assignment.findMany({
      where: {
        departmentId: dto.departmentId,
        type: 'GROUP',
        shiftType: dto.shiftType,
        status: { in: ['APPROVED', 'PENDING'] },
        startDate: { lte: dto.endDate },
        endDate: { gte: dto.startDate },
        id: { notIn: [...virtuallyDisplacedIds] },
      },
      include: {
        university: { select: { name: true, priority: true } },
        department: { select: { name: true } },
      },
    });

    if (overlapping.length === 0) {
      // Virtual conflict only — already checked above
      return {
        rowIndex,
        status: 'failed',
        resolvedDto: dto,
        failureReason: 'grid.blocked.oneGroupPerShift',
      };
    }

    const existing = overlapping[0];
    const incomingUniversity = await prisma.university.findUnique({
      where: { id: dto.universityId },
      select: { priority: true },
    });

    if (!incomingUniversity) {
      return {
        rowIndex,
        status: 'failed',
        resolvedDto: dto,
        failureReason: 'grid.blocked.oneGroupPerShift',
      };
    }

    // Lower priority number = higher priority
    const incomingPriority = incomingUniversity.priority;
    const existingPriority = existing.university.priority;

    if (incomingPriority >= existingPriority) {
      // Incoming does NOT have higher priority → fail
      const suggestions = await findSuggestedWeeks(
        dto.departmentId, dto.shiftType, dto.type, dto.universityId,
        dto.startDate, academicYear, dto.studentCount ?? null,
        dto.yearInProgram, [], virtuallyOccupied,
      );
      return {
        rowIndex,
        status: 'failed',
        resolvedDto: dto,
        failureReason: incomingPriority === existingPriority
          ? 'grid.blocked.samePriority'
          : 'grid.blocked.lowerPriority',
        suggestedWeeks: suggestions.map((w) => ({
          startDate: w.startDate.toISOString(),
          endDate: w.endDate.toISOString(),
        })),
      };
    }

    // Incoming has higher priority → bump
    const suggestionsForDisplaced = await findSuggestedWeeks(
      existing.departmentId, existing.shiftType, existing.type,
      existing.universityId, existing.startDate, academicYear,
      existing.studentCount, existing.yearInProgram ?? 1,
      [existing.id], virtuallyOccupied,
    );

    // Track virtual state
    virtuallyOccupied.add(getWeekKey(dto.departmentId, dto.shiftType, dto.startDate));
    virtuallyDisplacedIds.add(existing.id);

    return {
      rowIndex,
      status: 'bumped',
      resolvedDto: dto,
      bumpedAssignment: {
        id: existing.id,
        departmentId: existing.departmentId,
        universityId: existing.universityId,
        universityName: existing.university.name,
        departmentName: existing.department.name,
        startDate: existing.startDate.toISOString(),
        endDate: existing.endDate.toISOString(),
        shiftType: existing.shiftType,
        type: existing.type,
        studentCount: existing.studentCount,
        yearInProgram: existing.yearInProgram ?? 1,
      },
      suggestedWeeks: suggestionsForDisplaced.map((w) => ({
        startDate: w.startDate.toISOString(),
        endDate: w.endDate.toISOString(),
      })),
    };
  }
}
