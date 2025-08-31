import { type Node, type Edge } from '@xyflow/react'
import { type NodeData, type Project } from '../../../types'
import {
  ROOT_NODE_ID,
  DEFAULT_NODE_TYPE,
  DEFAULT_EDGE_TYPE,
} from '../constants'

const now = () => new Date().toISOString()

export function createPj(id: string, name: string): Project {
  const timeStamp = now()

  return {
    id,
    name,
    nodes: [createNode(ROOT_NODE_ID, null)],
    edges: [],
    createdAt: timeStamp,
    updatedAt: timeStamp,
  }
}

// 注意：親ノードの設定も同時に行う
export function createNode(
  id: string,
  parentId: string | null
): Node<NodeData> {
  return {
    id,
    type: DEFAULT_NODE_TYPE,
    data: { label: '', parentId, isDone: false, comments: [] },
    position: { x: 0, y: 0 },
  }
}

export function createEdge(sourceNodeId: string, targetNodeId: string): Edge {
  return {
    id: `e_${sourceNodeId}_${targetNodeId}`,
    source: sourceNodeId,
    target: targetNodeId,
    type: DEFAULT_EDGE_TYPE,
  }
}
