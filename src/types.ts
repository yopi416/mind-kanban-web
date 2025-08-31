import type { Node, Edge, OnNodesChange, OnEdgesChange } from '@xyflow/react'

/* Nodeの中身を規定 */
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

/* 複数PJ対応 */
export type Project = {
  id: string
  name: string
  nodes: Node<NodeData>[]
  edges: Edge[]
  createdAt: string
  updatedAt: string
}

// PJが複数あり、それぞれにGraphを持つ
export type Projects = Record<string, Project>

/* undo/redo関連 */
// 前後の状態を差分ではなく、Graphの状態を丸々保存
export type StackItem = {
  nodes: Node<NodeData>[]
  edges: Edge[]
  focusedNodeId: string | null
}
export type History = {
  undoStack: StackItem[]
  redoStack: StackItem[]
}

// PJ毎個別で履歴を管理
export type HistoryByPj = Record<string, History>

// CustomNode.tsxのtextarea編集のundo管理に使用
export type EditSnapshot = {
  pjId: string
  nodes: Node<NodeData>[]
  edges: Edge[]
  focusedNodeId: string | null
}

/* zustand store */
export type MindMapStore = {
  /* 複数PJ管理 */
  projects: Projects
  currentPjId: string
  setCurrentPjId: (newPjId: string) => void

  addPj: () => void
  renamePj: (pjId: string, newPjName: string) => void
  deletePj: (pjId: string) => void

  /* 選択中のPJのノード・エッジ管理 */
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

  /* 1ノード内の情報管理 */
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

  /* undo・redo管理 */
  historyByPj: HistoryByPj
  pushPrevGraphToUndo: (currentPjId: string, prevGraph: StackItem) => void

  undo: () => void
  redo: () => void
}
