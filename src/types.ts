import type { Node, Edge, OnNodesChange, OnEdgesChange } from '@xyflow/react'

export type WholeStoreState = MindMapSlice & KanbanSlice & OrchestratorSlice

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

// mindmapのスライス
export type MindMapSlice = {
  /* 認証管理（開発用） */
  isLogin: boolean
  setIsLogin: (isLogin: boolean) => void

  /* 複数PJ管理 */
  projects: Projects
  setProjects: (newPjs: Projects) => void
  currentPjId: string
  setCurrentPjId: (newPjId: string) => void

  // addPj: () => void
  renamePj: (pjId: string, newPjName: string) => void
  // deletePj: (pjId: string) => void

  /* 選択中のPJのノード・エッジ管理 */
  onNodesChange: OnNodesChange<Node<NodeData>>
  onEdgesChange: OnEdgesChange

  // deleteNodes: (nodeIdToDelete: string) => void
  setNodes: (nodes: Node<NodeData>[]) => void
  // addHorizontalElement: (parentId: string) => void
  // addVerticalElement: (aboveNodeId: string, parentId: string) => void

  // moveNodeTobeChild: (movingNodeId: string, parentId: string) => void

  // moveNodeAboveTarget: (
  //   movingNodeId: string,
  //   belowNodeId: string,
  //   parentId: string
  // ) => void

  // moveNodeBelowTarget: (
  //   movingNodeId: string,
  //   aboveNodeId: string,
  //   parentId: string
  // ) => void

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
  applyKanbanDoneToMindmap: (
    cardRefList: KanbanCardRef[],
    includeSubtasks: boolean
  ) => void

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

// Kanbanボードのスライス

/* Kanbanボードだが、nodedataは保持しない */
export type KanbanCardRef = { pjId: string; nodeId: string }
export type KanbanColumnName = 'backlog' | 'todo' | 'doing' | 'done'

// ex: { backlog: [{id1, pj1}, [id2, pj2]], todo: [{id3, pj1}],,,,, }
export type KanbanColumns = Record<KanbanColumnName, KanbanCardRef[]>

export type KanbanIndex = Map<string, Set<string>> // pjId -> nodeId Set

/* Kanbanボード実体（） */
export type KanbanCardView = {
  nodeId: string | undefined
  nodeData: NodeData | undefined
}
export type KanbanColumnsView = Record<KanbanColumnName, KanbanCardView[]>

export type KanbanSlice = {
  kanbanIndex: KanbanIndex
  setKanbanIndex: (newKanbanIdx: KanbanIndex) => void
  kanbanColumns: KanbanColumns
  setKanbanColumns: (newKanbanRef: KanbanColumns) => void

  // DragOverlay
  activeCardRef: KanbanCardRef | null
  setActiveCardRef: (cardRef: KanbanCardRef | null) => void

  addCard: (card: KanbanCardRef, col: KanbanColumnName) => void
  moveCard: (
    card: KanbanCardRef,
    from: KanbanColumnName,
    to: KanbanColumnName,
    toIndex: number
  ) => void
  removeCard: (card: KanbanCardRef) => void
  removeDoneCards: () => void
}

// Sliceに分割する前のゴミ
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

  deleteNodes: (nodeIdToDelete: string) => void // OrchestratorSliceに移行（未使用）
  setNodes: (nodes: Node<NodeData>[]) => void
  addHorizontalElement: (parentId: string) => void // OrchestratorSliceに移行（未使用）
  addVerticalElement: (aboveNodeId: string, parentId: string) => void // OrchestratorSliceに移行（未使用）

  moveNodeTobeChild: (movingNodeId: string, parentId: string) => void // OrchestratorSliceに移行（未使用）

  moveNodeAboveTarget: (
    movingNodeId: string,
    belowNodeId: string,
    parentId: string
  ) => void // OrchestratorSliceに移行（未使用）

  moveNodeBelowTarget: (
    movingNodeId: string,
    aboveNodeId: string,
    parentId: string
  ) => void // OrchestratorSliceに移行（未使用）

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

/*-------------------------
OrchestratorSlice
(カンバン・マインドマップ両方の更新)
---------------------------*/

export type OrchestratorSlice = {
  addPj: () => void
  deletePj: (pjId: string) => void

  deleteNodesCascade: (nodeIdToDelete: string) => void

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
}
