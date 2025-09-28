import type {
  StackItem,
  NodeData,
  History,
  HistoryByPj,
  KanbanIndex,
  KanbanColumns,
} from '@/types'
import type { Node, Edge } from '@xyflow/react'
import { MAX_STACK_SIZE } from '../constants'

// undo/redoスタック追加用nodes,edgesをdeepcopy
export const cloneSnapshot = (
  nodes: Node<NodeData>[],
  edges: Edge[],
  focusedNodeId: string | null,
  kanbanIndex: KanbanIndex,
  kanbanColumns: KanbanColumns
): StackItem => {
  return {
    nodes: structuredClone(nodes),
    edges: structuredClone(edges),
    focusedNodeId,
    kanbanIndex: cloneKanbanIndex(kanbanIndex),
    kanbanColumns: cloneKanbanColumns(kanbanColumns),
  }
}

// Map<string, Set<string>> の安全クローン
function cloneKanbanIndex(idx: KanbanIndex): KanbanIndex {
  const next = new Map<string, Set<string>>()
  for (const [pjId, set] of idx) {
    next.set(pjId, new Set(set)) // Set も複製
  }
  return next
}

// 各列の配列と要素オブジェクトを複製
function cloneKanbanColumns(cols: KanbanColumns): KanbanColumns {
  return {
    backlog: cols.backlog.map((c) => ({ ...c })),
    todo: cols.todo.map((c) => ({ ...c })),
    doing: cols.doing.map((c) => ({ ...c })),
    done: cols.done.map((c) => ({ ...c })),
  }
}

// 上限からあふれる場合はslideし、古いものを追い出す
export function pushToStack(
  stack: StackItem[],
  item: StackItem,
  maxSize: number
): StackItem[] {
  const newStack = [...stack, item].slice(-maxSize)
  return newStack
}

export function popFromStack(
  stack: StackItem[]
): [StackItem | undefined, StackItem[]] {
  if (stack.length === 0) return [undefined, []]

  const lastIndex = stack.length - 1
  const poppedItem = stack[lastIndex]
  const restStack = stack.slice(0, -1)

  return [poppedItem, restStack]
}

// pushに加えて、redoStackのclearも実施
export function pushUndoItem(
  history: History,
  undoItem: StackItem,
  maxSize: number
): History {
  const { undoStack } = history
  const newUndoStack = pushToStack(undoStack, undoItem, maxSize)
  return { undoStack: newUndoStack, redoStack: [] }
}

export function createEmptyHistory(): History {
  return {
    undoStack: [],
    redoStack: [],
  }
}

// historyByProjectの初期値は{}
// よって、最初にundoStackを操作する時に、currentPjに対応するhistoryは存在しない
// 存在しない場合は、空Historyを作成しreturn

export function getCurrentHistory(
  historyByPj: HistoryByPj,
  pjId: string
): History {
  const currentHistory = historyByPj[pjId] ?? createEmptyHistory()
  return currentHistory
}

// currentPjに対応するhistoryを更新
export function updateHistoryMap(
  historyByPj: HistoryByPj,
  currentPjId: string,
  newHistory: History
): HistoryByPj {
  return {
    ...historyByPj,
    [currentPjId]: newHistory,
  }
}

// UndoStackに積む一連の関数をまとめた関数
export function pushUndoSnapshotForProject(args: {
  // 生成するUndoItem
  nodes: Node<NodeData>[]
  edges: Edge[]
  focusedNodeId: string | null
  kanbanIndex: KanbanIndex
  kanbanColumns: KanbanColumns

  // 特定のpjのhistoryに追加用
  historyByPj: HistoryByPj
  pjId: string
  maxStackSize?: number // 既定: MAX_STACK_SIZE
}): HistoryByPj {
  // 引数の順番ずれや、今後の追加を鑑みてオブジェクトを引数とする
  const {
    historyByPj,
    pjId,
    nodes,
    edges,
    focusedNodeId,
    kanbanIndex,
    kanbanColumns,
    maxStackSize = MAX_STACK_SIZE,
  } = args

  const undoItem: StackItem = cloneSnapshot(
    nodes,
    edges,
    focusedNodeId,
    kanbanIndex,
    kanbanColumns
  )

  const currentHistory = getCurrentHistory(historyByPj, pjId)
  const nextHistory = pushUndoItem(currentHistory, undoItem, maxStackSize)

  // 不変更新（該当PJのみ差し替え）
  return updateHistoryMap(historyByPj, pjId, nextHistory)
}
