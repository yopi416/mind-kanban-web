import { type Node, type Edge } from '@xyflow/react'
import { type NodeData } from '../../../types'

export function createNode(id: string, parentId: string): Node<NodeData> {
  return {
    id,
    type: 'custom',
    data: { label: '', parentId, comments: [] },
    position: { x: 0, y: 0 },
  }
}

export function createEdge(sourceNodeId: string, targetNodeId: string): Edge {
  return {
    id: `e_${sourceNodeId}_${targetNodeId}`,
    source: sourceNodeId,
    target: targetNodeId,
    type: 'smoothstep',
  }
}
