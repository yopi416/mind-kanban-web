import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import type { WholeStoreState } from '@/types'
import { createMindMapSlice } from '@/features/mindmap/mindmapSlice'
import { createKanbanSlice } from '@/features/kanban/kanbanSlice'
import { createOrchestratorSlice } from './OrchestratorSlice'

// MindoMapとKanbanの統合ストア
// 型判定を安定させるためにカリー化
// argsはset, get, api?の3つ
export const useWholeStore = create<WholeStoreState>()(
  subscribeWithSelector((...args) => ({
    ...createMindMapSlice(...args),
    ...createKanbanSlice(...args),
    ...createOrchestratorSlice(...args),
  }))
)
