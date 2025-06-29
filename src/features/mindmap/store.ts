import {
  applyNodeChanges,
  applyEdgeChanges,
  type Edge,
  type EdgeChange,
  type Node,
  type NodeChange,
  type OnNodesChange,
  type OnEdgesChange,
  type OnNodesDelete,
} from '@xyflow/react'
import { create } from 'zustand'
import {
  collectDescendantIds,
  findBottomNodeIdx,
  findBottomEdgeIdx,
  getNodeIdxById,
  getEdgeIdxByTargetNodeId,
} from './utils/nodeTreeUtils'

import { initialNodes, initialEdges } from './mockInitialElements'
import { type NodeData } from './components/CustomNode'
import { nanoid } from 'nanoid'
import { createEdge, createNode } from './utils/elementFactory'
import { insertAfter } from './utils/arrayUtils'

import { subscribeWithSelector } from 'zustand/middleware'

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
  // moveNodeAboveTarget: (movingNodeId: string, targetid: string) => void
  // moveNodeBelowTarget: (movingNodeId: string, targetid: string) => void
  updateNodeLabel: (nodeId: string, label: string) => void
  movingNodeId: string | null
  setMovingNodeId: (nodeId: string | null) => void
}

const useMindMapStore = create(
  subscribeWithSelector<MindMapStore>((set, get) => ({
    nodes: initialNodes,
    edges: initialEdges,
    onNodesChange: (changes: NodeChange<Node<NodeData>>[]) => {
      set({
        nodes: applyNodeChanges<Node<NodeData>>(changes, get().nodes),
      })
    },
    onEdgesChange: (changes: EdgeChange[]) => {
      set({
        edges: applyEdgeChanges(changes, get().edges),
      })
    },
    onNodesDelete: (deletedNodes: Node<NodeData>[]) => {
      set((state) => {
        const deletedNodeIds = collectDescendantIds(
          deletedNodes.map((node) => node.id),
          state.nodes
        )

        return {
          nodes: state.nodes.filter(
            (node) => !deletedNodeIds.includes(node.id)
          ),
          edges: state.edges.filter(
            (edge) =>
              !deletedNodeIds.includes(edge.source) &&
              !deletedNodeIds.includes(edge.target)
          ),
        }
      })
    },
    setNodes: (newNodes: Node<NodeData>[]) => {
      set({
        nodes: newNodes,
      })
    },
    addHorizontalElement: (parentId: string) => {
      const currentNodes = get().nodes
      const currentEdges = get().edges

      const newNodeId = nanoid()
      const newNode: Node<NodeData> = createNode(newNodeId, parentId)
      const newEdge: Edge = createEdge(parentId, newNodeId)

      set({
        nodes: insertAfter<Node<NodeData>>(
          currentNodes,
          [newNode],
          findBottomNodeIdx(parentId, currentNodes)
        ),
        edges: insertAfter<Edge>(
          currentEdges,
          [newEdge],
          findBottomEdgeIdx(parentId, currentEdges)
        ),
      })
    },
    addVerticalElement: (aboveNodeId: string, parentId: string) => {
      const currentNodes = get().nodes
      const currentEdges = get().edges

      const aboveNodeIdx = getNodeIdxById(aboveNodeId, currentNodes)

      if (aboveNodeIdx === -1) {
        console.error(`Node "${aboveNodeId}" not found.`)
        return
      }

      const aboveEdgeIdx = getEdgeIdxByTargetNodeId(aboveNodeId, currentEdges)

      if (aboveEdgeIdx === -1) {
        console.error(`No edge found with target "${aboveNodeId}"`)
        return
      }

      const newNodeId = nanoid()
      const newNode: Node<NodeData> = createNode(newNodeId, parentId)
      const newEdge: Edge = createEdge(parentId, newNodeId)

      set({
        nodes: insertAfter<Node<NodeData>>(
          currentNodes,
          [newNode],
          aboveNodeIdx
        ),
        edges: insertAfter<Edge>(currentEdges, [newEdge], aboveEdgeIdx),
      })
    },
    moveNodeTobeChild: (movingNodeId: string, parentId: string) => {
      const { nodes: currentNodes, edges: currentEdges } = get()

      /* --- 1.ノードの処理 --- */

      // 移動するノード群(subtree)のIDを取得
      const movingSubtreeIds = collectDescendantIds(
        [movingNodeId],
        currentNodes
      )

      // subtreeのノード群を取得
      const movingNodes = currentNodes
        .filter((node) => movingSubtreeIds.includes(node.id))
        .map((node) => {
          if (node.id === movingNodeId) {
            return { ...node, data: { ...node.data, parentId } } //subTreeのルートノードだけparentId変更
          } else {
            return node
          }
        })

      // subtree以外のノード群を取得
      const nodesWithoutSubtree = currentNodes.filter(
        (node) => !movingSubtreeIds.includes(node.id)
      )

      // parentNodeの子ノードの最下ノードのidxを取得
      const bottomNodeIdx = findBottomNodeIdx(parentId, nodesWithoutSubtree)

      // subtreeを挿入
      const newNodes = insertAfter(
        nodesWithoutSubtree,
        movingNodes,
        bottomNodeIdx
      )

      /* --- 2.Edgeの処理 --- */

      // 移動するエッジ群を取得
      const movingEdges = currentEdges
        .filter(
          (edge) =>
            movingSubtreeIds.includes(edge.source) ||
            movingSubtreeIds.includes(edge.target)
        )
        .map((edge) => {
          if (edge.target === movingNodeId) {
            return {
              ...edge,
              id: `e${parentId}${movingNodeId}`,
              source: parentId,
            } //subTreeのルートノードだけparentId変更
          } else {
            return edge
          }
        })

      // 移動するエッジ以外のエッジ群を取得
      const edgesWithoutMovingEdges = currentEdges.filter(
        (edge) =>
          !movingSubtreeIds.includes(edge.source) &&
          !movingSubtreeIds.includes(edge.target)
      )

      // 最下エッジのidxを取得
      const bottomEdgeIdx = findBottomEdgeIdx(parentId, edgesWithoutMovingEdges)

      // 移動するエッジ群を挿入
      const newEdges = insertAfter(
        edgesWithoutMovingEdges,
        movingEdges,
        bottomEdgeIdx
      )

      /* --- 3.zustand storeに反映 --- */
      set({
        nodes: newNodes,
        edges: newEdges,
      })
    },

    updateNodeLabel: (nodeId: string, label: string) => {
      set({
        nodes: get().nodes.map((node) => {
          if (node.id === nodeId) {
            return {
              ...node,
              data: {
                ...node.data,
                label,
              },
            }
          }
          return node
        }),
      })
    },
    movingNodeId: null,
    setMovingNodeId: (nodeId: string | null) => {
      set({
        movingNodeId: nodeId,
      })
    },
  }))
)

export default useMindMapStore
