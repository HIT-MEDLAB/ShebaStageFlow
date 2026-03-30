import { AppError } from './AppError';

export interface ConstraintViolation {
  code: string;
  type: 'error' | 'warning';
  messageKey: string;
  params?: Record<string, string | number>;
}

export class ConstraintValidationError extends AppError {
  public readonly errors: ConstraintViolation[];
  public readonly warnings: ConstraintViolation[];

  constructor(errors: ConstraintViolation[], warnings: ConstraintViolation[] = []) {
    super('Constraint validation failed', 422);
    this.errors = errors;
    this.warnings = warnings;
    Object.setPrototypeOf(this, ConstraintValidationError.prototype);
  }
}
