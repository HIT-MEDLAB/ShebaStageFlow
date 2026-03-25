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
