import type { Stack, StackItem, NodeData } from '@/types'
import { type MindMapStore } from '../../../types'
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

// undo/redoスタック操作後のカウンタ同期
type SetFn = (
  partial:
    | Partial<MindMapStore>
    | ((state: MindMapStore) => Partial<MindMapStore>)
) => void

type GetFn = () => MindMapStore

export const syncHistoryCounters = (getStore: GetFn, setStore: SetFn) => {
  const { undoStack, redoStack } = getStore().history
  setStore({
    undoCount: undoStack.size,
    redoCount: redoStack.size,
  })
}

// 変更時のundo追加/redo初期化処理
export function pushUndoItem(
  getStore: GetFn,
  setStore: SetFn,
  undoItem: StackItem
) {
  const { undoStack, redoStack } = getStore().history

  undoStack.push(undoItem)
  redoStack.clear()

  syncHistoryCounters(getStore, setStore)
}

// undo/redo Stackのリセット
export function clearHistory(getStore: GetFn, setSTore: SetFn) {
  const { undoStack, redoStack } = getStore().history
  undoStack.clear()
  redoStack.clear()
  syncHistoryCounters(getStore, setSTore)
}
