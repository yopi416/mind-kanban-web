import type { KanbanIndex, KanbanIndexJSON } from '@/types'

// kanbanIndexをFE-BE側で扱える形に相互変換するユーティリティ関数
// kanbanIndexはFEでは、setを使用しているが、JSON形式時にsetが表現できない

// FE ⇒ BE
// Map<string, Set<string>> ⇒  Record<string, string[]>に変換
export function serializeKanbanIndex(
  kanbanIndex: KanbanIndex
): KanbanIndexJSON {
  const result: KanbanIndexJSON = {}

  // 各キーに対して、Setをstring[]に変換し保存
  for (const [pjId, nodeIdSet] of kanbanIndex) {
    const arr = Array.from(nodeIdSet)
    result[pjId] = arr
  }

  return result
}

// BE ⇒ FE
// Record<string, string[]> ⇒ Map<string, Set<string>>に変換
export function deserializeKanbanIndex(
  kanbanIndexJson: KanbanIndexJSON
): KanbanIndex {
  const result: KanbanIndex = new Map()

  for (const [pjId, nodeIdArr] of Object.entries(kanbanIndexJson)) {
    const set = new Set(nodeIdArr)
    result.set(pjId, set)
  }

  return result
}
