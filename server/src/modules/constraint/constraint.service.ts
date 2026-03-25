import type { IConstraintRepository } from './constraint.repository';

export class ConstraintService {
  constructor(private readonly repository: IConstraintRepository) {}

  async getConstraintsForYears(years: number[]) {
    const [departmentConstraints, ironConstraints, holidays] = await Promise.all([
      this.repository.findDepartmentConstraints(),
      this.repository.findIronConstraints(true),
      this.repository.findHolidays(years),
    ]);

    return { departmentConstraints, ironConstraints, holidays };
  }
}
