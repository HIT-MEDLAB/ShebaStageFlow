import type { CreateAssignmentDto } from '../assignment.schema';

export interface SmartImportRow {
  departmentName: string;
  universityName: string;
  startDate: Date;
  endDate: Date;
  studentCount?: number | null;
  yearInProgram: number;
  placementType: string;
  tutorName?: string | null;
  shiftType: string;
}

export interface ImportValidationResult {
  rows: ImportRowResult[];
  globalWarnings?: string[];
}

export interface ImportRowResult {
  rowIndex: number;
  status: 'success' | 'bumped' | 'failed' | 'parse_error';
  resolvedDto?: CreateAssignmentDto;
  bumpedAssignment?: {
    id: number;
    departmentId: number;
    universityId: number;
    universityName: string;
    departmentName: string;
    startDate: string;
    endDate: string;
    shiftType: 'MORNING' | 'EVENING';
    type: 'GROUP' | 'ELECTIVE';
    studentCount: number | null;
    yearInProgram: number;
  };
  suggestedWeeks?: Array<{ startDate: string; endDate: string }>;
  failureReason?: string;
  failureParams?: Record<string, string | number>;
  parseErrors?: string[];
  warnings?: string[];
}

export type ImportAction =
  | { type: 'create'; rowIndex: number; dto: CreateAssignmentDto }
  | {
      type: 'displace';
      rowIndex: number;
      dto: CreateAssignmentDto;
      displacedAssignmentId: number;
      displacedDepartmentId: number;
      displacedStartDate: Date;
      displacedEndDate: Date;
    }
  | { type: 'force_create'; rowIndex: number; dto: CreateAssignmentDto };
