/**
 * Fix assignment dates that have incorrect UTC timestamps.
 *
 * Assignments #1 and #4 were stored as 2025-11-08T00:00:00Z (Saturday Nov 8 UTC),
 * which is still Saturday in Israel (UTC+2). They should start on Sunday Nov 9
 * local time, i.e. 2025-11-08T22:00:00Z.
 *
 * End dates are also corrected: Thursday Nov 13 local = 2025-11-12T22:00:00Z.
 *
 * Run: npx tsx prisma/fix-assignment-dates.ts
 */
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import pg from 'pg'
import 'dotenv/config'

const pool = new pg.Pool({
  connectionString: process.env['DATABASE_URL'],
})
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  // Sunday Nov 9, 00:00 Israel time (UTC+2 in November) = 2025-11-08T22:00:00Z
  const correctStart = new Date('2025-11-08T22:00:00.000Z')
  // Thursday Nov 13, 00:00 Israel time = 2025-11-12T22:00:00Z
  const correctEnd = new Date('2025-11-12T22:00:00.000Z')

  for (const id of [1, 4]) {
    const before = await prisma.assignment.findUnique({ where: { id } })
    if (!before) {
      console.log(`Assignment #${id} not found, skipping.`)
      continue
    }

    console.log(`Assignment #${id} BEFORE:`, {
      startDate: before.startDate.toISOString(),
      endDate: before.endDate.toISOString(),
    })

    await prisma.assignment.update({
      where: { id },
      data: {
        startDate: correctStart,
        endDate: correctEnd,
      },
    })

    const after = await prisma.assignment.findUnique({ where: { id } })
    console.log(`Assignment #${id} AFTER:`, {
      startDate: after!.startDate.toISOString(),
      endDate: after!.endDate.toISOString(),
    })
  }

  console.log('\nDone. Assignments #1 and #4 updated.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
