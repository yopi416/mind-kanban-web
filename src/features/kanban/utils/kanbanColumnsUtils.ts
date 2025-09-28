import type { KanbanCardRef, KanbanColumnName, KanbanColumns } from '@/types'

// 子ノード含めKanbanColumnsから削除
export function pruneColumnsSubtree(
  cols: KanbanColumns,
  idSetToDelete: Set<string>
): KanbanColumns {
  if (idSetToDelete.size === 0) return cols

  console.log(cols)
  const nextCols: KanbanColumns = { ...cols }

  for (const [colName, cardRefList] of Object.entries(nextCols) as [
    KanbanColumnName,
    KanbanCardRef[],
  ][]) {
    const nextCardRefList = cardRefList.filter(
      (cardRef: KanbanCardRef) => !idSetToDelete.has(cardRef.nodeId)
    )

    // 削除がなかった列は更新しない
    if (nextCardRefList.length === cardRefList.length) continue
    nextCols[colName] = nextCardRefList
  }

  console.log(nextCols)
  return nextCols
}

// あるPjのCardRefを全削除
export function removeCardByPjId(
  cols: KanbanColumns,
  pjId: string
): KanbanColumns {
  const nextCols: KanbanColumns = { ...cols }

  for (const [colName, cardRefList] of Object.entries(nextCols) as [
    KanbanColumnName,
    KanbanCardRef[],
  ][]) {
    const nextCardRefList = cardRefList.filter(
      (cardRef: KanbanCardRef) => cardRef.pjId !== pjId
    )
    nextCols[colName] = nextCardRefList
  }

  return nextCols
}
