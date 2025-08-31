import type { StackItem, NodeData, History, HistoryByPj } from '@/types'
import type { Node, Edge } from '@xyflow/react'

// undo/redoスタック追加用nodes,edgesをdeepcopy
export const cloneSnapshot = (
  nodes: Node<NodeData>[],
  edges: Edge[],
  focusedNodeId: string | null
): StackItem => {
  return {
    nodes: structuredClone(nodes),
    edges: structuredClone(edges),
    focusedNodeId,
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
