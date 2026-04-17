import { useMemo } from 'react'
import type { Assignment } from '../types/scheduler.types'

/**
 * Derives a Map<groupId, Assignment[]> from the assignment list.
 * Only includes assignments that have a groupId.
 * Each group is sorted by groupIndex.
 */
export function useBlockGroups(assignments: Assignment[] | undefined) {
  return useMemo(() => {
    const map = new Map<string, Assignment[]>()
    if (!assignments) return map
    for (const a of assignments) {
      if (a.groupId) {
        const group = map.get(a.groupId)
        if (group) {
          group.push(a)
        } else {
          map.set(a.groupId, [a])
        }
      }
    }
    // Sort each group by groupIndex
    for (const group of map.values()) {
      group.sort((a, b) => (a.groupIndex ?? 0) - (b.groupIndex ?? 0))
    }
    return map
  }, [assignments])
}

/** Get block info for a single assignment */
export function getBlockInfo(
  assignment: Assignment,
  blockGroups: Map<string, Assignment[]>,
): { isBlock: boolean; position: number; total: number } | null {
  if (!assignment.groupId) return null
  const group = blockGroups.get(assignment.groupId)
  if (!group || group.length <= 1) return null
  return {
    isBlock: true,
    position: (assignment.groupIndex ?? 0) + 1,
    total: group.length,
  }
}
