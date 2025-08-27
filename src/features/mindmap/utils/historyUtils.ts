import type { Stack, StackItem, NodeData, History, SetStore } from '@/types'
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
export function pushUndoItem(
  history: History,
  undoItem: StackItem
): { undoCount: number; redoCount: number } {
  const { undoStack, redoStack } = history
  undoStack.push(undoItem)
  redoStack.clear()
  return { undoCount: undoStack.size, redoCount: redoStack.size }
}

// undo/redo Stackのリセット
export function clearHistory(history: History, setStore: SetStore) {
  const { undoStack, redoStack } = history
  undoStack.clear()
  redoStack.clear()

  setStore({
    undoCount: undoStack.size,
    redoCount: redoStack.size,
  })
}
