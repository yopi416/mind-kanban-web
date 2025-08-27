import {
  applyNodeChanges,
  applyEdgeChanges,
  type Edge,
  type EdgeChange,
  type Node,
  type NodeChange,
} from '@xyflow/react'
import { create } from 'zustand'
import {
  type MindMapStore,
  type NodeComment,
  type Project,
  type StackItem,
} from '../../types'
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

// import { initialNodes, initialEdges } from './mockInitialElements'
import { initialPjs } from './mockInitialElements'
import { type NodeData } from '../../types'
import { nanoid } from 'nanoid'
import { createPj, createEdge, createNode } from './utils/elementFactory'
import { insertAfter, insertBefore } from './utils/arrayUtils'
import { getCurrentPj, applyPjChangesTrial } from './utils/projectUtils'

import { subscribeWithSelector } from 'zustand/middleware'
import { ROOT_NODE_ID, HISTORY_STACK_CAPACITY } from './constants'
import {
  HistoryStack,
  clearHistory,
  cloneSnapshot,
  // syncHistoryCounters,
} from './utils/historyUtils'

const useMindMapStore = create(
  subscribeWithSelector<MindMapStore>((set, get) => ({
    // nodes: initialNodes,
    // edges: initialEdges,
    projects: initialPjs,
    currentPjId: 'pj2',
    setCurrentPjId: (newPjId: string) => {
      set({
        currentPjId: newPjId,
        focusedNodeId: ROOT_NODE_ID,
        movingNodeId: null,
        editingNodeId: null,
        commentPopupId: null,
      })

      // Project移動する時は履歴をクリア
      clearHistory(get().history, set)
    },
    addPj: () => {
      const newPjId = nanoid()
      const newPj = createPj(newPjId, 'newProject')

      set((state) => {
        return {
          projects: {
            ...state.projects,
            [newPjId]: newPj,
          },
          currentPjId: newPjId,
          focusedNodeId: ROOT_NODE_ID,
          movingNodeId: null,
          editingNodeId: null,
          commentPopupId: null,
        }
      })

      // Project移動する時は履歴をクリア
      clearHistory(get().history, set)
    },
    renamePj: (pjId: string, newPjName: string) => {
      set((state) => {
        const currentPj = state.projects[pjId]

        if (!currentPj) {
          console.warn(`Project "${pjId}" not found`)
          return state
        }

        if (!newPjName.trim()) {
          console.warn(`Invalid ProjectName`)
          return state
        }

        return {
          projects: {
            ...state.projects,
            [pjId]: {
              ...currentPj,
              name: newPjName,
            },
          },
        }
      })
    },
    deletePj: (pjId: string) => {
      set((state) => {
        if (!state.projects[pjId]) return state

        const newPjs = { ...state.projects }
        delete newPjs[pjId]

        if (Object.keys(newPjs).length === 0) {
          return state
        }

        let newCurrentPjId = state.currentPjId

        if (newCurrentPjId === pjId) {
          const [nextId] = Object.keys(newPjs)
          newCurrentPjId = nextId
        }

        return {
          projects: newPjs,
          currentPjId: newCurrentPjId,
          movingNodeId: null,
          editingNodeId: null,
          commentPopupId: null,
          focusedNodeId: null,
        }
      })

      // Project移動する時は履歴をクリア
      clearHistory(get().history, set)
    },
    onNodesChange: (changes: NodeChange<Node<NodeData>>[]) => {
      const currentPj = getCurrentPj(get())

      const pjUpdater = (prev: Project) => ({
        ...prev,
        nodes: applyNodeChanges<Node<NodeData>>(changes, currentPj.nodes),
      })

      applyPjChangesTrial(set, pjUpdater, { shouldAddToStack: true })

      // applyPjChanges(get, set, (prev: Project) => ({
      //   ...prev,
      //   nodes: applyNodeChanges<Node<NodeData>>(changes, currentPj.nodes),
      // }))
    },
    onEdgesChange: (changes: EdgeChange[]) => {
      const currentPj = getCurrentPj(get())

      console.log('edgeeschange!!!')

      const pjUpdater = (prev: Project) => ({
        ...prev,
        edges: applyEdgeChanges(changes, currentPj.edges),
      })

      applyPjChangesTrial(set, pjUpdater, { shouldAddToStack: true })

      // applyPjChanges(get, set, (prev: Project) => ({
      //   ...prev,
      //   edges: applyEdgeChanges(changes, currentPj.edges),
      // }))
    },
    deleteNodes: (nodeIdToDelete: string) => {
      const currentPj = getCurrentPj(get())
      const nodeIdsToDelete = collectDescendantIds(
        [nodeIdToDelete],
        currentPj.nodes
      )
      const newNodes = currentPj.nodes.filter(
        (n) => !nodeIdsToDelete.includes(n.id)
      )
      const newEdges = currentPj.edges.filter(
        (e) =>
          !nodeIdsToDelete.includes(e.source) &&
          !nodeIdsToDelete.includes(e.target)
      )

      const pjUpdater = (prev: Project) => ({
        ...prev,
        nodes: newNodes,
        edges: newEdges,
      })

      applyPjChangesTrial(set, pjUpdater, { shouldAddToStack: true })

      // applyPjChanges(get, set, (prev) => ({
      //   ...prev,
      //   nodes: newNodes,
      //   edges: newEdges,
      // }))

      // set((state) => {
      //   const nodeIdsToDelete = collectDescendantIds(
      //     [nodeIdToDelete],
      //     state.nodes
      //   )

      //   return {
      //     nodes: state.nodes.filter(
      //       (node) => !nodeIdsToDelete.includes(node.id)
      //     ),
      //     edges: state.edges.filter(
      //       (edge) =>
      //         !nodeIdsToDelete.includes(edge.source) &&
      //         !nodeIdsToDelete.includes(edge.target)
      //     ),
      //   }
      // })
    },
    setNodes: (newNodes: Node<NodeData>[]) => {
      const pjUpdater = (prev: Project) => ({ ...prev, nodes: newNodes })
      applyPjChangesTrial(set, pjUpdater, { shouldAddToStack: false })

      // applyPjChanges(get, set, (prev) => ({ ...prev, nodes: newNodes }))

      // set({
      //   nodes: newNodes,
      // })
    },
    addHorizontalElement: (parentId: string) => {
      const currentPj = getCurrentPj(get())
      const currentNodes = currentPj.nodes
      const currentEdges = currentPj.edges

      const newNodeId = nanoid()
      const newNode = createNode(newNodeId, parentId)
      const newEdge = createEdge(parentId, newNodeId)

      const newNodes = insertAfter<Node<NodeData>>(
        currentNodes,
        [newNode],
        findBottomNodeIdx(parentId, currentNodes)
      )
      const newEdges = insertAfter<Edge>(
        currentEdges,
        [newEdge],
        findBottomEdgeIdx(parentId, currentEdges)
      )

      // pj更新ロジックの規定
      const pjUpdater = (prev: Project) => ({
        ...prev,
        nodes: newNodes,
        edges: newEdges,
      })

      // storeに反映
      applyPjChangesTrial(set, pjUpdater, { shouldAddToStack: true })

      // storeに反映 & new nodeをfocus
      // applyPjChanges(get, set, (prev) => ({
      //   ...prev,
      //   nodes: newNodes,
      //   edges: newEdges,
      // }))

      setTimeout(() => {
        set({ focusedNodeId: newNodeId })
      }, 0)
    },
    addVerticalElement: (aboveNodeId: string, parentId: string) => {
      const currentPj = getCurrentPj(get())
      const currentNodes = currentPj.nodes
      const currentEdges = currentPj.edges

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

      const newNodes = insertAfter<Node<NodeData>>(
        currentNodes,
        [newNode],
        aboveNodeIdx
      )
      const newEdges = insertAfter<Edge>(currentEdges, [newEdge], aboveEdgeIdx)

      // pj更新ロジックの規定
      const pjUpdater = (prev: Project) => ({
        ...prev,
        nodes: newNodes,
        edges: newEdges,
      })

      // storeに反映
      applyPjChangesTrial(set, pjUpdater, { shouldAddToStack: true })

      // // storeに反映 & new nodeをfocus
      // applyPjChanges(get, set, (prev) => ({
      //   ...prev,
      //   nodes: newNodes,
      //   edges: newEdges,
      // }))

      setTimeout(() => {
        set({ focusedNodeId: newNodeId })
      }, 0)
    },
    moveNodeTobeChild: (movingNodeId: string, parentId: string) => {
      //変更前ノード・エッジの取得
      const { nodes: currentNodes, edges: currentEdges } = getCurrentPj(get())

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

      // undo用に変更前ノード・エッジを取得
      // const undoItemToPush = cloneSnapshot(currentNodes, currentEdges)

      // pj更新ロジックの規定
      const pjUpdater = (prev: Project) => ({
        ...prev,
        nodes: newNodes,
        edges: newEdges,
      })

      // storeに反映
      applyPjChangesTrial(set, pjUpdater, { shouldAddToStack: true })
      // applyPjChanges(get, set, (prev) => ({
      //   ...prev,
      //   nodes: newNodes,
      //   edges: newEdges,
      // }))

      // store反映後に、undo/redo処理
      // pushUndoItem(get, set, undoItemToPush)
      // console.log(
      //   get().undoCount,
      //   get().redoCount,
      //   get().history.redoStack,
      //   get().history.undoStack
      // )
    },

    moveNodeAboveTarget: (
      movingNodeId: string,
      belowNodeId: string,
      parentId: string
    ) => {
      //変更前ノード・エッジの取得
      const { nodes: currentNodes, edges: currentEdges } = getCurrentPj(get())

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

      // pj更新ロジックの規定
      const pjUpdater = (prev: Project) => ({
        ...prev,
        nodes: newNodes,
        edges: newEdges,
      })

      // storeに反映
      applyPjChangesTrial(set, pjUpdater, { shouldAddToStack: true })

      // applyPjChanges(get, set, (prev) => ({
      //   ...prev,
      //   nodes: newNodes,
      //   edges: newEdges,
      // }))
    },

    moveNodeBelowTarget: (
      movingNodeId: string,
      aboveNodeId: string,
      parentId: string
    ) => {
      //変更前ノード・エッジの取得
      const { nodes: currentNodes, edges: currentEdges } = getCurrentPj(get())

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

      // pj更新ロジックの規定
      const pjUpdater = (prev: Project) => ({
        ...prev,
        nodes: newNodes,
        edges: newEdges,
      })

      // storeに反映
      applyPjChangesTrial(set, pjUpdater, { shouldAddToStack: true })

      // applyPjChanges(get, set, (prev) => ({
      //   ...prev,
      //   nodes: newNodes,
      //   edges: newEdges,
      // }))
    },

    updateNodeLabel: (nodeId: string, label: string) => {
      console.log('updateNodeLabel!!')
      const { nodes: currentNodes } = getCurrentPj(get())

      const newNodes = currentNodes.map((node) => {
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
      })

      // pj更新ロジックの規定
      const pjUpdater = (prev: Project) => ({ ...prev, nodes: newNodes })

      // storeに反映
      applyPjChangesTrial(set, pjUpdater, { shouldAddToStack: false })

      // applyPjChanges(get, set, (prev) => ({ ...prev, nodes: newNodes }))
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
      const { nodes: currentNodes } = getCurrentPj(get())
      const newNodes = currentNodes.map((node) => {
        if (node.id !== nodeId) return node

        return {
          ...node,
          data: {
            ...node.data,
            isDone,
          },
        }
      })

      // pj更新ロジックの規定
      const pjUpdater = (prev: Project) => ({ ...prev, nodes: newNodes })

      // storeに反映
      applyPjChangesTrial(set, pjUpdater, { shouldAddToStack: true })

      // applyPjChanges(get, set, (prev) => ({ ...prev, nodes: newNodes }))
    },
    addComment: (nodeId: string, content: string) => {
      const { nodes: currentNodes } = getCurrentPj(get())

      const newComment: NodeComment = {
        id: nanoid(),
        content,
        createdAt: new Date().toISOString(),
      }

      const newNodes: Node<NodeData>[] = currentNodes.map((node) => {
        if (node.id !== nodeId) return node

        return {
          ...node,
          data: {
            ...node.data,
            comments: [...node.data.comments, newComment],
          },
        }
      })

      // pj更新ロジックの規定
      const pjUpdater = (prev: Project) => ({ ...prev, nodes: newNodes })

      // storeに反映
      applyPjChangesTrial(set, pjUpdater, { shouldAddToStack: true })

      // applyPjChanges(get, set, (prev) => ({ ...prev, nodes: newNodes }))
    },
    editComment: (
      nodeId: string,
      commentId: string,
      updatedContent: string
    ) => {
      const { nodes: currentNodes } = getCurrentPj(get())

      const newNodes: Node<NodeData>[] = currentNodes.map((node) => {
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

      // pj更新ロジックの規定
      const pjUpdater = (prev: Project) => ({ ...prev, nodes: newNodes })

      // storeに反映
      applyPjChangesTrial(set, pjUpdater, { shouldAddToStack: true })

      // applyPjChanges(get, set, (prev) => ({ ...prev, nodes: newNodes }))
    },
    deleteComment: (nodeId: string, commentId: string) => {
      const { nodes: currentNodes } = getCurrentPj(get())

      const newNodes: Node<NodeData>[] = currentNodes.map((node) => {
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

      // pj更新ロジックの規定
      const pjUpdater = (prev: Project) => ({ ...prev, nodes: newNodes })

      // storeに反映
      applyPjChangesTrial(set, pjUpdater, { shouldAddToStack: true })

      // applyPjChanges(get, set, (prev) => ({ ...prev, nodes: newNodes }))
    },
    showDoneNodes: true,
    setShowDoneNodes: (show: boolean) => {
      set({
        showDoneNodes: show,
      })
    },
    history: {
      undoStack: new HistoryStack<StackItem>(HISTORY_STACK_CAPACITY),
      redoStack: new HistoryStack<StackItem>(HISTORY_STACK_CAPACITY),
    },
    undo: () => {
      const { undoStack, redoStack } = get().history

      const popedItem = undoStack.pop()
      if (!popedItem) return //pop対象0の場合undefinedを返すため

      const { nodes: currentNodes, edges: currentEdges } = getCurrentPj(get())

      const redoItemToPush = cloneSnapshot(currentNodes, currentEdges)
      redoStack.push(redoItemToPush)

      const pjUpdater = (prev: Project) => ({
        ...prev,
        nodes: popedItem.nodes,
        edges: popedItem.edges,
      })

      // popedItemを現在ノードに反映(関数内でsetまで完了)
      applyPjChangesTrial(set, pjUpdater, { shouldAddToStack: false })

      // undo/redoスタック操作後のカウンタ同期
      set({ undoCount: undoStack.size, redoCount: redoStack.size })

      console.log(get().undoCount, get().redoCount)
      console.log(get().history.undoStack, get().history.redoStack)
    },
    redo: () => {
      const { undoStack, redoStack } = get().history

      const popedItem = redoStack.pop()
      if (!popedItem) return

      const { nodes: currentNodes, edges: currentEdges } = getCurrentPj(get())
      const undoItemToPush = cloneSnapshot(currentNodes, currentEdges)
      undoStack.push(undoItemToPush)

      const pjUpdater = (prev: Project) => ({
        ...prev,
        nodes: popedItem.nodes,
        edges: popedItem.edges,
      })

      // popedItemを現在ノードに反映
      applyPjChangesTrial(set, pjUpdater, { shouldAddToStack: false })

      // undo/redoスタック操作後のカウンタ同期
      set({ undoCount: undoStack.size, redoCount: redoStack.size })
    },
    undoCount: 0,
    redoCount: 0,
  }))
)

export default useMindMapStore
