import type {
  KanbanSlice,
  KanbanCardRef,
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
  setKanbanColumns: (newKanbanColumns: KanbanColumns) => {
    set({
      kanbanColumns: newKanbanColumns,
    })
  },

  activeCardRef: null,
  setActiveCardRef: (cardRef: KanbanCardRef | null) => {
    set({
      activeCardRef: cardRef,
    })
  },

  addCard: (cardToAdd: KanbanCardRef, col = 'backlog') => {
    set((prev) => {
      const kanbanCols = prev.kanbanColumns
      for (const cardRefList of Object.values(kanbanCols)) {
        for (const cardRef of cardRefList) {
          // if (card.nodeId === cardToAdd.nodeId) return {}
          if (cardRef.nodeId === cardToAdd.nodeId) {
            console.log('同じノード有り！！')
            return {}
          }
        }
      }

      const prevCol = kanbanCols[col]
      const nextCol = [cardToAdd, ...prevCol]
      const nextCols = {
        ...kanbanCols,
        [col]: nextCol,
      }

      return {
        kanbanColumns: nextCols,
      }
    })
  },
  moveCard: (
    cardToMove: KanbanCardRef,
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
  removeCard: (cardToRemove: KanbanCardRef) => {
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
        KanbanCardRef[],
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
