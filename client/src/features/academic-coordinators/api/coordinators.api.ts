import { apiClient } from '@/lib/apiClient'
import type { Coordinator } from '../types/coordinator.types'
import type { CoordinatorFormValues } from '../schemas/coordinator.schemas'

export async function fetchCoordinators(): Promise<Coordinator[]> {
  const { data } = await apiClient.get<Coordinator[]>('/coordinators')
  return data
}

export async function createCoordinator(payload: CoordinatorFormValues): Promise<Coordinator> {
  const { data } = await apiClient.post<Coordinator>('/coordinators', payload)
  return data
}

export async function updateCoordinator(id: number, payload: Partial<CoordinatorFormValues>): Promise<Coordinator> {
  const { data } = await apiClient.patch<Coordinator>(`/coordinators/${id}`, payload)
  return data
}

export async function deleteCoordinator(id: number): Promise<void> {
  await apiClient.delete(`/coordinators/${id}`)
}
