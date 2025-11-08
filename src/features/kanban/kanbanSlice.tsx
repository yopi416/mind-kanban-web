import type {
  KanbanSlice,
  KanbanCardRef,
  KanbanColumnName,
  KanbanColumns,
  WholeStoreState,
  KanbanIndex,
} from '@/types'
import type { StateCreator } from 'zustand'
import { getCurrentPj } from '../mindmap/utils/projectUtils'
import { collectDescendantIdSet } from '../mindmap/utils/nodeTreeUtils'
import { MAX_STACK_SIZE } from '../mindmap/constants'
import { pushUndoSnapshotForProject } from '../mindmap/utils/historyUtils'

export const createKanbanSlice: StateCreator<
  WholeStoreState,
  [['zustand/subscribeWithSelector', never]],
  [],
  KanbanSlice
> = (set) => ({
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
      const targetPjId = cardToAdd.pjId

      // 全カンバン列の中に追加したいノードが既にあれば、処理を中止
      const nodeIdSet = prev.kanbanIndex.get(targetPjId)
      if (!nodeIdSet) return {}

      if (nodeIdSet.has(cardToAdd.nodeId)) {
        return {}
      }

      /*-------------------------------
        親・子ノードを持つノードの追加処理
        - 子ノードを持つ(孫ノード以降も含む)
         - 子ノードが既にkanbanColumnsにあるなら削除
         - 子ノードをすべて kanban indexに追加
        - 親ノードが既に追加済みの場合
         - 追加対象の子ノードは kanban indexに追加済みなので処理が中断される
          (この処理は上部で既に記載済み)
       ------------------------------- */

      //  子ノードIDのsetを取得（親ノードIDも含まれる）
      const targetPj = getCurrentPj(prev.projects, targetPjId)
      const descendantNodeIdSet = collectDescendantIdSet(
        [cardToAdd.nodeId],
        targetPj.nodes
      )

      // 子ノードが既にkanbanColumnsにあるなら削除
      const prevCol = kanbanCols[col]
      const nextCol = [cardToAdd, ...prevCol] // 親ノードはここで追加
      const nextCols = {
        ...kanbanCols,
        [col]: nextCol,
      }

      for (const [colName, cardRefList] of Object.entries(nextCols) as [
        KanbanColumnName,
        KanbanCardRef[],
      ][]) {
        const nextCardRefList = cardRefList.filter((cardRef: KanbanCardRef) => {
          return (
            cardRef.nodeId === cardToAdd.nodeId ||
            !descendantNodeIdSet.has(cardRef.nodeId)
          )
        })
        nextCols[colName] = nextCardRefList
      }

      // 子ノード含め kanban indexに追加
      const nextIndex = new Map(prev.kanbanIndex)
      const oldSet = nextIndex.get(cardToAdd.pjId) ?? new Set()
      const newSet = new Set([...oldSet, ...descendantNodeIdSet]) // Immutablityを保ちつつ子ノードIDを追加
      nextIndex.set(cardToAdd.pjId, newSet)

      // Undo用：更新前グラフをundoStackに格納
      // 念のためdeep copyしたものを格納
      const nextHistoryMap = pushUndoSnapshotForProject({
        nodes: targetPj.nodes,
        edges: targetPj.edges,
        focusedNodeId: prev.focusedNodeId,
        kanbanIndex: prev.kanbanIndex,
        kanbanColumns: prev.kanbanColumns,
        historyByPj: prev.historyByPj,
        pjId: targetPjId,
        maxStackSize: MAX_STACK_SIZE,
      })

      return {
        kanbanIndex: nextIndex,
        kanbanColumns: nextCols,
        historyByPj: nextHistoryMap,
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

  // kanbanIndexとkanbanColumsを同時削除
  removeCard: (cardToRemove: KanbanCardRef) => {
    set((prev) => {
      const kanbanColumns = prev.kanbanColumns
      const targetPjId = cardToRemove.pjId

      //  子ノードIDのsetを取得（親ノードIDも含まれる）
      const targetPj = getCurrentPj(prev.projects, targetPjId)
      const descendantNodeIdSet = collectDescendantIdSet(
        [cardToRemove.nodeId],
        targetPj.nodes
      )

      // 削除後のkanbanIndexの算出
      const nextIndex = new Map(prev.kanbanIndex)
      const oldSet = nextIndex.get(targetPjId) ?? new Set()
      const newSet = new Set(
        [...oldSet].filter((nodeId) => !descendantNodeIdSet.has(nodeId))
      ) // new map時にsetは浅いコピーになっているのでimmutablityを保つ必要有
      nextIndex.set(targetPjId, newSet)

      // 削除後のkanabnColumnsの算出(全カンバンから削除カードをFilter)
      const nextCols: KanbanColumns = { ...kanbanColumns }

      for (const [key, cards] of Object.entries(kanbanColumns) as [
        KanbanColumnName,
        KanbanCardRef[],
      ][]) {
        const nextCol = cards.filter(
          (card) => card.nodeId !== cardToRemove.nodeId
        )

        if (nextCol.length === cards.length) continue

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

      // pjId ごとに 1 回だけ Set をコピーしてから子ノードもまとめて削除する
      // 例: work[pjId] = クローン済みSet
      const work = new Map<string, Set<string>>()

      for (const { pjId, nodeId } of doneCardRefList) {
        // workからpjidのSetを取得
        // 参照なのでsetForPjの変更がworkのsetに反映される
        let setForPj = work.get(pjId)

        // 初回のみnextIndexの該当pjIdのsetをworkにコピー
        if (!setForPj) {
          const oldSet = nextIndex.get(pjId) ?? new Set<string>()
          // new map時にsetは浅いコピーになっているのでimmutablityを保つ
          setForPj = new Set(oldSet)
          // workに同期しておく
          work.set(pjId, setForPj)
        }

        //  子ノードIDのsetを取得（親ノードIDも含まれる）
        const targetPj = getCurrentPj(prev.projects, pjId)
        const descendantNodeIdSet = collectDescendantIdSet(
          [nodeId],
          targetPj.nodes
        )

        // この削除がwork側にも反映される
        for (const idToDelete of descendantNodeIdSet) {
          setForPj.delete(idToDelete)
        }
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
  },
})
