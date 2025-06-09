import { type Node, type Edge } from '@xyflow/react'
import { type NodeData } from '../components/CustomNode'

//引数のノード配列のそれぞれのノードの子ノード・孫ノード・・・を収集（削除用）
export function collectDescendantIds(
  nodeIds: string[],
  nodes: Node<NodeData>[]
): string[] {
  const collectedNodeIds = new Set<string>(nodeIds)
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

// ある親ノード-子ノードにおける、最下のNodeのidxを取得
export function findBottomNodeIdx(
  parentId: string,
  nodes: Node<NodeData>[]
): number {
  for (let i = nodes.length - 1; i >= 0; i--) {
    if (nodes[i].data.parentId === parentId) {
      return i
    }
  }
  return nodes.length - 1
}

// ある親ノード-子ノードのedgeにおける、最下のEdgeのidxを取得

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
