import type { StackItem, NodeData, History, HistoryByPj } from '@/types'
import type { Node, Edge } from '@xyflow/react'

//  Undo/Redo用 Utils

export class HistoryStack<T> implements Stack<T> {
  private items: T[] = []
  private readonly capacity: number

  constructor(capacity: number) {
    if (!Number.isInteger(capacity) || capacity < 1) {
      throw new Error(`capacity must be an integer >= 1. got: ${capacity}`)
    }
    this.capacity = capacity
  }

  //スタックが満杯の場合、slideさせてからpush
  push(itemToPush: T): void {
    if (this.items.length >= this.capacity) {
      this.items.shift()
    }
    this.items.push(itemToPush)
  }
  pop(): T | undefined {
    return this.items.pop()
  }
  clear(): void {
    this.items = []
  }

  get size(): number {
    return this.items.length
  }
  get isEmpty(): boolean {
    return this.items.length === 0
  }
}

// undo/redoスタック追加用nodes,edgesをdeepcopy
export const cloneSnapshot = (
  nodes: Node<NodeData>[],
  edges: Edge[]
): StackItem => {
  return {
    nodes: structuredClone(nodes),
    edges: structuredClone(edges),
  }
}

// undo/redoスタック操作はpush,popなどで行われるので、Reactが変更に気づけない
// そのため、undoCount,redoCountで、スタック変更を管理
// この関数により、スタック変更後の状態をカウンタ同期させる
// export const syncHistoryCounters = (history: History, setStore: SetStore) => {
//   const { undoStack, redoStack } = history
//   setStore({
//     undoCount: undoStack.size,
//     redoCount: redoStack.size,
//   })
// }

// 変更前状態をUndoStackに追加しつつ、変更後のカウンタを返す
// export function pushUndoItem(
//   history: History,
//   undoItem: StackItem
// ): { undoCount: number; redoCount: number } {
//   const { undoStack, redoStack } = history
//   undoStack.push(undoItem)
//   redoStack.clear()
//   return { undoCount: undoStack.size, redoCount: redoStack.size }
// }

// pushの際に、上限からあふれた場合はslideする
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

// 初ロード時 or PJ変更時に使用
// historyByProjectの初期値は{}なので、[currentPjId]がundefined
// その際にcurrentPjIdをキーとする、空Historyを作成する
export function createEmptyHistory(): History {
  return {
    undoStack: [],
    redoStack: [],
  }
}

// currentPjに対応するhistoryを読み込む
// その際に、存在しなければ空stackを作成
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
