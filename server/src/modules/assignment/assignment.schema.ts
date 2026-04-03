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
  yearInProgram: z.number().int().min(1).max(6),
  tutorName: z.string().optional().nullable(),
  forceOverride: z.boolean().optional(),
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
  yearInProgram: z.number().int().min(1).max(6).optional(),
  tutorName: z.string().optional().nullable(),
});

export const moveAssignmentSchema = z.object({
  departmentId: z.number().int().positive(),
  startDate: z.coerce.date().refine((d) => d.getDay() === 0, { message: 'Start date must be a Sunday' }),
  endDate: z.coerce.date().refine((d) => d.getDay() === 4, { message: 'End date must be a Thursday' }),
  forceOverride: z.boolean().optional(),
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
    yearInProgram: z.number().int().min(1).max(6),
    tutorName: z.string().optional().nullable(),
  })),
});

export const addStudentSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  nationalId: z.string().min(1),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal('')),
  forceOverride: z.boolean().optional(),
});

export const importStudentsSchema = z.object({
  students: z.array(z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    nationalId: z.string().min(1),
    phone: z.string().optional().nullable(),
    email: z.string().email().optional().nullable().or(z.literal('')),
  })),
  forceOverride: z.boolean().optional(),
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
  forceOverride: z.boolean().optional(),
});

// ── Smart Import schemas ─────────────────────────────────────────

export const smartImportValidateSchema = z.object({
  academicYearId: z.number().int().positive(),
  rows: z.array(z.object({
    departmentName: z.string().min(1),
    universityName: z.string().min(1),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    studentCount: z.number().int().positive().optional().nullable(),
    yearInProgram: z.number().int().min(1).max(6),
    placementType: z.string().min(1),
    tutorName: z.string().optional().nullable(),
    shiftType: z.string().min(1),
  })),
});

const createAssignmentInnerSchema = z.object({
  departmentId: z.number().int().positive(),
  universityId: z.number().int().positive(),
  academicYearId: z.number().int().positive(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  type: z.enum(['GROUP', 'ELECTIVE']),
  shiftType: z.enum(['MORNING', 'EVENING']),
  studentCount: z.number().int().positive().optional().nullable(),
  yearInProgram: z.number().int().min(1).max(6),
  tutorName: z.string().optional().nullable(),
});

export const smartImportExecuteSchema = z.object({
  academicYearId: z.number().int().positive(),
  actions: z.array(z.discriminatedUnion('type', [
    z.object({ type: z.literal('create'), rowIndex: z.number(), dto: createAssignmentInnerSchema }),
    z.object({
      type: z.literal('displace'),
      rowIndex: z.number(),
      dto: createAssignmentInnerSchema,
      displacedAssignmentId: z.number(),
      displacedDepartmentId: z.number(),
      displacedStartDate: z.coerce.date(),
      displacedEndDate: z.coerce.date(),
    }),
    z.object({ type: z.literal('force_create'), rowIndex: z.number(), dto: createAssignmentInnerSchema }),
  ])),
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
export type SmartImportValidateDto = z.infer<typeof smartImportValidateSchema>;
export type SmartImportExecuteDto = z.infer<typeof smartImportExecuteSchema>;
