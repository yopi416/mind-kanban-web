import type { Node, Edge, OnNodesChange, OnEdgesChange } from '@xyflow/react'

export type NodeComment = {
  id: string
  content: string
  createdAt: string
}

export type NodeData = {
  label: string
  parentId?: string | null
  isDone: boolean
  comments: NodeComment[]
}

export type Project = {
  id: string
  name: string
  nodes: Node<NodeData>[]
  edges: Edge[]
  createdAt: string
  updatedAt: string
}

export type Projects = Record<string, Project>

// HistoryStack ClassのImplements用
export interface Stack<T> {
  push(item: T): void
  pop(): T | undefined
  clear(): void
  readonly size: number
  readonly isEmpty: boolean
}

export type StackItem = {
  nodes: Node<NodeData>[]
  edges: Edge[]
}

export type History = {
  undoStack: Stack<StackItem>
  redoStack: Stack<StackItem>
}

export type MindMapStore = {
  // nodes: Node<NodeData>[]
  // edges: Edge[]
  projects: Projects
  currentPjId: string
  setCurrentPjId: (newPjId: string) => void
  addPj: () => void
  renamePj: (pjId: string, newPjName: string) => void
  deletePj: (pjId: string) => void
  onNodesChange: OnNodesChange<Node<NodeData>>
  onEdgesChange: OnEdgesChange
  deleteNodes: (nodeIdToDelete: string) => void
  setNodes: (nodes: Node<NodeData>[]) => void
  addHorizontalElement: (parentId: string) => void
  addVerticalElement: (aboveNodeId: string, parentId: string) => void
  moveNodeTobeChild: (movingNodeId: string, parentId: string) => void
  moveNodeAboveTarget: (
    movingNodeId: string,
    belowNodeId: string,
    parentId: string
  ) => void
  moveNodeBelowTarget: (
    movingNodeId: string,
    aboveNodeId: string,
    parentId: string
  ) => void
  updateNodeLabel: (nodeId: string, label: string) => void
  movingNodeId: string | null //移動するためにドラッグしているノード
  setMovingNodeId: (nodeId: string | null) => void
  focusedNodeId: string | null //focus中のノード
  setFocusedNodeId: (nodeId: string | null) => void
  editingNodeId: string | null //textareaを編集中のノード
  setEditingNodeId: (nodeId: string | null) => void
  commentPopupId: string | null //コメントをpopupするノード
  setCommentPopupId: (nodeId: string | null) => void
  updateIsDone: (nodeId: string, isDone: boolean) => void
  addComment: (nodeId: string, content: string) => void
  editComment: (
    nodeId: string,
    commentId: string,
    updatedContent: string
  ) => void
  deleteComment: (nodeId: string, commentId: string) => void
  showDoneNodes: boolean
  setShowDoneNodes: (show: boolean) => void
  history: History // undo・redo用
  undo: () => void
  redo: () => void
  undoCount: number // undo可能回数のカウント
  redoCount: number // redo可能回数のカウント
}
