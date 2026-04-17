import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, Role, AssignmentType, ShiftType, AssignmentStatus } from "@prisma/client";
import bcrypt from "bcrypt";
import pg from "pg";
import "dotenv/config";

const pool = new pg.Pool({
  connectionString: process.env["DATABASE_URL"],
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const SALT_ROUNDS = 10;

interface SeedUser {
  email: string;
  name: string;
  phone: string;
  role: Role;
  password: string;
}

const users: SeedUser[] = [
  {
    email: "semdaniel1@gmail.com",
    name: "Super Admin",
    phone: "050-0000001",
    role: Role.SUPER_ADMIN,
    password: "SuperAdmin123!",
  },
  {
    email: "admin1@shiba.health.gov.il",
    name: "Admin One",
    phone: "050-0000002",
    role: Role.ADMIN,
    password: "Admin123!",
  },
  {
    email: "admin2@shiba.health.gov.il",
    name: "Admin Two",
    phone: "050-0000003",
    role: Role.ADMIN,
    password: "Admin123!",
  },
  {
    email: "coordinator1@shiba.health.gov.il",
    name: "Coordinator One",
    phone: "050-0000004",
    role: Role.ACADEMIC_COORDINATOR,
    password: "Coordinator123!",
  },
  {
    email: "coordinator2@shiba.health.gov.il",
    name: "Coordinator Two",
    phone: "050-0000005",
    role: Role.ACADEMIC_COORDINATOR,
    password: "Coordinator123!",
  },
  {
    email: "coordinator3@shiba.health.gov.il",
    name: "Coordinator Three",
    phone: "050-0000006",
    role: Role.ACADEMIC_COORDINATOR,
    password: "Coordinator123!",
  },
  {
    email: "coordinator4@shiba.health.gov.il",
    name: "Coordinator Four",
    phone: "050-0000007",
    role: Role.ACADEMIC_COORDINATOR,
    password: "Coordinator123!",
  },
  {
    email: "semdaniel1@gmail.com",
    name: "Daniel Sem",
    phone: "050-0000008",
    role: Role.SUPER_ADMIN,
    password: "SuperAdmin123!",
  },
];

async function main() {
  console.log("Seeding users...");

  for (const user of users) {
    const hashPassword = await bcrypt.hash(user.password, SALT_ROUNDS);

    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: {
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
        hashPassword,
      },
    });

    console.log(`Created ${user.role}: ${user.email}`);
  }

  // Seed universities
  console.log("Seeding universities...");

  const universities = [
    { name: "תל אביב", priority: 2 },
    { name: "רייכמן", priority: 1 },
    { name: "ויצמן", priority: 0 },
    { name: "הטכניון", priority: 0 },
    { name: "בן גוריון", priority: 0 },
    { name: "אריאל", priority: 0 },
    { name: "ניקוסיה", priority: 0 },
    { name: "לימודי חול", priority: 0 },
  ];

  for (const u of universities) {
    await prisma.university.upsert({
      where: { name: u.name },
      update: { priority: u.priority },
      create: {
        name: u.name,
        priority: u.priority,
        isActive: true,
      },
    });

    console.log(`Created university: ${u.name}`);
  }

  // Fetch seeded universities for later use
  const seededUniversities = await Promise.all(
    universities.map((u) =>
      prisma.university.findUniqueOrThrow({ where: { name: u.name } })
    )
  );

  // Seed university semesters
  console.log("Seeding university semesters...");
  for (const uni of seededUniversities) {
    await prisma.universitySemester.upsert({
      where: { universityId_year: { universityId: uni.id, year: 2026 } },
      update: {},
      create: {
        universityId: uni.id,
        semesterStart: new Date('2025-10-01'),
        semesterEnd: new Date('2026-06-30'),
        year: 2026,
      },
    });
    console.log(`Created semester for university: ${uni.name}`);
  }

  // Seed academic years
  console.log("Seeding academic years...");
  await prisma.academicYear.upsert({
    where: { name: '2025-2026' },
    update: {},
    create: {
      name: '2025-2026',
      startDate: new Date('2025-10-01'),
      endDate: new Date('2026-06-30'),
    },
  });
  console.log("Created academic year: 2025-2026");

  await prisma.academicYear.upsert({
    where: { name: '2024-2025' },
    update: {},
    create: {
      name: '2024-2025',
      startDate: new Date('2024-10-01'),
      endDate: new Date('2025-06-30'),
    },
  });
  console.log("Created academic year: 2024-2025");

  await prisma.academicYear.upsert({
    where: { name: '2023-2024' },
    update: {},
    create: {
      name: '2023-2024',
      startDate: new Date('2023-10-01'),
      endDate: new Date('2024-06-30'),
    },
  });
  console.log("Created academic year: 2023-2024");

  // Seed departments
  console.log("Seeding departments...");

  const departments = [
    { name: 'רפואה פנימית', hasMorningShift: true, hasEveningShift: true },
    { name: 'ילדים', hasMorningShift: true, hasEveningShift: false },
    { name: 'כירורגיה', hasMorningShift: true, hasEveningShift: true },
    { name: 'נשים ויולדות', hasMorningShift: true, hasEveningShift: false },
    { name: 'עור ומין', hasMorningShift: true, hasEveningShift: false },
    { name: 'עיניים', hasMorningShift: true, hasEveningShift: false },
    { name: 'אורתופדיה', hasMorningShift: true, hasEveningShift: true },
    { name: 'אף אוזן גרון', hasMorningShift: false, hasEveningShift: true },
    { name: 'נוירולוגיה', hasMorningShift: true, hasEveningShift: false },
    { name: 'פסיכיאטריה', hasMorningShift: true, hasEveningShift: false },
  ];

  const seededDepartments = [];
  for (const dept of departments) {
    const created = await prisma.department.upsert({
      where: { name: dept.name },
      update: {
        hasMorningShift: dept.hasMorningShift,
        hasEveningShift: dept.hasEveningShift,
      },
      create: {
        name: dept.name,
        hasMorningShift: dept.hasMorningShift,
        hasEveningShift: dept.hasEveningShift,
        isActive: true,
      },
    });
    seededDepartments.push(created);
    console.log(`Created department: ${dept.name}`);
  }

  // Seed department constraints for all departments
  console.log("Seeding department constraints...");

  const constraintsData = [
    { departmentId: seededDepartments[0]!.id, morningCapacity: 2, eveningCapacity: 8, electiveCapacity: 2 },
    { departmentId: seededDepartments[1]!.id, morningCapacity: 5, eveningCapacity: 3, electiveCapacity: 1 },
    { departmentId: seededDepartments[2]!.id, morningCapacity: 5, eveningCapacity: 4, electiveCapacity: 3 },
    { departmentId: seededDepartments[3]!.id, morningCapacity: 4, eveningCapacity: 4, electiveCapacity: 3 },
    { departmentId: seededDepartments[4]!.id, morningCapacity: 6, eveningCapacity: 3, electiveCapacity: 1 },
    { departmentId: seededDepartments[5]!.id, morningCapacity: 5, eveningCapacity: 0, electiveCapacity: 2 },
    { departmentId: seededDepartments[6]!.id, morningCapacity: 8, eveningCapacity: 6, electiveCapacity: 1 },
    { departmentId: seededDepartments[7]!.id, morningCapacity: 0, eveningCapacity: 10, electiveCapacity: 1 },
    { departmentId: seededDepartments[8]!.id, morningCapacity: 7, eveningCapacity: 0, electiveCapacity: 0 },
    { departmentId: seededDepartments[9]!.id, morningCapacity: 5, eveningCapacity: 0, electiveCapacity: 0 },
  ];

  for (const constraint of constraintsData) {
    const existing = await prisma.departmentConstraint.findFirst({
      where: { departmentId: constraint.departmentId },
    });
    if (!existing) {
      await prisma.departmentConstraint.create({ data: constraint });
      console.log(`Created constraint for department ID: ${constraint.departmentId}`);
    } else {
      console.log(`Constraint already exists for department ID: ${constraint.departmentId}`);
    }
  }

  // Seed holidays
  console.log("Seeding holidays...");

  const holidays = [
    { name: 'פורים', date: new Date('2026-03-05'), year: 2026 },
    { name: 'פסח', date: new Date('2026-04-02'), year: 2026 },
  ];

  for (const holiday of holidays) {
    await prisma.holiday.upsert({
      where: { name_year: { name: holiday.name, year: holiday.year } },
      update: {},
      create: {
        name: holiday.name,
        date: holiday.date,
        year: holiday.year,
        isFullDay: true,
      },
    });
    console.log(`Created holiday: ${holiday.name}`);
  }

  // Seed assignments
  console.log("Seeding assignments...");

  const academicYear = await prisma.academicYear.findUniqueOrThrow({
    where: { name: '2025-2026' },
  });

  const superAdmin = await prisma.user.findUniqueOrThrow({
    where: { email: 'semdaniel1@gmail.com' },
  });

  const adminOne = await prisma.user.findUniqueOrThrow({
    where: { email: 'admin1@shiba.health.gov.il' },
  });

  const assignments = [
    { startDate: '2025-10-05', endDate: '2025-10-09', deptIdx: 0, uniIdx: 0, type: AssignmentType.GROUP,    shift: ShiftType.MORNING, students: 5, year: 4 },
    { startDate: '2025-10-05', endDate: '2025-10-09', deptIdx: 2, uniIdx: 1, type: AssignmentType.GROUP,    shift: ShiftType.EVENING, students: 4, year: 5 },
    { startDate: '2025-10-12', endDate: '2025-10-16', deptIdx: 1, uniIdx: 3, type: AssignmentType.GROUP,    shift: ShiftType.MORNING, students: 6, year: 4 },
    { startDate: '2025-10-12', endDate: '2025-10-16', deptIdx: 3, uniIdx: 4, type: AssignmentType.ELECTIVE, shift: ShiftType.MORNING, students: 3, year: 5 },
    { startDate: '2025-10-19', endDate: '2025-10-23', deptIdx: 6, uniIdx: 2, type: AssignmentType.GROUP,    shift: ShiftType.MORNING, students: 5, year: 4 },
    { startDate: '2025-10-19', endDate: '2025-10-23', deptIdx: 5, uniIdx: 5, type: AssignmentType.ELECTIVE, shift: ShiftType.MORNING, students: 2, year: 6 },
    { startDate: '2025-10-26', endDate: '2025-10-30', deptIdx: 0, uniIdx: 6, type: AssignmentType.GROUP,    shift: ShiftType.EVENING, students: 4, year: 5 },
    { startDate: '2025-10-26', endDate: '2025-10-30', deptIdx: 8, uniIdx: 0, type: AssignmentType.GROUP,    shift: ShiftType.MORNING, students: 5, year: 4 },
    { startDate: '2025-11-02', endDate: '2025-11-06', deptIdx: 4, uniIdx: 7, type: AssignmentType.ELECTIVE, shift: ShiftType.MORNING, students: 3, year: 6 },
    { startDate: '2025-11-09', endDate: '2025-11-13', deptIdx: 2, uniIdx: 1, type: AssignmentType.GROUP,    shift: ShiftType.MORNING, students: 6, year: 4 },
  ];

  // Students per assignment — each sub-array has exactly the number of students for that assignment
  const studentsPerAssignment: { firstName: string; lastName: string; nationalId: string; phone: string; email: string }[][] = [
    // Assignment 0: תל אביב (uniIdx 0) — 5 students
    [
      { firstName: 'דניאל', lastName: 'כהן',   nationalId: '200000001', phone: '050-1000001', email: 'daniel.cohen@mail.com' },
      { firstName: 'שרה',   lastName: 'לוי',   nationalId: '200000002', phone: '050-1000002', email: 'sara.levi@mail.com' },
      { firstName: 'יוסף',  lastName: 'מזרחי', nationalId: '200000003', phone: '050-1000003', email: 'yosef.mizrahi@mail.com' },
      { firstName: 'רבקה',  lastName: 'פרץ',   nationalId: '200000004', phone: '050-1000004', email: 'rivka.peretz@mail.com' },
      { firstName: 'אברהם', lastName: 'ביטון', nationalId: '200000005', phone: '050-1000005', email: 'avraham.biton@mail.com' },
    ],
    // Assignment 1: רייכמן (uniIdx 1) — 4 students
    [
      { firstName: 'רחל',  lastName: 'דהן',   nationalId: '200000006', phone: '050-1000006', email: 'rachel.dahan@mail.com' },
      { firstName: 'יעקב', lastName: 'אזולאי', nationalId: '200000007', phone: '050-1000007', email: 'yaakov.azulay@mail.com' },
      { firstName: 'נועה',  lastName: 'שלום',  nationalId: '200000008', phone: '050-1000008', email: 'noa.shalom@mail.com' },
      { firstName: 'משה',  lastName: 'חדד',   nationalId: '200000009', phone: '050-1000009', email: 'moshe.hadad@mail.com' },
    ],
    // Assignment 2: הטכניון (uniIdx 3) — 6 students
    [
      { firstName: 'תמר',  lastName: 'עמר',     nationalId: '200000010', phone: '050-1000010', email: 'tamar.amar@mail.com' },
      { firstName: 'דוד',  lastName: 'גולן',    nationalId: '200000011', phone: '050-1000011', email: 'david.golan@mail.com' },
      { firstName: 'שירה', lastName: 'ברק',     nationalId: '200000012', phone: '050-1000012', email: 'shira.barak@mail.com' },
      { firstName: 'שלמה', lastName: 'שפירא',   nationalId: '200000013', phone: '050-1000013', email: 'shlomo.shapira@mail.com' },
      { firstName: 'מיכל', lastName: 'רוזנברג', nationalId: '200000014', phone: '050-1000014', email: 'michal.rosenberg@mail.com' },
      { firstName: 'יצחק', lastName: 'פרידמן', nationalId: '200000015', phone: '050-1000015', email: 'yitzhak.friedman@mail.com' },
    ],
    // Assignment 3: בן גוריון (uniIdx 4) — 3 students
    [
      { firstName: 'ליאת',  lastName: 'גרינברג', nationalId: '200000016', phone: '050-1000016', email: 'liat.greenberg@mail.com' },
      { firstName: 'אהרון', lastName: 'וייס',    nationalId: '200000017', phone: '050-1000017', email: 'aharon.weiss@mail.com' },
      { firstName: 'הדר',   lastName: 'בלום',    nationalId: '200000018', phone: '050-1000018', email: 'hadar.blum@mail.com' },
    ],
    // Assignment 4: ויצמן (uniIdx 2) — 5 students
    [
      { firstName: 'נועם',  lastName: 'קפלן',      nationalId: '200000019', phone: '050-1000019', email: 'noam.kaplan@mail.com' },
      { firstName: 'עדי',   lastName: 'שטרן',      nationalId: '200000020', phone: '050-1000020', email: 'adi.stern@mail.com' },
      { firstName: 'עידו',  lastName: 'הרשקוביץ', nationalId: '200000021', phone: '050-1000021', email: 'ido.hershkovitz@mail.com' },
      { firstName: 'דנה',   lastName: 'לנדאו',     nationalId: '200000022', phone: '050-1000022', email: 'dana.landau@mail.com' },
      { firstName: 'אורי',  lastName: 'ברגר',      nationalId: '200000023', phone: '050-1000023', email: 'uri.berger@mail.com' },
    ],
    // Assignment 5: אריאל (uniIdx 5) — 2 students
    [
      { firstName: 'מאיה', lastName: 'כהן', nationalId: '200000024', phone: '050-1000024', email: 'maya.cohen@mail.com' },
      { firstName: 'רועי', lastName: 'לוי', nationalId: '200000025', phone: '050-1000025', email: 'roei.levi@mail.com' },
    ],
    // Assignment 6: ניקוסיה (uniIdx 6) — 4 students
    [
      { firstName: 'גלי',  lastName: 'מזרחי', nationalId: '200000026', phone: '050-1000026', email: 'gali.mizrahi@mail.com' },
      { firstName: 'תומר', lastName: 'פרץ',   nationalId: '200000027', phone: '050-1000027', email: 'tomer.peretz@mail.com' },
      { firstName: 'יעל',  lastName: 'ביטון', nationalId: '200000028', phone: '050-1000028', email: 'yael.biton@mail.com' },
      { firstName: 'גיל',  lastName: 'דהן',   nationalId: '200000029', phone: '050-1000029', email: 'gil.dahan@mail.com' },
    ],
    // Assignment 7: תל אביב (uniIdx 0) — 5 students
    [
      { firstName: 'עמית',  lastName: 'אזולאי', nationalId: '200000030', phone: '050-1000030', email: 'amit.azulay@mail.com' },
      { firstName: 'לאה',   lastName: 'שלום',   nationalId: '200000031', phone: '050-1000031', email: 'leah.shalom@mail.com' },
      { firstName: 'איתי',  lastName: 'חדד',    nationalId: '200000032', phone: '050-1000032', email: 'itay.hadad@mail.com' },
      { firstName: 'מרים',  lastName: 'עמר',    nationalId: '200000033', phone: '050-1000033', email: 'miriam.amar@mail.com' },
      { firstName: 'ליאור', lastName: 'גולן',   nationalId: '200000034', phone: '050-1000034', email: 'lior.golan@mail.com' },
    ],
    // Assignment 8: לימודי חול (uniIdx 7) — 3 students
    [
      { firstName: 'חנה',   lastName: 'ברק',     nationalId: '200000035', phone: '050-1000035', email: 'hana.barak@mail.com' },
      { firstName: 'אלון',  lastName: 'שפירא',   nationalId: '200000036', phone: '050-1000036', email: 'alon.shapira@mail.com' },
      { firstName: 'דבורה', lastName: 'רוזנברג', nationalId: '200000037', phone: '050-1000037', email: 'dvora.rosenberg@mail.com' },
    ],
    // Assignment 9: רייכמן (uniIdx 1) — 6 students
    [
      { firstName: 'יונתן', lastName: 'פרידמן',  nationalId: '200000038', phone: '050-1000038', email: 'yonatan.friedman@mail.com' },
      { firstName: 'אסתר', lastName: 'גרינברג', nationalId: '200000039', phone: '050-1000039', email: 'ester.greenberg@mail.com' },
      { firstName: 'עומר',  lastName: 'וייס',    nationalId: '200000040', phone: '050-1000040', email: 'omer.weiss@mail.com' },
      { firstName: 'רות',   lastName: 'בלום',    nationalId: '200000041', phone: '050-1000041', email: 'ruth.blum@mail.com' },
      { firstName: 'ניר',   lastName: 'קפלן',    nationalId: '200000042', phone: '050-1000042', email: 'nir.kaplan@mail.com' },
      { firstName: 'טלי',   lastName: 'שטרן',    nationalId: '200000043', phone: '050-1000043', email: 'tali.stern@mail.com' },
    ],
  ];

  for (let i = 0; i < assignments.length; i++) {
    const a = assignments[i]!;
    const created = await prisma.assignment.create({
      data: {
        departmentId:  seededDepartments[a.deptIdx]!.id,
        universityId:  seededUniversities[a.uniIdx]!.id,
        startDate:     new Date(a.startDate),
        endDate:       new Date(a.endDate),
        studentCount:  a.students,
        yearInProgram: a.year,
        type:          a.type,
        shiftType:     a.shift,
        status:        AssignmentStatus.APPROVED,
        createdById:   superAdmin.id,
        approvedById:  adminOne.id,
        academicYearId: academicYear.id,
      },
    });
    console.log(`Created assignment #${created.id}: ${seededDepartments[a.deptIdx]!.name} / ${seededUniversities[a.uniIdx]!.name} (${a.startDate})`);

    // Create students and link them to this assignment
    const studentDefs = studentsPerAssignment[i]!;
    for (const s of studentDefs) {
      const student = await prisma.student.upsert({
        where: { nationalId: s.nationalId },
        update: {},
        create: {
          firstName: s.firstName,
          lastName: s.lastName,
          nationalId: s.nationalId,
          phone: s.phone,
          email: s.email,
          universityId: seededUniversities[a.uniIdx]!.id,
        },
      });

      await prisma.assignmentStudent.upsert({
        where: {
          assignmentId_studentId: {
            assignmentId: created.id,
            studentId: student.id,
          },
        },
        update: {},
        create: {
          assignmentId: created.id,
          studentId: student.id,
        },
      });
    }
    console.log(`  Linked ${studentDefs.length} students`);
  }

  // Seed iron constraints
  console.log("Seeding iron constraints...");

  const ironConstraints = [
    { name: 'SEMESTER_BOUNDARY',      description: 'Assignments must fall within university semester dates',       behavior: 'hard' },
    { name: 'STUDENT_DOUBLE_BOOKING', description: 'Student cannot be in two overlapping assignments',            behavior: 'hard' },
    { name: 'FIRST_CLINICAL_ROTATION', description: 'Year-1 first rotation should be Internal Medicine or Pediatrics', behavior: 'warning' },
    { name: 'ONE_GROUP_PER_SHIFT',    description: 'One GROUP per department per shift per week',                  behavior: 'hard' },
    { name: 'CAPACITY_LIMIT',         description: 'Student count must not exceed department shift capacity',      behavior: 'hard' },
  ];

  for (const ic of ironConstraints) {
    await prisma.ironConstraint.upsert({
      where: { name: ic.name },
      update: { description: ic.description },
      create: {
        name: ic.name,
        description: ic.description,
        isActive: true,
      },
    });
    console.log(`Created iron constraint: ${ic.name}`);
  }

  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
