import prisma from '../../lib/prisma';
import type { Assignment } from '@prisma/client';
import { Prisma } from '@prisma/client';
import type {
  CreateAssignmentDto,
  UpdateAssignmentDto,
  MoveAssignmentDto,
  AddStudentDto,
} from './assignment.schema';

export interface AssignmentFilters {
  universityId?: number[];
  shiftType?: 'MORNING' | 'EVENING';
  yearInProgram?: number;
  status?: 'PENDING' | 'APPROVED' | 'REJECTED' | ('PENDING' | 'APPROVED' | 'REJECTED')[];
}

export interface PendingMoveData {
  originalDeptId: number;
  originalStart: string;
  originalEnd: string;
  displacedId: number;
  displacedOrigDeptId: number;
  displacedOrigStart: string;
  displacedOrigEnd: string;
}

export interface DisplaceParams {
  departmentId: number;
  startDate: Date;
  endDate: Date;
  displacedAssignmentId: number;
  displacedDepartmentId: number;
  displacedStartDate: Date;
  displacedEndDate: Date;
}

export interface IAssignmentRepository {
  findByAcademicYear(academicYearId: number, filters?: AssignmentFilters): Promise<unknown[]>;
  findById(id: number): Promise<unknown | null>;
  create(data: CreateAssignmentDto, createdById: number, status?: 'PENDING' | 'APPROVED', approvedById?: number): Promise<Assignment>;
  update(id: number, data: UpdateAssignmentDto): Promise<Assignment>;
  move(id: number, departmentId: number, startDate: Date, endDate: Date, status?: 'PENDING' | 'APPROVED', approvedById?: number): Promise<Assignment>;
  remove(id: number): Promise<Assignment>;
  bulkCreate(data: CreateAssignmentDto[], createdById: number): Promise<{ count: number }>;
  addStudent(assignmentId: number, studentData: AddStudentDto): Promise<unknown>;
  removeStudent(assignmentId: number, studentId: number): Promise<unknown>;
  bulkAddStudents(assignmentId: number, students: AddStudentDto[]): Promise<unknown[]>;
  approve(id: number, approvedById: number): Promise<Assignment>;
  reject(id: number, rejectionReason?: string): Promise<Assignment>;
  displace(incomingId: number, params: DisplaceParams, status: 'PENDING' | 'APPROVED', pendingMoveData?: PendingMoveData, approvedById?: number): Promise<Assignment>;
  rejectAndRevert(id: number, pendingMoveData: PendingMoveData): Promise<void>;
  findOverlapping(departmentId: number, startDate: Date, endDate: Date, shiftType: 'MORNING' | 'EVENING', excludeId?: number): Promise<Assignment[]>;
  findStudentAssignments(studentId: number, excludeAssignmentId?: number): Promise<Assignment[]>;
  findStudentByNationalId?(nationalId: string): Promise<{ id: number } | null>;
}

export class AssignmentRepository implements IAssignmentRepository {
  async findByAcademicYear(academicYearId: number, filters?: AssignmentFilters) {
    const where: Record<string, unknown> = { academicYearId };

    if (filters?.universityId && filters.universityId.length > 0) {
      where.universityId = { in: filters.universityId };
    }
    if (filters?.shiftType) {
      where.shiftType = filters.shiftType;
    }
    if (filters?.yearInProgram) {
      where.yearInProgram = filters.yearInProgram;
    }
    if (filters?.status) {
      where.status = Array.isArray(filters.status) ? { in: filters.status } : filters.status;
    }

    return prisma.assignment.findMany({
      where,
      include: {
        university: { select: { name: true } },
        department: { select: { name: true } },
        createdBy: { select: { name: true, email: true } },
      },
      orderBy: { startDate: 'asc' },
    });
  }

  async findById(id: number) {
    return prisma.assignment.findUnique({
      where: { id },
      include: {
        university: { select: { name: true } },
        department: { select: { name: true } },
        students: {
          include: {
            student: true,
          },
        },
      },
    });
  }

  async create(data: CreateAssignmentDto, createdById: number, status?: 'PENDING' | 'APPROVED', approvedById?: number): Promise<Assignment> {
    return prisma.assignment.create({
      data: {
        departmentId: data.departmentId,
        universityId: data.universityId,
        academicYearId: data.academicYearId,
        startDate: data.startDate,
        endDate: data.endDate,
        type: data.type,
        shiftType: data.shiftType,
        studentCount: data.studentCount ?? null,
        yearInProgram: data.yearInProgram,
        tutorName: data.tutorName ?? null,
        createdById,
        ...(status && { status }),
        ...(approvedById && { approvedById }),
      },
      include: {
        university: { select: { name: true } },
        department: { select: { name: true } },
      },
    });
  }

  async update(id: number, data: UpdateAssignmentDto): Promise<Assignment> {
    return prisma.assignment.update({
      where: { id },
      data,
      include: {
        university: { select: { name: true } },
        department: { select: { name: true } },
      },
    });
  }

  async move(id: number, departmentId: number, startDate: Date, endDate: Date, status?: 'PENDING' | 'APPROVED', approvedById?: number): Promise<Assignment> {
    return prisma.assignment.update({
      where: { id },
      data: {
        departmentId,
        startDate,
        endDate,
        ...(status ? { status, pendingMoveData: Prisma.DbNull } : {}),
        ...(approvedById ? { approvedById } : {}),
      },
      include: {
        university: { select: { name: true } },
        department: { select: { name: true } },
      },
    });
  }

  async remove(id: number): Promise<Assignment> {
    return prisma.$transaction(async (tx) => {
      // Collect student IDs before deleting
      const links = await tx.assignmentStudent.findMany({
        where: { assignmentId: id },
        select: { studentId: true },
      });
      const studentIds = links.map((l) => l.studentId);

      // Delete the assignment (cascades to assignmentStudent junction)
      const deleted = await tx.assignment.delete({ where: { id } });

      // Clean up orphaned students
      await this.deleteOrphanedStudents(tx, studentIds);

      return deleted;
    });
  }

  private async deleteOrphanedStudents(tx: Prisma.TransactionClient, studentIds: number[]) {
    if (studentIds.length === 0) return;
    const orphaned = await tx.student.findMany({
      where: { id: { in: studentIds }, assignments: { none: {} } },
      select: { id: true },
    });
    if (orphaned.length > 0) {
      await tx.student.deleteMany({ where: { id: { in: orphaned.map((s) => s.id) } } });
    }
  }

  async bulkCreate(data: CreateAssignmentDto[], createdById: number): Promise<{ count: number }> {
    const records = data.map((item) => ({
      departmentId: item.departmentId,
      universityId: item.universityId,
      academicYearId: item.academicYearId,
      startDate: item.startDate,
      endDate: item.endDate,
      type: item.type,
      shiftType: item.shiftType,
      studentCount: item.studentCount ?? null,
      yearInProgram: item.yearInProgram,
      tutorName: item.tutorName ?? null,
      createdById,
    }));

    return prisma.assignment.createMany({ data: records });
  }

  async addStudent(assignmentId: number, studentData: AddStudentDto) {
    // First get the assignment to know the universityId
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      select: { universityId: true },
    });

    if (!assignment) {
      throw new Error('Assignment not found');
    }

    // Upsert the student by nationalId (student may already exist)
    const student = await prisma.student.upsert({
      where: { nationalId: studentData.nationalId },
      update: {
        firstName: studentData.firstName,
        lastName: studentData.lastName,
        phone: studentData.phone ?? null,
        email: studentData.email || null,
      },
      create: {
        firstName: studentData.firstName,
        lastName: studentData.lastName,
        nationalId: studentData.nationalId,
        phone: studentData.phone ?? null,
        email: studentData.email || null,
        universityId: assignment.universityId,
      },
    });

    // Create the AssignmentStudent link
    return prisma.assignmentStudent.create({
      data: {
        assignmentId,
        studentId: student.id,
      },
      include: {
        student: true,
      },
    });
  }

  async removeStudent(assignmentId: number, studentId: number) {
    return prisma.$transaction(async (tx) => {
      const deleted = await tx.assignmentStudent.delete({
        where: {
          assignmentId_studentId: {
            assignmentId,
            studentId,
          },
        },
      });

      // Delete student if no remaining assignments
      await this.deleteOrphanedStudents(tx, [studentId]);

      return deleted;
    });
  }

  async bulkAddStudents(assignmentId: number, students: AddStudentDto[]) {
    const results = [];
    for (const studentData of students) {
      const result = await this.addStudent(assignmentId, studentData);
      results.push(result);
    }
    return results;
  }

  async approve(id: number, approvedById: number): Promise<Assignment> {
    return prisma.assignment.update({
      where: { id },
      data: { status: 'APPROVED', approvedById, rejectionReason: null, pendingMoveData: Prisma.DbNull },
      include: {
        university: { select: { name: true } },
        department: { select: { name: true } },
        createdBy: { select: { name: true, email: true } },
      },
    });
  }

  async reject(id: number, rejectionReason?: string): Promise<Assignment> {
    return prisma.assignment.update({
      where: { id },
      data: { status: 'REJECTED', rejectionReason: rejectionReason ?? null, approvedById: null },
      include: {
        university: { select: { name: true } },
        department: { select: { name: true } },
        createdBy: { select: { name: true, email: true } },
      },
    });
  }

  async displace(
    incomingId: number,
    params: DisplaceParams,
    status: 'PENDING' | 'APPROVED',
    pendingMoveData?: PendingMoveData,
    approvedById?: number,
  ): Promise<Assignment> {
    const [incoming] = await prisma.$transaction([
      prisma.assignment.update({
        where: { id: incomingId },
        data: {
          departmentId: params.departmentId,
          startDate: params.startDate,
          endDate: params.endDate,
          status,
          ...(pendingMoveData ? { pendingMoveData: pendingMoveData as unknown as Prisma.InputJsonValue } : { pendingMoveData: Prisma.DbNull }),
          ...(approvedById ? { approvedById } : {}),
        },
        include: {
          university: { select: { name: true } },
          department: { select: { name: true } },
        },
      }),
      prisma.assignment.update({
        where: { id: params.displacedAssignmentId },
        data: {
          departmentId: params.displacedDepartmentId,
          startDate: params.displacedStartDate,
          endDate: params.displacedEndDate,
          status,
        },
      }),
    ]);
    return incoming;
  }

  async rejectAndRevert(id: number, moveData: PendingMoveData): Promise<void> {
    await prisma.$transaction(async (tx) => {
      // Collect student IDs before deleting
      const links = await tx.assignmentStudent.findMany({
        where: { assignmentId: id },
        select: { studentId: true },
      });
      const studentIds = links.map((l) => l.studentId);

      // Delete the rejected assignment
      await tx.assignment.delete({ where: { id } });

      // Clean up orphaned students
      await this.deleteOrphanedStudents(tx, studentIds);

      // Revert displaced assignment to original position if it still exists
      const displaced = await tx.assignment.findUnique({
        where: { id: moveData.displacedId },
        select: { id: true },
      });

      if (displaced) {
        await tx.assignment.update({
          where: { id: moveData.displacedId },
          data: {
            departmentId: moveData.displacedOrigDeptId,
            startDate: new Date(moveData.displacedOrigStart),
            endDate: new Date(moveData.displacedOrigEnd),
            status: 'APPROVED',
          },
        });
      }
    });
  }

  async findOverlapping(
    departmentId: number,
    startDate: Date,
    endDate: Date,
    shiftType: 'MORNING' | 'EVENING',
    excludeId?: number,
  ): Promise<Assignment[]> {
    return prisma.assignment.findMany({
      where: {
        departmentId,
        type: 'GROUP',
        shiftType,
        status: { in: ['APPROVED', 'PENDING'] },
        startDate: { lte: endDate },
        endDate: { gte: startDate },
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
  }

  async findStudentAssignments(studentId: number, excludeAssignmentId?: number): Promise<Assignment[]> {
    return prisma.assignment.findMany({
      where: {
        students: { some: { studentId } },
        status: { in: ['APPROVED', 'PENDING'] },
        ...(excludeAssignmentId ? { id: { not: excludeAssignmentId } } : {}),
      },
    });
  }

  async findStudentByNationalId(nationalId: string): Promise<{ id: number } | null> {
    return prisma.student.findUnique({
      where: { nationalId },
      select: { id: true },
    });
  }
}
