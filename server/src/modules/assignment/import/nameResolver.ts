import prisma from '../../../lib/prisma';

function normalize(name: string): string {
  return name.trim().replace(/\s+/g, ' ');
}

export class NameResolver {
  private departmentMap = new Map<string, { id: number; hasMorningShift: boolean; hasEveningShift: boolean }>();
  private universityMap = new Map<string, number>();

  async init(): Promise<void> {
    const departments = await prisma.department.findMany({
      where: { isActive: true },
      select: { id: true, name: true, hasMorningShift: true, hasEveningShift: true },
    });
    for (const d of departments) {
      this.departmentMap.set(normalize(d.name), {
        id: d.id,
        hasMorningShift: d.hasMorningShift,
        hasEveningShift: d.hasEveningShift,
      });
    }

    const universities = await prisma.university.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
    });
    for (const u of universities) {
      this.universityMap.set(normalize(u.name), u.id);
    }
  }

  resolveDepartment(name: string): { id: number; hasMorningShift: boolean; hasEveningShift: boolean } | null {
    return this.departmentMap.get(normalize(name)) ?? null;
  }

  resolveUniversity(name: string): number | null {
    return this.universityMap.get(normalize(name)) ?? null;
  }

  static resolvePlacementType(
    value: string,
    yearInProgram: number,
  ): { type: 'GROUP' | 'ELECTIVE'; yearInProgram: number } {
    const trimmed = value.trim();
    if (trimmed === 'אלקטיב') {
      return { type: 'ELECTIVE', yearInProgram };
    }
    if (trimmed === 'סבב ראשון') {
      return { type: 'GROUP', yearInProgram: 1 };
    }
    // Default: "רגיל" or anything else → GROUP
    return { type: 'GROUP', yearInProgram };
  }

  static resolveShiftType(value: string): 'MORNING' | 'EVENING' | null {
    const trimmed = value.trim();
    if (trimmed === 'בוקר') return 'MORNING';
    if (trimmed === 'אחה"צ' || trimmed === 'אחה\"צ' || trimmed === 'ערב') return 'EVENING';
    return null;
  }
}
