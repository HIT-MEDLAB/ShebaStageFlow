import prisma from '../../lib/prisma';
import type { Assignment } from '@prisma/client';
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
}

export interface IAssignmentRepository {
  findByAcademicYear(academicYearId: number, filters?: AssignmentFilters): Promise<unknown[]>;
  findById(id: number): Promise<unknown | null>;
  create(data: CreateAssignmentDto, createdById: number): Promise<Assignment>;
  update(id: number, data: UpdateAssignmentDto): Promise<Assignment>;
  move(id: number, departmentId: number, startDate: Date, endDate: Date): Promise<Assignment>;
  remove(id: number): Promise<Assignment>;
  bulkCreate(data: CreateAssignmentDto[], createdById: number): Promise<{ count: number }>;
  addStudent(assignmentId: number, studentData: AddStudentDto): Promise<unknown>;
  removeStudent(assignmentId: number, studentId: number): Promise<unknown>;
  bulkAddStudents(assignmentId: number, students: AddStudentDto[]): Promise<unknown[]>;
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

    return prisma.assignment.findMany({
      where,
      include: {
        university: { select: { name: true } },
        department: { select: { name: true } },
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

  async create(data: CreateAssignmentDto, createdById: number): Promise<Assignment> {
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
      },
    });
  }

  async update(id: number, data: UpdateAssignmentDto): Promise<Assignment> {
    return prisma.assignment.update({
      where: { id },
      data,
    });
  }

  async move(id: number, departmentId: number, startDate: Date, endDate: Date): Promise<Assignment> {
    return prisma.assignment.update({
      where: { id },
      data: { departmentId, startDate, endDate },
    });
  }

  async remove(id: number): Promise<Assignment> {
    return prisma.assignment.delete({ where: { id } });
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
    return prisma.assignmentStudent.delete({
      where: {
        assignmentId_studentId: {
          assignmentId,
          studentId,
        },
      },
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
}
