import { type Node, type Edge } from '@xyflow/react'
import { type NodeData } from '../../../types'

/* 与えられたノード自身に関する関数 */

// ノードIDからそのノードのidxを取得する
export function getNodeIdxById(
  nodeId: string,
  nodes: Node<NodeData>[]
): number {
  return nodes.findIndex((n) => n.id === nodeId)
}

// ターゲットノードのIDからそのノードに接続するエッジのidxを取得する
export function getEdgeIdxByTargetNodeId(
  targetNodeId: string,
  edges: Edge[]
): number {
  return edges.findIndex((e) => e.target === targetNodeId)
}

/* 親情報が与えられたときの、子に関する関数 */

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

/* 子情報が与えられたときの、親に関する関数 */

// ノードIDからその親ノードのidを取得する
export function getParentIdById(
  nodeId: string,
  nodes: Node<NodeData>[]
): string | null {
  const targetNode = nodes.find((n) => n.id === nodeId)
  return targetNode?.data.parentId ?? null
}

// 子ノードの最上ノードIDを取得
export function getTopNodeIdByParentId(
  parentId: string,
  nodes: Node<NodeData>[]
): string | null {
  if (parentId === undefined || parentId === null) {
    return null
  }

  const topNode = nodes.find((node) => node.data.parentId === parentId) //parentId無しでも成立
  return topNode ? topNode.id : null
}

/* 上下ノードに関する関数 */

// 真上に位置するノードのIDを取得
export function getAboveNodeId(
  belowNodeId: string,
  nodes: Node<NodeData>[]
): string | null {
  // belowNodeのIdxを取得
  const belowNodeIdx = nodes.findIndex((node) => node.id === belowNodeId)
  if (belowNodeIdx === -1) return null

  // 真上のノードは共通の親を持つため、後にこのparentIdを基に探索
  const parentId = getParentIdById(belowNodeId, nodes)
  if (parentId === null) return null

  // idxが若いほうに向けて、共通のparentIdを持つノード（＝真上ノード）を探索しIDを取得
  for (let i = belowNodeIdx - 1; i >= 0; i--) {
    if (nodes[i].data.parentId === parentId) {
      return nodes[i].id
    }
  }

  return null
}

// 真下に位置するノードのIDを取得
export function getBelowNodeId(
  aboveNodeId: string,
  nodes: Node<NodeData>[]
): string | null {
  // aboveNodeのIdxを取得
  const aboveNodeIdx = nodes.findIndex((node) => node.id === aboveNodeId)
  if (aboveNodeIdx === -1) {
    return null
  }

  // 真下のノードは共通の親を持つため、後にこのparentIdを基に探索
  const parentId = getParentIdById(aboveNodeId, nodes)
  if (parentId === null) {
    return null
  }

  // 老番方向に向けて、共通のparentIdを持つノード（＝真下ノード）を探索しIDを取得
  for (let i = aboveNodeIdx + 1; i < nodes.length; i++) {
    if (nodes[i].data.parentId === parentId) {
      return nodes[i].id
    }
  }

  return null
}

/* 複数ノードに関わる関数 */

//対象ノードの子ノード・孫ノード・・・を探索してIDを配列でreturn
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

//対象ノードの子ノード・孫ノード・・・を探索してIDをsetでreturn
export function collectDescendantIdSet(
  nodeIds: string[],
  nodes: Node<NodeData>[]
): Set<string> {
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

  return collectedNodeIds
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
