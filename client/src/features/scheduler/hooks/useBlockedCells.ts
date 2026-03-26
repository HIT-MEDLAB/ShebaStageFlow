import { useMemo } from 'react'
import type { ConstraintsResponse, WeekDefinition, BlockReason } from '../types/scheduler.types'

/**
 * Computes blocked cell map from constraints + holidays.
 *
 * Cell keys use the format:
 * - "dept:{departmentId}:week:{weekNumber}" for department-specific blocks
 * - "holiday:week:{weekNumber}" for hospital-wide holiday blocks
 */
export function useBlockedCells(
  constraints: ConstraintsResponse | undefined,
  weeks: WeekDefinition[],
): Map<string, BlockReason> {
  return useMemo(() => {
    const blocked = new Map<string, BlockReason>()
    if (!constraints || !weeks.length) return blocked

    // Holiday blocking: if any holiday date falls within a week's Sun-Thu range,
    // block ALL departments for that week (hospital-wide closure)
    for (const week of weeks) {
      for (const holiday of constraints.holidays) {
        const holidayDate = new Date(holiday.date)
        if (holidayDate >= week.startDate && holidayDate <= week.endDate) {
          blocked.set(`holiday:week:${week.weekNumber}`, {
            type: 'holiday',
            description: holiday.name,
          })
        }
      }
    }

    // Department date blocks
    for (const dc of constraints.departmentConstraints) {
      if (dc.blockedStartDate && dc.blockedEndDate) {
        const blockStart = new Date(dc.blockedStartDate)
        const blockEnd = new Date(dc.blockedEndDate)
        for (const week of weeks) {
          // Check if week overlaps with blocked date range
          if (week.startDate <= blockEnd && week.endDate >= blockStart) {
            blocked.set(`dept:${dc.departmentId}:week:${week.weekNumber}`, {
              type: 'dateBlock',
              description: 'Department blocked on these dates',
            })
          }
        }
      }
    }

    // Soft constraint blocking
    if (constraints.softConstraints) {
      for (const sc of constraints.softConstraints) {
        const scStart = new Date(sc.startDate)
        const scEnd = new Date(sc.endDate)
        for (const week of weeks) {
          if (week.startDate <= scEnd && week.endDate >= scStart) {
            if (sc.departmentId) {
              const key = `soft:dept:${sc.departmentId}:week:${week.weekNumber}`
              if (!blocked.has(key)) {
                blocked.set(key, {
                  type: 'softConstraint',
                  description: sc.description,
                  constraintName: sc.name,
                })
              }
            } else {
              const key = `soft:week:${week.weekNumber}`
              if (!blocked.has(key)) {
                blocked.set(key, {
                  type: 'softConstraint',
                  description: sc.description,
                  constraintName: sc.name,
                })
              }
            }
          }
        }
      }
    }

    return blocked
  }, [constraints, weeks])
}
