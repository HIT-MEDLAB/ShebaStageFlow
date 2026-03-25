import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, Role } from "@prisma/client";
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
    email: "superadmin@shiba.health.gov.il",
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
    "תל אביב",
    "רייכמן",
    "ויצמן",
    "הטכניון",
    "בן גוריון",
    "אריאל",
    "ניקוסיה",
    "לימודי חול",
  ];

  for (let i = 0; i < universities.length; i++) {
    await prisma.university.upsert({
      where: { name: universities[i]! },
      update: {},
      create: {
        name: universities[i]!,
        priority: i,
        isActive: true,
      },
    });

    console.log(`Created university: ${universities[i]}`);
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
    { name: 'אף אוזן גרון', hasMorningShift: true, hasEveningShift: false },
    { name: 'נוירולוגיה', hasMorningShift: true, hasEveningShift: false },
    { name: 'פסיכיאטריה', hasMorningShift: true, hasEveningShift: false },
  ];

  const seededDepartments = [];
  for (const dept of departments) {
    const created = await prisma.department.upsert({
      where: { name: dept.name },
      update: {},
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

  // Seed department constraints for first 3 departments
  console.log("Seeding department constraints...");

  const constraintsData = [
    { departmentId: seededDepartments[0]!.id, morningCapacity: 2, eveningCapacity: 1, electiveCapacity: 1 },
    { departmentId: seededDepartments[1]!.id, morningCapacity: 2, eveningCapacity: 0, electiveCapacity: 1 },
    { departmentId: seededDepartments[2]!.id, morningCapacity: 2, eveningCapacity: 1, electiveCapacity: 1 },
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

  // Seed iron constraints
  console.log("Seeding iron constraints...");

  const ironConstraints = [
    {
      name: "שעות מקסימליות ליום",
      description: "סטודנטים לא יכולים לעבוד יותר מ-8 שעות ביום אחד",
    },
    {
      name: "מנוחה מינימלית בין משמרות",
      description: "לפחות 12 שעות מנוחה בין משמרות עוקבות",
    },
    {
      name: "ללא שיבוצים חופפים",
      description: "סטודנט לא יכול להיות משובץ לשתי מחלקות בו זמנית",
    },
    {
      name: "עדיפות סבב ראשון",
      description: "סטודנטים בסבב הראשון מקבלים עדיפות במחלקות מועדפות",
    },
    {
      name: "ימים רצופים מקסימליים",
      description: "סטודנטים לא יכולים להיות משובצים יותר מ-5 ימים רצופים",
    },
  ];

  for (const constraint of ironConstraints) {
    const existing = await prisma.ironConstraint.findFirst({
      where: { name: constraint.name },
    });

    if (!existing) {
      await prisma.ironConstraint.create({ data: constraint });
      console.log(`Created iron constraint: ${constraint.name}`);
    } else {
      console.log(`Iron constraint already exists: ${constraint.name}`);
    }
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