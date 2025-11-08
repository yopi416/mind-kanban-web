import type { MinkanData } from '@/types'

export function validateMinkanData(data: unknown): data is MinkanData {
  if (!data || typeof data !== 'object') return false

  const obj = data as Record<string, unknown>

  if (typeof obj.currentPjId !== 'string') return false
  if (!obj.projects || typeof obj.projects !== 'object') return false
  if (!obj.kanbanColumns || typeof obj.kanbanColumns !== 'object') return false
  if (!obj.kanbanIndex || typeof obj.kanbanIndex !== 'object') return false

  return true
}
