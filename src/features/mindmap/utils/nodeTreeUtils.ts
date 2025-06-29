import { type Node, type Edge } from '@xyflow/react'
import { type NodeData } from '../components/CustomNode'

//引数のノード配列の子ノードID・孫ノードID・・・を収集
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

// ノードIDからその親ノードのidを取得する
export function getParentIdById(
  nodeId: string,
  nodes: Node<NodeData>[]
): string | null {
  const targetNode = nodes.find((n) => n.id === nodeId)
  return targetNode?.data.parentId ?? null
}

// ターゲットノードのIDからそのノードに接続するエッジのidxを取得する
export function getEdgeIdxByTargetNodeId(
  targetNodeId: string,
  edges: Edge[]
): number {
  return edges.findIndex((e) => e.target === targetNodeId)
}

// subtreeのノード群を取得し、ソースだけparentIdを変更
export function getSubtreeWithUpdatedParent(
  allNodes: Node<NodeData>[],
  subTreeNodeIds: string[],
  rootNodeId: string,
  newParentId: string
): Node<NodeData>[] {
  const subTreeNodes = allNodes
    .filter((node) => subTreeNodeIds.includes(node.id))
    .map((node) => {
      if (node.id === rootNodeId) {
        return { ...node, data: { ...node.data, parentId: newParentId } } //subTreeのルートノードだけparentId変更
      } else {
        return node
      }
    })

  return subTreeNodes
}

// subtree以外のノード群を取得
export function getNodesExcludingSubtree(
  allNodes: Node<NodeData>[],
  subTreeNodeIds: string[]
): Node<NodeData>[] {
  const nodesWithoutSubtree = allNodes.filter(
    (node) => !subTreeNodeIds.includes(node.id)
  )

  return nodesWithoutSubtree
}

// subtreeに関わるエッジを取得し、ソースノードをターゲットとするエッジだけparentを変更
export function getSubtreeEdgesWithUpdatedParent(
  allEdges: Edge[],
  subTreeNodeIds: string[],
  rootNodeId: string,
  newParentId: string
): Edge[] {
  const subTreeEdges = allEdges
    .filter(
      (edge) =>
        subTreeNodeIds.includes(edge.source) ||
        subTreeNodeIds.includes(edge.target)
    )
    .map((edge) => {
      if (edge.target === rootNodeId) {
        return {
          ...edge,
          id: `e_${newParentId}_${rootNodeId}`,
          source: newParentId,
        } //subTreeのルートノードだけparentId変更
      } else {
        return edge
      }
    })

  return subTreeEdges
}

// subtreeに関わるエッジ以外のエッジを取得
export function getEdgesExcludingSubtree(
  allEdges: Edge[],
  subTreeNodeIds: string[]
): Edge[] {
  const edgesExcludingSubtree = allEdges.filter(
    (edge) =>
      !subTreeNodeIds.includes(edge.source) &&
      !subTreeNodeIds.includes(edge.target)
  )

  return edgesExcludingSubtree
}
