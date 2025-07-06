import type {
  Node,
  Edge,
  OnNodesChange,
  OnEdgesChange,
  OnNodesDelete,
} from '@xyflow/react'

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

export type MindMapStore = {
  nodes: Node<NodeData>[]
  edges: Edge[]
  onNodesChange: OnNodesChange<Node<NodeData>>
  onEdgesChange: OnEdgesChange
  onNodesDelete: OnNodesDelete<Node<NodeData>>
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
  updateIsDone: (nodeId: string, isDone: boolean) => void
  addComment: (nodeId: string, content: string) => void
  editComment: (
    nodeId: string,
    commentId: string,
    updatedContent: string
  ) => void
  deleteComment: (nodeId: string, commentId: string) => void
}
