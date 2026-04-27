import { z } from 'zod';

export const createAssignmentSchema = z.object({
  departmentId: z.number().int().positive(),
  universityId: z.number().int().positive(),
  academicYearId: z.number().int().positive(),
  startDate: z.coerce.date().refine((d) => d.getUTCDay() === 0, { message: 'Start date must be a Sunday' }),
  endDate: z.coerce.date().refine((d) => d.getUTCDay() === 4, { message: 'End date must be a Thursday' }),
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
  startDate: z.coerce.date().refine((d) => d.getUTCDay() === 0, { message: 'Start date must be a Sunday' }).optional(),
  endDate: z.coerce.date().refine((d) => d.getUTCDay() === 4, { message: 'End date must be a Thursday' }).optional(),
  type: z.enum(['GROUP', 'ELECTIVE']).optional(),
  shiftType: z.enum(['MORNING', 'EVENING']).optional(),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
  studentCount: z.number().int().positive().optional().nullable(),
  yearInProgram: z.number().int().min(1).max(6).optional(),
  tutorName: z.string().optional().nullable(),
  forceOverride: z.boolean().optional(),
}).refine((data) => {
  if (data.startDate && data.endDate) {
    return data.endDate > data.startDate;
  }
  return true;
}, {
  message: 'End date must be after start date',
  path: ['endDate'],
});

export const moveAssignmentSchema = z.object({
  departmentId: z.number().int().positive(),
  startDate: z.coerce.date().refine((d) => d.getUTCDay() === 0, { message: 'Start date must be a Sunday' }),
  endDate: z.coerce.date().refine((d) => d.getUTCDay() === 4, { message: 'End date must be a Thursday' }),
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
  startDate: z.coerce.date().refine((d) => d.getUTCDay() === 0, { message: 'Start date must be a Sunday' }),
  endDate: z.coerce.date().refine((d) => d.getUTCDay() === 4, { message: 'End date must be a Thursday' }),
  displacedAssignmentId: z.number().int(),
  displacedDepartmentId: z.number().int().positive(),
  displacedStartDate: z.coerce.date(),
  displacedEndDate: z.coerce.date(),
  forceOverride: z.boolean().optional(),
});

// ── Displacement week validation ─────────────────────────────────

export const validateDisplacementWeekSchema = z.object({
  departmentId: z.number().int().positive(),
  universityId: z.number().int().positive(),
  startDate: z.coerce.date().refine((d) => d.getUTCDay() === 0, { message: 'Start date must be a Sunday' }),
  endDate: z.coerce.date().refine((d) => d.getUTCDay() === 4, { message: 'End date must be a Thursday' }),
  shiftType: z.enum(['MORNING', 'EVENING']),
  type: z.enum(['GROUP', 'ELECTIVE']),
  studentCount: z.number().int().positive().optional().nullable(),
  yearInProgram: z.number().int().min(1).max(6),
  excludeAssignmentIds: z.array(z.number().int()),
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
    z.object({ type: z.literal('create'), rowIndex: z.number(), dto: createAssignmentInnerSchema, blockKey: z.string().optional() }),
    z.object({
      type: z.literal('displace'),
      rowIndex: z.number(),
      dto: createAssignmentInnerSchema,
      displacedAssignmentId: z.number(),
      displacedDepartmentId: z.number(),
      displacedStartDate: z.coerce.date(),
      displacedEndDate: z.coerce.date(),
      blockKey: z.string().optional(),
    }),
    z.object({ type: z.literal('force_create'), rowIndex: z.number(), dto: createAssignmentInnerSchema, blockKey: z.string().optional() }),
  ])),
});

// ── Block (multi-week) schemas ──────────────────────────────────

export const createBlockSchema = z.object({
  departmentId: z.number().int().positive(),
  universityId: z.number().int().positive(),
  academicYearId: z.number().int().positive(),
  startDate: z.coerce.date().refine((d) => d.getUTCDay() === 0, { message: 'Start date must be a Sunday' }),
  endDate: z.coerce.date().refine((d) => d.getUTCDay() === 4, { message: 'End date must be a Thursday' }),
  type: z.enum(['GROUP', 'ELECTIVE']),
  shifts: z.array(z.enum(['MORNING', 'EVENING'])).min(2, 'Block must have at least 2 weeks'),
  studentCount: z.number().int().positive().optional().nullable(),
  yearInProgram: z.number().int().min(1).max(6),
  tutorName: z.string().optional().nullable(),
  forceOverride: z.boolean().optional(),
}).refine((data) => data.endDate > data.startDate, {
  message: 'End date must be after start date',
  path: ['endDate'],
}).refine((data) => {
  // Validate that endDate matches startDate + (shifts.length - 1) * 7 + 4 days
  const expectedEnd = new Date(data.startDate);
  expectedEnd.setUTCDate(expectedEnd.getUTCDate() + (data.shifts.length - 1) * 7 + 4);
  return Math.abs(data.endDate.getTime() - expectedEnd.getTime()) < 24 * 60 * 60 * 1000;
}, {
  message: 'End date must match the number of weeks specified by shifts',
  path: ['endDate'],
});

export const convertToBlockSchema = z.object({
  departmentId: z.number().int().positive(),
  universityId: z.number().int().positive(),
  startDate: z.coerce.date().refine((d) => d.getUTCDay() === 0, { message: 'Start date must be a Sunday' }),
  endDate: z.coerce.date().refine((d) => d.getUTCDay() === 4, { message: 'End date must be a Thursday' }),
  type: z.enum(['GROUP', 'ELECTIVE']),
  shifts: z.array(z.enum(['MORNING', 'EVENING'])).min(2, 'Block must have at least 2 weeks'),
  studentCount: z.number().int().positive().optional().nullable(),
  yearInProgram: z.number().int().min(1).max(6),
  tutorName: z.string().optional().nullable(),
  forceOverride: z.boolean().optional(),
}).refine((data) => data.endDate > data.startDate, {
  message: 'End date must be after start date',
  path: ['endDate'],
}).refine((data) => {
  const expectedEnd = new Date(data.startDate);
  expectedEnd.setUTCDate(expectedEnd.getUTCDate() + (data.shifts.length - 1) * 7 + 4);
  return Math.abs(data.endDate.getTime() - expectedEnd.getTime()) < 24 * 60 * 60 * 1000;
}, {
  message: 'End date must match the number of weeks specified by shifts',
  path: ['endDate'],
});

export const moveBlockSchema = z.object({
  departmentId: z.number().int().positive(),
  startDate: z.coerce.date().refine((d) => d.getUTCDay() === 0, { message: 'Start date must be a Sunday' }),
  forceOverride: z.boolean().optional(),
});

export const findBlockPositionsSchema = z.object({
  departmentId: z.number().int().positive(),
  academicYearId: z.number().int().positive(),
  blockSize: z.number().int().min(2),
  shifts: z.array(z.enum(['MORNING', 'EVENING'])).min(2),
  type: z.enum(['GROUP', 'ELECTIVE']),
  universityId: z.number().int().positive(),
  studentCount: z.number().int().positive().optional().nullable(),
  yearInProgram: z.number().int().min(1).max(6),
  excludeGroupId: z.string().optional(),
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
export type ValidateDisplacementWeekDto = z.infer<typeof validateDisplacementWeekSchema>;
export type CreateBlockDto = z.infer<typeof createBlockSchema>;
export type MoveBlockDto = z.infer<typeof moveBlockSchema>;
export type FindBlockPositionsDto = z.infer<typeof findBlockPositionsSchema>;
export type ConvertToBlockDto = z.infer<typeof convertToBlockSchema>;
