import { DndContext, DragOverlay } from '@dnd-kit/core'
import type {
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  UniqueIdentifier,
} from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import { useRef } from 'react'

import { Button } from '@/components/ui/button'
import { Link } from 'react-router'
import type {
  KanbanCardRef,
  KanbanColumnName,
  KanbanColumns,
  WholeStoreState,
} from '@/types'
import { KanbanColumn } from './components/KanbanColumn'
import { useWholeStore } from '@/state/store'
import { useShallow } from 'zustand/shallow'
import { OverlayCard } from './components/OverlayCard'

const selector = (store: WholeStoreState) => {
  return {
    setKanbanColumns: store.setKanbanColumns,
    setActiveCardRef: store.setActiveCardRef,
  }
}

function Kanban() {
  const { setKanbanColumns, setActiveCardRef } = useWholeStore(
    useShallow(selector)
  )

  const colNames: KanbanColumnName[] = ['backlog', 'todo', 'doing', 'done']

  // onDragxxで、store更新用

  // 直前の配置と、1フレーム中に更新したかを記録（過度なsetState防止）
  const lastPlacementRef = useRef<{
    id: UniqueIdentifier
    to: string
    index: number
  } | null>(null)

  const movedInFrameRef = useRef(false)

  return (
    <>
      <Button>
        <Link to="/app/mindmap">マインドマップへ移動!!</Link>
      </Button>
      <DndContext
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        {/* <div className="flex items-start gap-4 overflow-x-auto bg-slate-50 p-4">
         */}
        <div className="flex items-start gap-6 overflow-x-auto bg-slate-50 px-6 py-5">
          {colNames.map((colName) => (
            <KanbanColumn key={colName} colName={colName} />
          ))}
        </div>
        <DragOverlay>
          <OverlayCard />
        </DragOverlay>
      </DndContext>

      <p>test</p>
    </>
  )

  function handleDragStart(event: DragStartEvent) {
    // activeカードのidに一致するcarRefをKanbanColumnsから見つける
    const { active } = event
    const activeId = String(active.id)

    const KanbanCols = useWholeStore.getState().kanbanColumns
    let activeCardRef: KanbanCardRef | null = null

    // 【改善余地あり】リストをストアに持っておけば、O(n) ⇒ O(1)に改善可能？
    for (const cardRefList of Object.values(KanbanCols)) {
      const hit = cardRefList.find((cardRef) => cardRef.nodeId === activeId)
      if (hit) {
        activeCardRef = hit
        break
      }
    }

    setActiveCardRef(activeCardRef)
  }

  function handleDragOver(event: DragOverEvent) {
    // 1フレームに1回だけ更新
    if (movedInFrameRef.current) return

    const { active, over } = event

    if (!over) {
      // setActiveCardId(null)
      return
    }

    const activeId = String(active.id)
    const overId = String(over.id)

    if (!overId || activeId === overId) {
      // setActiveCardId(null)
      return
    }

    // active, overが所属するカラムの取得
    const prevCols = useWholeStore.getState().kanbanColumns
    const ColNames = Object.keys(prevCols) as KanbanColumnName[]

    const activeColName = ColNames.find((ColName) =>
      prevCols[ColName].some((card) => card.nodeId === activeId)
    )
    let overColName = ColNames.find((ColName) =>
      prevCols[ColName].some((card) => card.nodeId === overId)
    )

    // overがカードではなく、KanbanColumnsのkeyの場合、overId自体がColumnNameということになる
    if (!overColName && prevCols[overId as KanbanColumnName]) {
      overColName = overId as KanbanColumnName
    }

    if (!activeColName || !overColName || activeColName === overColName) return

    // 更新対象のKanbanColumnに所属するカードRef配列（更新前）の取得
    const activeCardRefList = prevCols[activeColName]
    const overCardRefList = prevCols[overColName]

    const activeCardRef = activeCardRefList.find(
      (card) => card.nodeId === activeId
    )
    if (!activeCardRef) return

    // 注意: Drop先がkanbanColumnの場合(主にColumnが空の場合を想定) -1を返す
    const overCardIndex = overCardRefList.findIndex(
      (card) => card.nodeId === overId
    )

    const isBelowOverItm =
      active.rect.current.translated &&
      active.rect.current.translated.top > over.rect.top + over.rect.height

    // Drop先がContainer本体の場合, :後の判定の値になる
    // ⇒ 先頭(カード無し時の対応) OR 末尾（カード有時）
    const insertIndexRaw =
      overCardIndex >= 0
        ? overCardIndex + (isBelowOverItm ? 1 : 0)
        : overCardRefList.length

    // 範囲外アクセスを防止
    const insertIndex = Math.max(
      0, // 下限は0
      Math.min(overCardRefList.length, insertIndexRaw) // 上限は配列長
    )

    // 前回のソートと同じ状況ならば,更新しない
    // コンテナ間移動時に、1度だけこれにより無駄なレンダリング防止できるぐらい
    // よって、正直効果は薄いのだが、レンダリング回数削減のために残す
    if (
      lastPlacementRef.current &&
      lastPlacementRef.current.id === activeId &&
      lastPlacementRef.current.to === overColName &&
      lastPlacementRef.current.index === insertIndex
    )
      return

    // ↑と同じくなくてもよいが、念のため残す
    if (
      overCardRefList[insertIndex]?.nodeId === activeId ||
      (overCardIndex < 0 &&
        overCardRefList[overCardRefList.length - 1]?.nodeId === activeId)
    )
      return

    // 元のカード群から、移動中のカード（active）を削除
    const nextActiveCardRefList = activeCardRefList.filter(
      (cardRef) => cardRef.nodeId !== activeId
    )

    // 移動先カード（over）が所属するカード群に、移動中のカードを挿入
    const nextOverCardRefList = [
      ...overCardRefList.slice(0, insertIndex),
      activeCardRef,
      ...overCardRefList.slice(insertIndex),
    ]

    // 次のカンバン
    const nextCols: KanbanColumns = {
      ...prevCols,
      [activeColName]: nextActiveCardRefList,
      [overColName]: nextOverCardRefList,
    }

    // 更新前に今回の更新情報を保持
    // 本情報を基に次回のhandleDragOverにて、同じ処理を使用としているかを判断
    // 同じ処理の場合 return
    lastPlacementRef.current = {
      id: activeId,
      to: overColName,
      index: insertIndex,
    }

    // setStateが行われるのを1フレームに1回とする
    movedInFrameRef.current = true // 次フレームまでは、handleDragOverを即returnする
    requestAnimationFrame(() => (movedInFrameRef.current = false))

    console.log('onDragOver!!!')

    setKanbanColumns(nextCols)
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    lastPlacementRef.current = null

    if (!over) {
      // setActiveCardId(null)
      return
    }

    const activeId = String(active.id)
    const overId = String(over.id)

    if (!overId || activeId === overId) {
      // setActiveCardId(null)
      return
    }

    // active, overが所属しているカラムの取得
    const prevCols = useWholeStore.getState().kanbanColumns
    const ColNames = Object.keys(prevCols) as KanbanColumnName[]

    // 各カラムの中に、active, overしているカードがあるかチェック
    const activeColName = ColNames.find((ColName) =>
      prevCols[ColName].some((card) => card.nodeId === activeId)
    )
    const overColName = ColNames.find((ColName) =>
      prevCols[ColName].some((card) => card.nodeId === overId)
    )

    // let activeColumnName = undefined
    // let overColumnName = undefined

    // for (const [columnName, cards] of Object.entries(prevColumns) as [KanbanColumnName, KanbanCardRef[]][]) {
    //   for (const card of cards) {
    //     if(card.nodeId === activeId) activeColumnName = columnName
    //     if(card.nodeId === overId) overColumnName = columnName
    //   }
    // }

    // 同一コンテナ内の入れ替えのみ処理(コンテナ間入れ替えは onDragOver管轄)
    if (!activeColName || !overColName || activeColName !== overColName) {
      // setActiveCardId(null)
      return
    }

    // 更新対象のKanbanColumnに所属するノードRef配列（更新前）の取得
    const prevCardRefList = prevCols[activeColName]

    // activ, overCardのIndex(変更前)の取得
    const from = prevCardRefList.findIndex(
      (cardRef) => cardRef.nodeId === activeId
    )
    const to = prevCardRefList.findIndex((cardRef) => cardRef.nodeId === overId)

    if (from < 0 || to < 0 || from === to) return

    // 更新対象のKanbanColumnに所属するノードRef配列（更新後）の取得
    const nextCardRefList = arrayMove<KanbanCardRef>(prevCardRefList, from, to) //カードの入れ替え

    // 更新後のKanbanColumnsの作成
    const nextColumns: KanbanColumns = {
      ...prevCols,
      [activeColName]: nextCardRefList,
    }

    console.log('onDragEnd!!!')

    setKanbanColumns(nextColumns)
  }

  function handleDragCancel(event: DragEndEvent) {
    console.log(event)
  }
}

export default Kanban
