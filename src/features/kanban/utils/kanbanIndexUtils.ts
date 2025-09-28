import type { KanbanIndex } from '@/types'

export function addNodeIdToIndex(
  idx: KanbanIndex,
  pjId: string,
  idToAdd: string
): KanbanIndex {
  const nextIndex = new Map(idx)
  const oldSet = nextIndex.get(pjId) ?? new Set()
  const newSet = new Set([...oldSet, idToAdd]) // Immutablityを保ちつつ子ノードIDを追加
  nextIndex.set(pjId, newSet)

  return nextIndex
}

export function addIndexSubtree(
  idx: KanbanIndex,
  pjId: string,
  idSetToAdd: Set<string>
): KanbanIndex {
  console.log(idx)
  const nextIndex = new Map(idx)

  const oldSet = nextIndex.get(pjId) ?? new Set()
  const newSet = new Set([...oldSet, ...idSetToAdd]) // Immutablityを保ちつつ子ノードIDを追加
  nextIndex.set(pjId, newSet)

  console.log(nextIndex)

  return nextIndex
}

export function pruneIndexSubtree(
  idx: KanbanIndex,
  pjId: string,
  idSetToDelete: Set<string>
): KanbanIndex {
  // console.log(idx)
  const nextIndex = new Map(idx)

  const oldSet = nextIndex.get(pjId) ?? new Set()
  const newSet = new Set(
    [...oldSet].filter((nodeId) => !idSetToDelete.has(nodeId))
  ) // new map時にsetは浅いコピーになっているのでimmutablityを保つ必要有
  nextIndex.set(pjId, newSet)

  // console.log(nextIndex)

  return nextIndex
}

export function addPjToIndex(idx: KanbanIndex, pjId: string): KanbanIndex {
  // 新規作成したProjectに対応する空のsetを追加
  const nextIndex = new Map(idx)
  nextIndex.set(pjId, new Set([]))

  return nextIndex
}

export function removeProjectFromIndex(
  idx: KanbanIndex,
  pjId: string
): KanbanIndex {
  const nextIndex = new Map(idx)
  nextIndex.delete(pjId)
  return nextIndex
}
