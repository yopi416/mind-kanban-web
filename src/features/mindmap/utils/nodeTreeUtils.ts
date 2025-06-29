import { type Node, type Edge } from '@xyflow/react'
import { type NodeData } from '../components/CustomNode'

//引数のノード配列の子ノードID・孫ノードID・・・を収集（削除用）
export function collectDescendantIds(
  nodeIds: string[],
  nodes: Node<NodeData>[]
): string[] {
  const collectedNodeIds = new Set<string>(nodeIds) //親ノードのID含め返すことに注意
  const queue = [...nodeIds]

  // 幅優先で探索
  while (queue.length) {
    const current = queue.shift()!
    nodes.forEach((n) => {
      const pid = n.data?.parentId
      if (pid && pid === current && !collectedNodeIds.has(n.id)) {
        collectedNodeIds.add(n.id)
        queue.push(n.id)
      }
    })
  }
  return Array.from(collectedNodeIds)
}

// ある親ノードの子ノード群における、最下のNodeのidxを取得
export function findBottomNodeIdx(
  parentId: string,
  nodes: Node<NodeData>[]
): number {
  if (nodes.length === 0) {
    return 0
  }

  for (let i = nodes.length - 1; i >= 0; i--) {
    if (nodes[i].data.parentId === parentId) {
      return i
    }
  }
  return nodes.length - 1
}

// ある親ノードの子ノードのedge群における、最下のEdgeのidxを取得
export function findBottomEdgeIdx(parentId: string, edges: Edge[]): number {
  if (edges.length === 0) {
    return 0
  }

  for (let i = edges.length - 1; i >= 0; i--) {
    if (edges[i].source === parentId) {
      return i
    }
  }

  // 見つからなかった場合末尾のidxをreturn
  return edges.length - 1
}

// ノードIDからそのノードのidxを取得する
export function getNodeIdxById(
  nodeId: string,
  nodes: Node<NodeData>[]
): number {
  return nodes.findIndex((n) => n.id === nodeId)
}

// ターゲットノードのIDからそのノードのidxを取得する
export function getEdgeIdxByTargetNodeId(
  targetNodeId: string,
  edges: Edge[]
): number {
  return edges.findIndex((e) => e.target === targetNodeId)
}
