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
> = (set, get) => ({
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
  removeDoneCards: () => {
    set((prev) => {
      const doneCardRefList = prev.kanbanColumns.done
      if (doneCardRefList.length === 0) return prev

      // 1) kanbanIndex を「影響PJだけ」immutably 更新
      const nextIndex = new Map(prev.kanbanIndex)

      // pjId ごとに 1 回だけ Set をコピーしてから削除する
      // 例: work[pjId] = クローン済みSet
      const work = new Map<string, Set<string>>()

      for (const { pjId, nodeId } of doneCardRefList) {
        // workからpjidのSetを取得
        // 参照を取得しているのでsetForPjの変更がworkのsetの変更に反映される
        let setForPj = work.get(pjId)

        // 初回のみnextIndexの該当pjIdのsetをworkにコピー
        if (!setForPj) {
          const oldSet = nextIndex.get(pjId) ?? new Set<string>()
          // new map時にsetは浅いコピーになっているのでimmutablityを保つ
          setForPj = new Set(oldSet)
          // workに同期しておく
          work.set(pjId, setForPj)
        }

        // この削除がwork側にも反映される
        setForPj.delete(nodeId)
      }

      // 変更があったpjのみnextIndexに反映
      for (const [pjId, clonedSet] of work.entries()) {
        nextIndex.set(pjId, clonedSet)
      }

      // 2) kanbanColumns は done だけ空に差し替え（他列は参照共有で無駄な再レンダ回避）
      const nextCols: KanbanColumns = {
        ...prev.kanbanColumns,
        done: [],
      }

      return {
        kanbanIndex: nextIndex,
        kanbanColumns: nextCols,
      }
    })

    console.log(get().kanbanColumns)
    console.log(get().kanbanIndex)
  },
})
