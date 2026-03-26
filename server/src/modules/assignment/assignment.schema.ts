import { z } from 'zod';

export const createAssignmentSchema = z.object({
  departmentId: z.number().int().positive(),
  universityId: z.number().int().positive(),
  academicYearId: z.number().int().positive(),
  startDate: z.coerce.date().refine((d) => d.getDay() === 0, { message: 'Start date must be a Sunday' }),
  endDate: z.coerce.date().refine((d) => d.getDay() === 4, { message: 'End date must be a Thursday' }),
  type: z.enum(['GROUP', 'ELECTIVE']),
  shiftType: z.enum(['MORNING', 'EVENING']),
  studentCount: z.number().int().positive().optional().nullable(),
  yearInProgram: z.number().int().min(1).max(7),
  tutorName: z.string().optional().nullable(),
}).refine((data) => data.endDate > data.startDate, {
  message: 'End date must be after start date',
  path: ['endDate'],
});

export const updateAssignmentSchema = z.object({
  departmentId: z.number().int().positive().optional(),
  universityId: z.number().int().positive().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  type: z.enum(['GROUP', 'ELECTIVE']).optional(),
  shiftType: z.enum(['MORNING', 'EVENING']).optional(),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
  studentCount: z.number().int().positive().optional().nullable(),
  yearInProgram: z.number().int().min(1).max(7).optional(),
  tutorName: z.string().optional().nullable(),
});

export const moveAssignmentSchema = z.object({
  departmentId: z.number().int().positive(),
  startDate: z.coerce.date().refine((d) => d.getDay() === 0, { message: 'Start date must be a Sunday' }),
  endDate: z.coerce.date().refine((d) => d.getDay() === 4, { message: 'End date must be a Thursday' }),
});

export const importAssignmentsSchema = z.object({
  assignments: z.array(z.object({
    departmentId: z.number().int().positive(),
    universityId: z.number().int().positive(),
    academicYearId: z.number().int().positive(),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    type: z.enum(['GROUP', 'ELECTIVE']),
    shiftType: z.enum(['MORNING', 'EVENING']),
    studentCount: z.number().int().positive().optional().nullable(),
    yearInProgram: z.number().int().min(1).max(7),
    tutorName: z.string().optional().nullable(),
  })),
});

export const addStudentSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  nationalId: z.string().min(1),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal('')),
});

export const importStudentsSchema = z.object({
  students: z.array(z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    nationalId: z.string().min(1),
    phone: z.string().optional().nullable(),
    email: z.string().email().optional().nullable().or(z.literal('')),
  })),
});

export const rejectAssignmentSchema = z.object({
  rejectionReason: z.string().optional(),
});

export const displaceAssignmentSchema = z.object({
  departmentId: z.number().int().positive(),
  startDate: z.coerce.date().refine((d) => d.getDay() === 0, { message: 'Start date must be a Sunday' }),
  endDate: z.coerce.date().refine((d) => d.getDay() === 4, { message: 'End date must be a Thursday' }),
  displacedAssignmentId: z.number().int(),
  displacedDepartmentId: z.number().int().positive(),
  displacedStartDate: z.coerce.date(),
  displacedEndDate: z.coerce.date(),
});

// Export inferred types
export type CreateAssignmentDto = z.infer<typeof createAssignmentSchema>;
export type UpdateAssignmentDto = z.infer<typeof updateAssignmentSchema>;
export type MoveAssignmentDto = z.infer<typeof moveAssignmentSchema>;
export type ImportAssignmentsDto = z.infer<typeof importAssignmentsSchema>;
export type AddStudentDto = z.infer<typeof addStudentSchema>;
export type ImportStudentsDto = z.infer<typeof importStudentsSchema>;
export type RejectAssignmentDto = z.infer<typeof rejectAssignmentSchema>;
export type DisplaceAssignmentDto = z.infer<typeof displaceAssignmentSchema>;
