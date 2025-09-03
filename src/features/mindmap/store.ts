import {
  applyNodeChanges,
  applyEdgeChanges,
  type Edge,
  type EdgeChange,
  type Node,
  type NodeChange,
} from '@xyflow/react'
import { create } from 'zustand'
import type {
  MindMapStore,
  NodeComment,
  StackItem,
  History,
  HistoryByPj,
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
import {
  getCurrentPj,
  updateGraphInPj,
  updatePjInPjs,
} from './utils/projectUtils'

import { subscribeWithSelector } from 'zustand/middleware'
import { ROOT_NODE_ID, MAX_STACK_SIZE } from './constants'
import {
  cloneSnapshot,
  createEmptyHistory,
  getCurrentHistory,
  popFromStack,
  pushToStack,
  pushUndoItem,
  updateHistoryMap,
  // syncHistoryCounters,
} from './utils/historyUtils'

const useMindMapStore = create(
  subscribeWithSelector<MindMapStore>((set, get) => ({
    // nodes: initialNodes,
    // edges: initialEdges,
    projects: initialPjs,
    currentPjId: 'pj2',
    setCurrentPjId: (newPjId: string) => {
      // 作業中のプロジェクトをクリックした際は処理しない
      if (newPjId === get().currentPjId) return

      set({
        currentPjId: newPjId,
        focusedNodeId: ROOT_NODE_ID,
        movingNodeId: null,
        editingNodeId: null,
        commentPopupId: null,
      })
    },
    addPj: () => {
      const newPjId = nanoid()
      const newPj = createPj(newPjId, 'newProject')

      set((state) => {
        // 新規プロジェクトに対応する空historyを作成する
        const newHistoryMap: HistoryByPj = {
          ...state.historyByPj,
          [newPjId]: createEmptyHistory(),
        }

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
          historyByPj: newHistoryMap,
        }
      })
    },
    renamePj: (pjId: string, newPjName: string) => {
      set((state) => {
        const pjToRename = state.projects[pjId]
        if (!pjToRename) return {}

        const nextName = newPjName.trim()
        if (!nextName || pjToRename.name === nextName) return {}

        const newPjs = {
          ...state.projects,
          [pjId]: {
            ...pjToRename,
            name: newPjName,
            updatedAt: new Date().toISOString(),
          },
        }

        return {
          projects: newPjs,
        }
      })
    },
    deletePj: (pjId: string) => {
      set((state) => {
        if (!state.projects[pjId]) return {}

        // プロジェクトが0個にならない仕様
        // currentPjIdがnullを取る場合の対応に時間がかかるためこの仕様とする
        const newPjs = { ...state.projects }
        delete newPjs[pjId]
        if (Object.keys(newPjs).length === 0) return {}

        // 選択中のpjと別のpjを削除できる仕様だが、同一の場合は先頭のpjに移動
        let newCurrentPjId = state.currentPjId
        if (newCurrentPjId === pjId) {
          const [nextId] = Object.keys(newPjs)
          newCurrentPjId = nextId
        }

        // undo/redo用 historyも削除しておく
        const newHistoryMap = { ...state.historyByPj }
        delete newHistoryMap[pjId]

        return {
          projects: newPjs,
          currentPjId: newCurrentPjId,
          movingNodeId: null,
          editingNodeId: null,
          commentPopupId: null,
          focusedNodeId: null,
          historyByPj: newHistoryMap,
        }
      })
    },
    onNodesChange: (changes: NodeChange<Node<NodeData>>[]) => {
      const { projects: currentPjs, currentPjId } = get()
      const currentPj = getCurrentPj(currentPjs, currentPjId)

      const newNodes = applyNodeChanges<Node<NodeData>>(
        changes,
        currentPj.nodes
      )

      // edgesは変更無しのため、現状のものを使用
      const newPj = updateGraphInPj(currentPj, newNodes, currentPj.edges)
      const newPjs = updatePjInPjs(currentPjs, currentPjId, newPj)

      set({ projects: newPjs })
    },
    onEdgesChange: (changes: EdgeChange[]) => {
      const { projects: currentPjs, currentPjId } = get()
      const currentPj = getCurrentPj(currentPjs, currentPjId)

      const newEdges = applyEdgeChanges(changes, currentPj.edges)

      // edgesは変更無しのため、現状のものを使用
      const newPj = updateGraphInPj(currentPj, currentPj.nodes, newEdges)
      const newPjs = updatePjInPjs(currentPjs, currentPjId, newPj)

      set({ projects: newPjs })
    },
    deleteNodes: (nodeIdToDelete: string) => {
      if (nodeIdToDelete === ROOT_NODE_ID) return // rootノードは削除不可

      const {
        projects: currentPjs,
        currentPjId,
        focusedNodeId,
        historyByPj,
      } = get()
      const currentPj = getCurrentPj(currentPjs, currentPjId)

      /* 配下のノード含め削除 */
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

      // 新nodes,edgesを反映したprojectsを取得
      // 注意：storeへの反映は末尾のsetでまとめて実施
      const newPj = updateGraphInPj(currentPj, newNodes, newEdges)
      const newPjs = updatePjInPjs(currentPjs, currentPjId, newPj)

      // Undo用：更新前グラフをundoStackに格納
      // 念のためdeep copyしたものを格納
      const undoItem: StackItem = cloneSnapshot(
        currentPj.nodes,
        currentPj.edges,
        focusedNodeId
      )
      const currentHistory = getCurrentHistory(historyByPj, currentPjId)
      const newHistory = pushUndoItem(currentHistory, undoItem, MAX_STACK_SIZE)
      const newHistoryMap = updateHistoryMap(
        historyByPj,
        currentPjId,
        newHistory
      )

      set({ projects: newPjs, historyByPj: newHistoryMap })
    },
    setNodes: (newNodes: Node<NodeData>[]) => {
      const { projects: currentPjs, currentPjId } = get()
      const currentPj = getCurrentPj(currentPjs, currentPjId)

      const newPj = updateGraphInPj(currentPj, newNodes, currentPj.edges)
      const newPjs = updatePjInPjs(currentPjs, currentPjId, newPj)

      set({ projects: newPjs })
    },
    addHorizontalElement: (parentId: string) => {
      // historyはundoStack追加用に取得
      const {
        projects: currentPjs,
        currentPjId,
        focusedNodeId,
        historyByPj,
      } = get()
      const currentPj = getCurrentPj(currentPjs, currentPjId)

      /* 子ノード群の中の最下層ノードのインデックスを取得し、その1つ下に新規ノードを挿入 */
      const currentNodes = currentPj.nodes
      const newNodeId = nanoid()
      const newNode = createNode(newNodeId, parentId)
      const newNodes = insertAfter<Node<NodeData>>(
        currentNodes,
        [newNode],
        findBottomNodeIdx(parentId, currentNodes) //子ノード群の中の最下層ノードのインデックス
      )

      /* 最下層ノードをターゲットとするエッジのインデックスを取得し、その1つ下に新規エッジを挿入 */
      const currentEdges = currentPj.edges
      const newEdge = createEdge(parentId, newNodeId)
      const newEdges = insertAfter<Edge>(
        currentEdges,
        [newEdge],
        findBottomEdgeIdx(parentId, currentEdges) //最下層ノードをターゲットとするエッジのインデックス
      )

      // 新nodes,edgesを反映したprojectsを取得
      // 注意：storeへの反映は末尾のsetでまとめて実施
      const newPj = updateGraphInPj(currentPj, newNodes, newEdges)
      const newPjs = updatePjInPjs(currentPjs, currentPjId, newPj)

      // Undo用：更新前グラフをundoStackに格納
      // 念のためdeep copyしたものを格納
      const undoItem: StackItem = cloneSnapshot(
        currentNodes,
        currentEdges,
        focusedNodeId
      )
      const currentHistory = getCurrentHistory(historyByPj, currentPjId)
      const newHistory = pushUndoItem(currentHistory, undoItem, MAX_STACK_SIZE)
      const newHistoryMap = updateHistoryMap(
        historyByPj,
        currentPjId,
        newHistory
      )

      set({
        projects: newPjs,
        historyByPj: newHistoryMap,
        focusedNodeId: newNodeId, // 新規作成したノードにfocusあてる
      })
    },
    addVerticalElement: (aboveNodeId: string, parentId: string) => {
      // historyはundoStack追加用に取得
      const {
        projects: currentPjs,
        currentPjId,
        focusedNodeId,
        historyByPj,
      } = get()
      const currentPj = getCurrentPj(currentPjs, currentPjId)

      /* 選択中ノード（=aboveNode）のインデックスを取得し、その1つ下に新規ノードを挿入 */
      const currentNodes = currentPj.nodes
      const aboveNodeIdx = getNodeIdxById(aboveNodeId, currentNodes)
      if (aboveNodeIdx === -1) {
        console.error(`Node "${aboveNodeId}" not found.`)
        return
      }

      const newNodeId = nanoid()
      const newNode: Node<NodeData> = createNode(newNodeId, parentId)
      const newNodes = insertAfter<Node<NodeData>>(
        currentNodes,
        [newNode],
        aboveNodeIdx
      )

      /* 選択中ノード（=aboveNode）をターゲットとするedgeのインデックスを取得し、その1つ下に新規Edgeを挿入 */
      const currentEdges = currentPj.edges
      const aboveEdgeIdx = getEdgeIdxByTargetNodeId(aboveNodeId, currentEdges)
      if (aboveEdgeIdx === -1) {
        console.error(`No edge found with target "${aboveNodeId}"`)
        return
      }

      const newEdge: Edge = createEdge(parentId, newNodeId)
      const newEdges = insertAfter<Edge>(currentEdges, [newEdge], aboveEdgeIdx)

      // 新nodes,edgesを反映したprojectsを取得
      // 注意：storeへの反映は末尾のsetでまとめて実施
      const newPj = updateGraphInPj(currentPj, newNodes, newEdges)
      const newPjs = updatePjInPjs(currentPjs, currentPjId, newPj)

      // Undo用：更新前グラフをundoStackに格納
      // 念のためdeep copyしたものを格納
      const undoItem: StackItem = cloneSnapshot(
        currentNodes,
        currentEdges,
        focusedNodeId
      )
      const currentHistory = getCurrentHistory(historyByPj, currentPjId)
      const newHistory = pushUndoItem(currentHistory, undoItem, MAX_STACK_SIZE)
      const newHistoryMap = updateHistoryMap(
        historyByPj,
        currentPjId,
        newHistory
      )

      set({
        projects: newPjs,
        historyByPj: newHistoryMap,
        focusedNodeId: newNodeId, // 新規作成したノードにfocusあてる
      })
    },
    moveNodeTobeChild: (movingNodeId: string, parentId: string) => {
      // historyByPj取得はundoスタック追加を行うため
      const {
        projects: currentPjs,
        currentPjId,
        focusedNodeId,
        historyByPj,
      } = get()
      const currentPj = getCurrentPj(currentPjs, currentPjId)
      const { nodes: currentNodes, edges: currentEdges } = currentPj

      /* 対象ノードの配下含め、ドラッグ先ノードの子ノードの最下層に移動 */
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

      /* 移動ノード群に接続されるエッジ群を、ドラッグ先ノードに接続するエッジ群の最下層に移動 */
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

      // 移動するエッジ群を挿入
      const newEdges = insertAfter(
        edgesWithoutMovingEdges,
        movingEdges,
        bottomEdgeIdx
      )

      /* zustand storeに反映 */

      // 新nodes,edgesを反映したprojectsを取得
      // 注意：storeへの反映は末尾のsetでまとめて実施
      const newPj = updateGraphInPj(currentPj, newNodes, newEdges)
      const newPjs = updatePjInPjs(currentPjs, currentPjId, newPj)

      // Undo用：更新前グラフをundoStackに格納
      // 念のためdeep copyしたものを格納
      const undoItem: StackItem = cloneSnapshot(
        currentNodes,
        currentEdges,
        focusedNodeId
      )
      const currentHistory = getCurrentHistory(historyByPj, currentPjId)
      const newHistory = pushUndoItem(currentHistory, undoItem, MAX_STACK_SIZE)
      const newHistoryMap = updateHistoryMap(
        historyByPj,
        currentPjId,
        newHistory
      )

      set({ projects: newPjs, historyByPj: newHistoryMap })
    },

    moveNodeAboveTarget: (
      movingNodeId: string,
      belowNodeId: string,
      parentId: string
    ) => {
      //変更前ノード・エッジの取得
      const {
        projects: currentPjs,
        currentPjId,
        focusedNodeId,
        historyByPj,
      } = get()
      const currentPj = getCurrentPj(currentPjs, currentPjId)
      const { nodes: currentNodes, edges: currentEdges } = currentPj

      /* 対象ノードの配下含め、ドラッグ先ノードの1つ上に移動 */
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

      /* 移動ノード群に接続されるエッジ群を、ドラッグ先ノードに接続するエッジの1つ上に移動 */
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

      /* zustand storeに反映 */

      // pj更新ロジックの規定
      // 新nodes,edgesを反映したprojectsを取得
      // 注意：storeへの反映は末尾のsetでまとめて実施
      const newPj = updateGraphInPj(currentPj, newNodes, newEdges)
      const newPjs = updatePjInPjs(currentPjs, currentPjId, newPj)

      // Undo用：更新前グラフをundoStackに格納
      // 念のためdeep copyしたものを格納
      const undoItem: StackItem = cloneSnapshot(
        currentNodes,
        currentEdges,
        focusedNodeId
      )
      const currentHistory = getCurrentHistory(historyByPj, currentPjId)
      const newHistory = pushUndoItem(currentHistory, undoItem, MAX_STACK_SIZE)
      const newHistoryMap = updateHistoryMap(
        historyByPj,
        currentPjId,
        newHistory
      )

      set({ projects: newPjs, historyByPj: newHistoryMap })
    },

    moveNodeBelowTarget: (
      movingNodeId: string,
      aboveNodeId: string,
      parentId: string
    ) => {
      // historyByPj取得はundoスタック追加を行うため
      const {
        projects: currentPjs,
        currentPjId,
        focusedNodeId,
        historyByPj,
      } = get()
      const currentPj = getCurrentPj(currentPjs, currentPjId)
      const { nodes: currentNodes, edges: currentEdges } = currentPj

      /* 対象ノードの配下含め、ドラッグ先ノードの1つ下に移動 */
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

      /* 移動ノード群に接続されるエッジ群を、ドラッグ先ノードに接続するエッジの1つ下に移動 */
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

      /* zustand storeに反映 */

      // pj更新ロジックの規定
      // 新nodes,edgesを反映したprojectsを取得
      // 注意：storeへの反映は末尾のsetでまとめて実施
      const newPj = updateGraphInPj(currentPj, newNodes, newEdges)
      const newPjs = updatePjInPjs(currentPjs, currentPjId, newPj)

      // Undo用：更新前グラフをundoStackに格納
      // 念のためdeep copyしたものを格納
      const undoItem: StackItem = cloneSnapshot(
        currentNodes,
        currentEdges,
        focusedNodeId
      )
      const currentHistory = getCurrentHistory(historyByPj, currentPjId)
      const newHistory = pushUndoItem(currentHistory, undoItem, MAX_STACK_SIZE)
      const newHistoryMap = updateHistoryMap(
        historyByPj,
        currentPjId,
        newHistory
      )

      set({ projects: newPjs, historyByPj: newHistoryMap })
    },

    updateNodeLabel: (nodeId: string, label: string) => {
      const { projects: currentPjs, currentPjId } = get()
      const currentPj = getCurrentPj(currentPjs, currentPjId)
      const { nodes: currentNodes } = currentPj

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

      // edgesは変更無しのため、現状のものを使用
      const newPj = updateGraphInPj(currentPj, newNodes, currentPj.edges)
      const newPjs = updatePjInPjs(currentPjs, currentPjId, newPj)

      set({ projects: newPjs })
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
      const {
        projects: currentPjs,
        currentPjId,
        focusedNodeId,
        historyByPj,
      } = get()
      const currentPj = getCurrentPj(currentPjs, currentPjId)
      const { nodes: currentNodes, edges: currentEdges } = currentPj

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

      // 新nodes,edgesを反映したprojectsを取得
      // 注意：storeへの反映は末尾のsetでまとめて実施
      const newPj = updateGraphInPj(currentPj, newNodes, currentEdges)
      const newPjs = updatePjInPjs(currentPjs, currentPjId, newPj)

      // Undo用：更新前グラフをundoStackに格納
      // 念のためdeep copyしたものを格納
      const undoItem: StackItem = cloneSnapshot(
        currentNodes,
        currentEdges,
        focusedNodeId
      )
      const currentHistory = getCurrentHistory(historyByPj, currentPjId)
      const newHistory = pushUndoItem(currentHistory, undoItem, MAX_STACK_SIZE)
      const newHistoryMap = updateHistoryMap(
        historyByPj,
        currentPjId,
        newHistory
      )

      set({ projects: newPjs, historyByPj: newHistoryMap })
    },
    addComment: (nodeId: string, content: string) => {
      const {
        projects: currentPjs,
        currentPjId,
        focusedNodeId,
        historyByPj,
      } = get()
      const currentPj = getCurrentPj(currentPjs, currentPjId)
      const { nodes: currentNodes, edges: currentEdges } = currentPj

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

      // 新nodes,edgesを反映したprojectsを取得
      // 注意：storeへの反映は末尾のsetでまとめて実施
      const newPj = updateGraphInPj(currentPj, newNodes, currentEdges)
      const newPjs = updatePjInPjs(currentPjs, currentPjId, newPj)

      // Undo用：更新前グラフをundoStackに格納
      // 念のためdeep copyしたものを格納
      const undoItem: StackItem = cloneSnapshot(
        currentNodes,
        currentEdges,
        focusedNodeId
      )
      const currentHistory = getCurrentHistory(historyByPj, currentPjId)
      const newHistory = pushUndoItem(currentHistory, undoItem, MAX_STACK_SIZE)
      const newHistoryMap = updateHistoryMap(
        historyByPj,
        currentPjId,
        newHistory
      )

      set({ projects: newPjs, historyByPj: newHistoryMap })
    },
    editComment: (
      nodeId: string,
      commentId: string,
      updatedContent: string
    ) => {
      const {
        projects: currentPjs,
        currentPjId,
        focusedNodeId,
        historyByPj,
      } = get()
      const currentPj = getCurrentPj(currentPjs, currentPjId)
      const { nodes: currentNodes, edges: currentEdges } = currentPj

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

      // 新nodes,edgesを反映したprojectsを取得
      // 注意：storeへの反映は末尾のsetでまとめて実施
      const newPj = updateGraphInPj(currentPj, newNodes, currentEdges)
      const newPjs = updatePjInPjs(currentPjs, currentPjId, newPj)

      // Undo用：更新前グラフをundoStackに格納
      // 念のためdeep copyしたものを格納
      const undoItem: StackItem = cloneSnapshot(
        currentNodes,
        currentEdges,
        focusedNodeId
      )
      const currentHistory = getCurrentHistory(historyByPj, currentPjId)
      const newHistory = pushUndoItem(currentHistory, undoItem, MAX_STACK_SIZE)
      const newHistoryMap = updateHistoryMap(
        historyByPj,
        currentPjId,
        newHistory
      )

      set({ projects: newPjs, historyByPj: newHistoryMap })
    },
    deleteComment: (nodeId: string, commentId: string) => {
      const {
        projects: currentPjs,
        currentPjId,
        focusedNodeId,
        historyByPj,
      } = get()
      const currentPj = getCurrentPj(currentPjs, currentPjId)
      const { nodes: currentNodes, edges: currentEdges } = currentPj

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

      // 新nodes,edgesを反映したprojectsを取得
      // 注意：storeへの反映は末尾のsetでまとめて実施
      const newPj = updateGraphInPj(currentPj, newNodes, currentEdges)
      const newPjs = updatePjInPjs(currentPjs, currentPjId, newPj)

      // Undo用：更新前グラフをundoStackに格納
      // 念のためdeep copyしたものを格納
      const undoItem: StackItem = cloneSnapshot(
        currentNodes,
        currentEdges,
        focusedNodeId
      )
      const currentHistory = getCurrentHistory(historyByPj, currentPjId)
      const newHistory = pushUndoItem(currentHistory, undoItem, MAX_STACK_SIZE)
      const newHistoryMap = updateHistoryMap(
        historyByPj,
        currentPjId,
        newHistory
      )

      set({ projects: newPjs, historyByPj: newHistoryMap })
    },
    showDoneNodes: true,
    setShowDoneNodes: (show: boolean) => {
      set({
        showDoneNodes: show,
      })
    },
    /* undo・redo管理 */
    historyByPj: {},
    pushPrevGraphToUndo: (currentPjId: string, prevGraph: StackItem) => {
      const { historyByPj } = get()

      const undoItem: StackItem = cloneSnapshot(
        prevGraph.nodes,
        prevGraph.edges,
        prevGraph.focusedNodeId
      )
      const currentHistory = getCurrentHistory(historyByPj, currentPjId)
      const newHistory = pushUndoItem(currentHistory, undoItem, MAX_STACK_SIZE)
      const newHistoryMap = updateHistoryMap(
        historyByPj,
        currentPjId,
        newHistory
      )

      set({ historyByPj: newHistoryMap })
    },
    undo: () => {
      const {
        projects: currentPjs,
        focusedNodeId,
        currentPjId,
        historyByPj,
      } = get()
      const history = getCurrentHistory(historyByPj, currentPjId)
      const currentPj = getCurrentPj(currentPjs, currentPjId)
      const { undoStack, redoStack } = history

      const [poppedItem, newUndoStack] = popFromStack(undoStack)
      if (!poppedItem) return //pop対象0の場合undefinedを返すため

      const redoItem = cloneSnapshot(
        currentPj.nodes,
        currentPj.edges,
        focusedNodeId
      )
      const newRedoStack = pushToStack(redoStack, redoItem, MAX_STACK_SIZE)

      const restoredPj = updateGraphInPj(
        currentPj,
        poppedItem.nodes,
        poppedItem.edges
      )
      const restoredPjs = updatePjInPjs(currentPjs, currentPjId, restoredPj)

      const newHistory: History = {
        undoStack: newUndoStack,
        redoStack: newRedoStack,
      }
      const newHistoryMap = updateHistoryMap(
        historyByPj,
        currentPjId,
        newHistory
      )

      set({
        projects: restoredPjs,
        historyByPj: newHistoryMap,
        focusedNodeId: poppedItem.focusedNodeId,
        editingNodeId: null,
        commentPopupId: null,
      })
    },
    redo: () => {
      const {
        projects: currentPjs,
        currentPjId,
        focusedNodeId,
        historyByPj,
      } = get()
      const history = getCurrentHistory(historyByPj, currentPjId)
      const currentPj = getCurrentPj(currentPjs, currentPjId)
      const { undoStack, redoStack } = history

      const [poppedItem, newRedoStack] = popFromStack(redoStack)
      if (!poppedItem) return //pop対象0の場合undefinedを返すため

      const undoItem = cloneSnapshot(
        currentPj.nodes,
        currentPj.edges,
        focusedNodeId
      )
      const newUndoStack = pushToStack(undoStack, undoItem, MAX_STACK_SIZE)

      const restoredPj = updateGraphInPj(
        currentPj,
        poppedItem.nodes,
        poppedItem.edges
      )
      const restoredPjs = updatePjInPjs(currentPjs, currentPjId, restoredPj)

      const newHistory: History = {
        undoStack: newUndoStack,
        redoStack: newRedoStack,
      }
      const newHistoryMap = updateHistoryMap(
        historyByPj,
        currentPjId,
        newHistory
      )

      set({
        projects: restoredPjs,
        historyByPj: newHistoryMap,
        focusedNodeId: poppedItem.focusedNodeId,
        editingNodeId: null,
        commentPopupId: null,
      })
    },
  }))
)

export default useMindMapStore
