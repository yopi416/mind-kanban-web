import type {
  KanbanSlice,
  KanbanCard,
  KanbanColumnName,
  KanbanColumns,
  WholeStoreState,
} from '@/types'
import type { StateCreator } from 'zustand'

export const createKanbanSlice: StateCreator<
  WholeStoreState,
  [['zustand/subscribeWithSelector', never]],
  [],
  KanbanSlice
> = (set /*, get*/) => ({
  // ---- Mindmap slice ----
  kanbanColumns: {
    backlog: [],
    todo: [],
    doing: [],
    done: [],
  },
  addCard: (cardToAdd: KanbanCard, col = 'backlog') => {
    set((prev) => {
      const kanbanColumns = prev.kanbanColumns
      for (const cards of Object.values(kanbanColumns)) {
        for (const card of cards) {
          // if (card.nodeId === cardToAdd.nodeId) return {}
          if (card.nodeId === cardToAdd.nodeId) {
            console.log('同じノード有り！！')
            return {}
          }
        }
      }

      const prevCol = kanbanColumns[col]
      const nextCol = [cardToAdd, ...prevCol]
      const nextCols = {
        ...kanbanColumns,
        [col]: nextCol,
      }

      return {
        kanbanColumns: nextCols,
      }
    })
  },
  moveCard: (
    cardToMove: KanbanCard,
    from: KanbanColumnName,
    to: KanbanColumnName,
    toIndex: number
  ) => {
    set((prev) => {
      const kanbanColumns = prev.kanbanColumns

      const prevFromCol = kanbanColumns[from]
      const prevToCol = kanbanColumns[to]

      const nextFromCol = prevFromCol.filter(
        (card) => card.nodeId !== cardToMove.nodeId
      )
      if (prevFromCol.length === nextFromCol.length) {
        console.log('移動するノードが存在しない')
        return {}
      }

      const nextToCal = [
        ...prevToCol.slice(0, toIndex),
        cardToMove,
        ...prevToCol.slice(toIndex),
      ]
      const nextCols: KanbanColumns = {
        ...kanbanColumns,
        [from]: nextFromCol,
        [to]: nextToCal,
      }

      return {
        kanbanColumns: nextCols,
      }
    })
  },
  removeCard: (cardToRemove: KanbanCard) => {
    set((prev) => {
      const kanbanColumns = prev.kanbanColumns
      const nextCols: KanbanColumns = {
        backlog: [],
        todo: [],
        doing: [],
        done: [],
      }

      for (const [key, cards] of Object.entries(kanbanColumns) as [
        KanbanColumnName,
        KanbanCard[],
      ][]) {
        const nextCol = cards.filter(
          (card) => card.nodeId !== cardToRemove.nodeId
        )
        nextCols[key] = nextCol
      }

      return {
        kanbanColumns: nextCols,
      }
    })
  },
})
