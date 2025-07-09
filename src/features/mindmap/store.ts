import {
  applyNodeChanges,
  applyEdgeChanges,
  type Edge,
  type EdgeChange,
  type Node,
  type NodeChange,
} from '@xyflow/react'
import { create } from 'zustand'
import { type MindMapStore, type NodeComment } from '../../types'
import {
  collectDescendantIds,
  findBottomNodeIdx,
  findBottomEdgeIdx,
  getNodeIdxById,
  getEdgeIdxByTargetNodeId,
  getSubtreeWithUpdatedParent,
  getNodesExcludingSubtree,
  getSubtreeEdgesWithUpdatedParent,
  getEdgesExcludingSubtree,
} from './utils/nodeTreeUtils'

import { initialNodes, initialEdges } from './mockInitialElements'
import { type NodeData } from '../../types'
import { nanoid } from 'nanoid'
import { createEdge, createNode } from './utils/elementFactory'
import { insertAfter, insertBefore } from './utils/arrayUtils'

import { subscribeWithSelector } from 'zustand/middleware'

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
    deleteNodes: (nodeIdToDelete: string) => {
      set((state) => {
        const nodeIdsToDelete = collectDescendantIds(
          [nodeIdToDelete],
          state.nodes
        )

        return {
          nodes: state.nodes.filter(
            (node) => !nodeIdsToDelete.includes(node.id)
          ),
          edges: state.edges.filter(
            (edge) =>
              !nodeIdsToDelete.includes(edge.source) &&
              !nodeIdsToDelete.includes(edge.target)
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

      // storeに反映 & new nodeをfocus
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

      setTimeout(() => {
        set({ focusedNodeId: newNodeId })
      }, 0)
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

      // storeに反映 & new nodeをfocus
      set({
        nodes: insertAfter<Node<NodeData>>(
          currentNodes,
          [newNode],
          aboveNodeIdx
        ),
        edges: insertAfter<Edge>(currentEdges, [newEdge], aboveEdgeIdx),
        focusedNodeId: newNodeId,
      })

      setTimeout(() => {
        set({ focusedNodeId: newNodeId })
      }, 0)
    },
    moveNodeTobeChild: (movingNodeId: string, parentId: string) => {
      //変更前ノード・エッジの取得
      const { nodes: currentNodes, edges: currentEdges } = get()

      /* --- 1.ノードの処理 --- */

      // 移動するノード群(subtree)のIDを取得
      const movingSubtreeIds = collectDescendantIds(
        [movingNodeId],
        currentNodes
      )

      // subtreeのノード群を取得
      const movingNodes = getSubtreeWithUpdatedParent(
        currentNodes,
        movingSubtreeIds,
        movingNodeId,
        parentId
      )

      // subtree以外のノード群を取得
      const nodesWithoutSubtree = getNodesExcludingSubtree(
        currentNodes,
        movingSubtreeIds
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
      const movingEdges = getSubtreeEdgesWithUpdatedParent(
        currentEdges,
        movingSubtreeIds,
        movingNodeId,
        parentId
      )

      // 移動するエッジ以外のエッジ群を取得
      const edgesWithoutMovingEdges = getEdgesExcludingSubtree(
        currentEdges,
        movingSubtreeIds
      )

      // 最下エッジのidxを取得
      const bottomEdgeIdx = findBottomEdgeIdx(parentId, edgesWithoutMovingEdges)
      console.log(bottomEdgeIdx)

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

      console.log(currentNodes)
      console.log(currentEdges)

      console.log(newNodes)
      console.log(newEdges)
    },

    moveNodeAboveTarget: (
      movingNodeId: string,
      belowNodeId: string,
      parentId: string
    ) => {
      //変更前ノード・エッジの取得
      const { nodes: currentNodes, edges: currentEdges } = get()

      /* --- 1.ノードの処理 --- */

      // 移動するノード群(subtree)のIDを取得
      const movingSubtreeIds = collectDescendantIds(
        [movingNodeId],
        currentNodes
      )

      // subtreeのノード群を取得して、ルートノードのparentIdを変更
      const movingNodes = getSubtreeWithUpdatedParent(
        currentNodes,
        movingSubtreeIds,
        movingNodeId,
        parentId
      )

      // subtree以外のノード群を取得
      const nodesWithoutSubtree = getNodesExcludingSubtree(
        currentNodes,
        movingSubtreeIds
      )

      // 移動先の上にあるノードのidxを取得
      const belowNodeIdx = getNodeIdxById(belowNodeId, nodesWithoutSubtree)

      if (belowNodeIdx === -1) {
        console.error(`Node "${belowNodeId}" not found.`)
        return
      }

      // subtreeを挿入
      const newNodes = insertBefore(
        nodesWithoutSubtree,
        movingNodes,
        belowNodeIdx
      )

      /* --- 2.Edgeの処理 --- */

      // 移動するエッジ群を取得
      const movingEdges = getSubtreeEdgesWithUpdatedParent(
        currentEdges,
        movingSubtreeIds,
        movingNodeId,
        parentId
      )

      // 移動するエッジ以外のエッジ群を取得
      const edgesWithoutMovingEdges = getEdgesExcludingSubtree(
        currentEdges,
        movingSubtreeIds
      )

      //  移動先の下にあるエッジのidxを取得
      const belowEdgeIdx = getEdgeIdxByTargetNodeId(
        belowNodeId,
        edgesWithoutMovingEdges
      )

      if (belowEdgeIdx === -1) {
        console.error(`No edge found with target "${belowNodeId}"`)
        return
      }

      // 移動するエッジ群を挿入
      const newEdges = insertBefore(
        edgesWithoutMovingEdges,
        movingEdges,
        belowEdgeIdx
      )

      /* --- 3.zustand storeに反映 --- */
      set({
        nodes: newNodes,
        edges: newEdges,
      })
    },

    moveNodeBelowTarget: (
      movingNodeId: string,
      aboveNodeId: string,
      parentId: string
    ) => {
      //変更前ノード・エッジの取得
      const { nodes: currentNodes, edges: currentEdges } = get()

      /* --- 1.ノードの処理 --- */

      // 移動するノード群(subtree)のIDを取得
      const movingSubtreeIds = collectDescendantIds(
        [movingNodeId],
        currentNodes
      )

      // subtreeのノード群を取得して、ルートノードのparentIdを変更
      const movingNodes = getSubtreeWithUpdatedParent(
        currentNodes,
        movingSubtreeIds,
        movingNodeId,
        parentId
      )

      // subtree以外のノード群を取得
      const nodesWithoutSubtree = getNodesExcludingSubtree(
        currentNodes,
        movingSubtreeIds
      )

      // 移動先の上にあるノードのidxを取得
      const aboveNodeIdx = getNodeIdxById(aboveNodeId, nodesWithoutSubtree)

      if (aboveNodeIdx === -1) {
        console.error(`Node "${aboveNodeId}" not found.`)
        return
      }

      // subtreeを挿入
      const newNodes = insertAfter(
        nodesWithoutSubtree,
        movingNodes,
        aboveNodeIdx
      )

      /* --- 2.Edgeの処理 --- */

      // 移動するエッジ群を取得
      const movingEdges = getSubtreeEdgesWithUpdatedParent(
        currentEdges,
        movingSubtreeIds,
        movingNodeId,
        parentId
      )

      // 移動するエッジ以外のエッジ群を取得
      const edgesWithoutMovingEdges = getEdgesExcludingSubtree(
        currentEdges,
        movingSubtreeIds
      )

      //  移動先の上にあるエッジのidxを取得
      const aboveEdgeIdx = getEdgeIdxByTargetNodeId(
        aboveNodeId,
        edgesWithoutMovingEdges
      )

      if (aboveEdgeIdx === -1) {
        console.error(`No edge found with target "${aboveNodeId}"`)
        return
      }

      // 移動するエッジ群を挿入
      const newEdges = insertAfter(
        edgesWithoutMovingEdges,
        movingEdges,
        aboveEdgeIdx
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
    focusedNodeId: null,
    setFocusedNodeId: (nodeId: string | null) => {
      set({
        focusedNodeId: nodeId,
      })
    },
    editingNodeId: null,
    setEditingNodeId: (nodeId: string | null) => {
      set({
        editingNodeId: nodeId,
      })
    },
    commentPopupId: null,
    setCommentPopupId: (nodeId: string | null) => {
      set({
        commentPopupId: nodeId,
      })
    },
    updateIsDone: (nodeId: string, isDone: boolean) => {
      const currentNodes = get().nodes

      set({
        nodes: currentNodes.map((node) => {
          if (node.id !== nodeId) return node

          return {
            ...node,
            data: {
              ...node.data,
              isDone,
            },
          }
        }),
      })
    },
    addComment: (nodeId: string, content: string) => {
      const currentNodes = get().nodes

      const newComment: NodeComment = {
        id: nanoid(),
        content,
        createdAt: new Date().toISOString(),
      }

      const updatedNodes: Node<NodeData>[] = currentNodes.map((node) => {
        if (node.id !== nodeId) return node

        return {
          ...node,
          data: {
            ...node.data,
            comments: [...node.data.comments, newComment],
          },
        }
      })

      set({
        nodes: updatedNodes,
      })
    },
    editComment: (
      nodeId: string,
      commentId: string,
      updatedContent: string
    ) => {
      const currentNodes = get().nodes

      const updatedNodes: Node<NodeData>[] = currentNodes.map((node) => {
        if (node.id !== nodeId) return node

        return {
          ...node,
          data: {
            ...node.data,
            comments: node.data.comments.map((c) => {
              if (c.id !== commentId) return c

              return {
                ...c,
                content: updatedContent,
              }
            }),
          },
        }
      })

      set({
        nodes: updatedNodes,
      })
    },
    deleteComment: (nodeId: string, commentId: string) => {
      const currentNodes = get().nodes

      const updatedNodes: Node<NodeData>[] = currentNodes.map((node) => {
        if (node.id !== nodeId) return node

        return {
          ...node,
          data: {
            ...node.data,
            comments: node.data.comments.filter(
              (comment) => comment.id !== commentId
            ),
          },
        }
      })

      set({
        nodes: updatedNodes,
      })
    },
  }))
)

export default useMindMapStore
