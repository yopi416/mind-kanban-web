import type {
  KanbanSlice,
  KanbanCardRef,
  KanbanColumnName,
  KanbanColumns,
  WholeStoreState,
  KanbanIndex,
} from '@/types'
import type { StateCreator } from 'zustand'

export const createKanbanSlice: StateCreator<
  WholeStoreState,
  [['zustand/subscribeWithSelector', never]],
  [],
  KanbanSlice
> = (set /*, get*/) => ({
  // ---- Mindmap slice ----
  kanbanIndex: new Map<string, Set<string>>(),
  setKanbanIndex: (newKanbanIdx: KanbanIndex) => {
    set({
      kanbanIndex: newKanbanIdx,
    })
  },
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

  // kanbanIndexとkanbanColumsに同時追加
  addCard: (cardToAdd: KanbanCardRef, col = 'backlog') => {
    set((prev) => {
      const kanbanCols = prev.kanbanColumns

      // 全カンバン列の中に同じノードがあれば、処理を中止

      for (const nodeIdSet of prev.kanbanIndex.values()) {
        if (nodeIdSet.has(cardToAdd.nodeId)) {
          console.log('同じカードが存在！！')
          return {}
        }
      }

      // 追加後のkanbanIndexの算出
      const nextIndex = new Map(prev.kanbanIndex)
      const oldSet = nextIndex.get(cardToAdd.pjId) ?? new Set()
      const newSet = new Set(oldSet) // new map時にsetは浅いコピーになっているのでimmutablityを保つ必要有
      newSet.add(cardToAdd.nodeId)
      nextIndex.set(cardToAdd.pjId, newSet)

      // 追加後のkanbanColumsの算出
      const prevCol = kanbanCols[col]
      const nextCol = [cardToAdd, ...prevCol]
      const nextCols = {
        ...kanbanCols,
        [col]: nextCol,
      }

      return {
        kanbanIndex: nextIndex,
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

  // kanbanIndexとkanbanColumsに同時削除
  removeCard: (cardToRemove: KanbanCardRef) => {
    set((prev) => {
      const kanbanColumns = prev.kanbanColumns
      const nextCols: KanbanColumns = {
        backlog: [],
        todo: [],
        doing: [],
        done: [],
      }

      // 削除後のkanbanIndexの算出
      const nextIndex = new Map(prev.kanbanIndex)
      const oldSet = nextIndex.get(cardToRemove.pjId) ?? new Set()
      const newSet = new Set(oldSet) // new map時にsetは浅いコピーになっているのでimmutablityを保つ必要有
      newSet.delete(cardToRemove.nodeId)
      nextIndex.set(cardToRemove.pjId, newSet)

      // 削除後のkanabnColumnsの算出(全カンバンから削除カードをFilter)
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
        kanbanIndex: nextIndex,
        kanbanColumns: nextCols,
      }
    })
  },
})
