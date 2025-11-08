import type { StateCreator } from 'zustand'
import type {
  WholeStoreState,
  OrchestratorSlice,
  KanbanColumns,
  KanbanCardRef,
  KanbanIndex,
  NodeData,
  History,
} from '@/types'
import { MAX_STACK_SIZE, ROOT_NODE_ID } from '@/features/mindmap/constants'
import {
  collectDescendantIdSet,
  findBottomEdgeIdx,
  findBottomNodeIdx,
  getEdgeIdxByTargetNodeId,
  getEdgesExcludingSubtree,
  getNodeIdxById,
  getNodesExcludingSubtree,
  getParentIdById,
  getSubtreeEdgesWithUpdatedParent,
  getSubtreeWithUpdatedParent,
} from '@/features/mindmap/utils/nodeTreeUtils'
import { getCurrentPj } from '@/features/mindmap/utils/projectUtils'
import {
  updateGraphInPj,
  updatePjInPjs,
} from '@/features/mindmap/utils/projectUtils'
import {
  cloneSnapshot,
  getCurrentHistory,
  popFromStack,
  pushToStack,
  pushUndoSnapshotForProject,
  updateHistoryMap,
} from '@/features/mindmap/utils/historyUtils'
import {
  pruneColumnsSubtree,
  removeCardByPjId,
} from '@/features/kanban/utils/kanbanColumnsUtils'
import {
  addIndexSubtree,
  addNodeIdToIndex,
  addPjToIndex,
  pruneIndexSubtree,
  removeProjectFromIndex,
} from '@/features/kanban/utils/kanbanIndexUtils'
import { insertAfter, insertBefore } from '@/features/mindmap/utils/arrayUtils'
import { nanoid } from 'nanoid'
import {
  createEdge,
  createNode,
  createPj,
} from '@/features/mindmap/utils/elementFactory'
import type { Node, Edge } from '@xyflow/react'

export const createOrchestratorSlice: StateCreator<
  WholeStoreState,
  [['zustand/subscribeWithSelector', never]],
  [],
  OrchestratorSlice
> = (set) => ({
  addPj: () => {
    set((prev) => {
      /*-------------------------------
            mindmapの更新
        ------------------------------- */
      const newPjId = nanoid()
      const newPj = createPj(newPjId, 'newProject')

      /*-------------------------------
            カンバンボードの更新
        ------------------------------- */

      // KanbanIndexに新規作成するpjIdをキーとする空のsetを作成
      const nextIndex = addPjToIndex(prev.kanbanIndex, newPjId)

      /*-------------------------------
            履歴の更新
        ------------------------------- */
      // 新規プロジェクトに対応する空historyを作成する
      //   const newHistoryMap: HistoryByPj = {
      //     ...prev.historyByPj,
      //     [newPjId]: createEmptyHistory(),
      //   }

      /*-------------------------------
            まとめてセット
        ------------------------------- */

      return {
        projects: {
          ...prev.projects,
          [newPjId]: newPj,
        },
        currentPjId: newPjId,
        focusedNodeId: ROOT_NODE_ID,
        movingNodeId: null,
        editingNodeId: null,
        commentPopupId: null,
        historyByPj: {}, // 履歴を空にする
        kanbanIndex: nextIndex,
      }
    })
  },
  deletePj: (pjId: string) => {
    set((prev) => {
      if (!prev.projects[pjId]) return {}

      /*-------------------------------
                mindmapの更新
        ------------------------------- */

      // プロジェクトが0個にならない仕様
      // currentPjIdがnullを取る場合の対応に時間がかかるためこの仕様とする
      const newPjs = { ...prev.projects }
      delete newPjs[pjId]
      if (Object.keys(newPjs).length === 0) return {}

      // 選択中のpjと別のpjを削除できる仕様だが、同一の場合は先頭のpjに移動
      let newCurrentPjId = prev.currentPjId
      if (newCurrentPjId === pjId) {
        const [nextId] = Object.keys(newPjs)
        newCurrentPjId = nextId
      }

      /*-------------------------------
                カンバンボードの更新
        ------------------------------- */

      // kanbanColumnsから該当pjIdのCardRefを削除
      const nextCols: KanbanColumns = removeCardByPjId(prev.kanbanColumns, pjId)

      // kanbanIndexから該当pjIDのsetを削除
      const targetKanbanIdx = prev.kanbanIndex.get(pjId)
      let nextIndex: KanbanIndex = prev.kanbanIndex

      if (targetKanbanIdx) {
        nextIndex = removeProjectFromIndex(prev.kanbanIndex, pjId)
      }

      /*-------------------------------
                履歴の更新
        ------------------------------- */
      // undo/redo用 historyも削除しておく
      const newHistoryMap = { ...prev.historyByPj }
      delete newHistoryMap[pjId]

      /*-------------------------------
                まとめてセット
        ------------------------------- */
      console.log(nextCols)
      console.log(nextIndex)

      return {
        projects: newPjs,
        currentPjId: newCurrentPjId,
        movingNodeId: null,
        editingNodeId: null,
        commentPopupId: null,
        focusedNodeId: null,
        historyByPj: newHistoryMap,
        kanbanColumns: nextCols,
        kanbanIndex: nextIndex,
      }
    })
  },
  deleteNodesCascade: (nodeIdToDelete: string) => {
    if (nodeIdToDelete === ROOT_NODE_ID) return // rootノードは削除不可

    set((prev) => {
      const {
        projects,
        currentPjId: targetPjId,
        focusedNodeId,
        historyByPj,
      } = prev

      const targetPj = getCurrentPj(projects, targetPjId)
      const descendantNodeIdSet = collectDescendantIdSet(
        [nodeIdToDelete],
        targetPj.nodes
      )

      /*-------------------------------
        mindmapの更新
        ------------------------------- */
      const nextNodes = targetPj.nodes.filter(
        (node) => !descendantNodeIdSet.has(node.id)
      )

      const nextEdges = targetPj.edges.filter(
        (edge) =>
          !descendantNodeIdSet.has(edge.source) &&
          !descendantNodeIdSet.has(edge.target)
      )

      // 新nodes,edgesを反映したprojectsを取得
      // 注意：storeへの反映は末尾のsetでまとめて実施
      const nextPj = updateGraphInPj(targetPj, nextNodes, nextEdges)
      const nextPjs = updatePjInPjs(projects, targetPjId, nextPj)

      /*-------------------------------
                 カンバンボードの更新
                ------------------------------- */

      // 削除対象ノードをkanbanColumnsから削除
      const nextCols: KanbanColumns = pruneColumnsSubtree(
        prev.kanbanColumns,
        descendantNodeIdSet
      )

      // 削除対象ノードをkanbanindexから削除
      const nextIndex: KanbanIndex = pruneIndexSubtree(
        prev.kanbanIndex,
        targetPjId,
        descendantNodeIdSet
      )

      /*-------------------------------
                 履歴の更新
                ------------------------------- */
      // 更新前グラフをundoStackに格納
      // 念のためdeep copyしたものを格納
      const nextHistoryMap = pushUndoSnapshotForProject({
        nodes: targetPj.nodes,
        edges: targetPj.edges,
        focusedNodeId,
        kanbanIndex: prev.kanbanIndex,
        kanbanColumns: prev.kanbanColumns,
        historyByPj,
        pjId: targetPjId,
        maxStackSize: MAX_STACK_SIZE,
      })

      //   const undoItem: StackItem = cloneSnapshot(
      //     targetPj.nodes,
      //     targetPj.edges,
      //     focusedNodeId,
      //     prev.kanbanIndex,
      //     prev.kanbanColumns
      //   )
      //   const currentHistory = getCurrentHistory(historyByPj, targetPjId)
      //   const nextHistory = pushUndoItem(currentHistory, undoItem, MAX_STACK_SIZE)
      //   const nextHistoryMap = updateHistoryMap(
      //     historyByPj,
      //     targetPjId,
      //     nextHistory
      //   )

      /*-------------------------------
                 まとめてset
                ------------------------------- */
      return {
        projects: nextPjs,
        historyByPj: nextHistoryMap,
        kanbanColumns: nextCols,
        kanbanIndex: nextIndex,
      }
    })
  },
  moveNodeTobeChild: (movingNodeId: string, parentId: string) => {
    set((prev) => {
      const {
        projects,
        currentPjId: targetPjId,
        focusedNodeId,
        historyByPj,
      } = prev

      const targetPj = getCurrentPj(projects, targetPjId)
      const { nodes: currentNodes, edges: currentEdges } = targetPj

      const descendantNodeIdSet = collectDescendantIdSet(
        [movingNodeId],
        currentNodes
      )

      // 改修ポイント：本当はdescendantNodeIdSetで完結したい
      const movingSubtreeIds = Array.from(descendantNodeIdSet)

      // const movingSubtreeIds = collectDescendantIds([movingNodeId], currentNodes)

      /*-------------------------------
                mindmapの更新
            ------------------------------- */

      /* 対象ノードの配下含め、ドラッグ先ノードの子ノードの最下層に移動 */
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
      const nextNodes = insertAfter(
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
      const nextEdges = insertAfter(
        edgesWithoutMovingEdges,
        movingEdges,
        bottomEdgeIdx
      )

      /* zustand storeに反映 */

      // 新nodes,edgesを反映したprojectsを取得
      // 注意：storeへの反映は末尾のsetでまとめて実施
      const nextPj = updateGraphInPj(targetPj, nextNodes, nextEdges)
      const nextPjs = updatePjInPjs(projects, targetPjId, nextPj)

      /*-------------------------------
                カンバンボードの更新
            ------------------------------- */

      // 親ノードがkanbanindexにあるとき
      const targetKanbanIdx = prev.kanbanIndex.get(targetPjId)
      const prevParentId = getParentIdById(movingNodeId, currentNodes) // 移動前の親ノードのID

      let nextCols: KanbanColumns = prev.kanbanColumns
      let nextIndex: KanbanIndex = prev.kanbanIndex

      if (targetKanbanIdx) {
        if (targetKanbanIdx.has(parentId)) {
          // 対象ノード群をkanbanColumnsから全削除
          nextCols = pruneColumnsSubtree(
            prev.kanbanColumns,
            descendantNodeIdSet
          )

          // 対象ノード群をkanbanindexに追加
          nextIndex = addIndexSubtree(
            prev.kanbanIndex,
            targetPjId,
            descendantNodeIdSet
          )
        } else if (prevParentId && targetKanbanIdx.has(prevParentId)) {
          // 元の親がKanbanIndexに存在するのに、移動先の親はKanbanIndexにない場合
          // 自ノードをKanbanColumnsに追加する(KanbanIndexには既に存在)

          const cardToAdd: KanbanCardRef = {
            pjId: targetPjId,
            nodeId: movingNodeId,
          }

          nextCols = {
            ...nextCols,
            ['backlog']: [cardToAdd, ...nextCols['backlog']],
          }
        }
      }

      /*-------------------------------
                履歴の更新
            ------------------------------- */
      // 更新前グラフをundoStackに格納
      // 念のためdeep copyしたものを格納
      const nextHistoryMap = pushUndoSnapshotForProject({
        nodes: targetPj.nodes,
        edges: targetPj.edges,
        focusedNodeId,
        kanbanIndex: prev.kanbanIndex,
        kanbanColumns: prev.kanbanColumns,
        historyByPj,
        pjId: targetPjId,
        maxStackSize: MAX_STACK_SIZE,
      })

      /*-------------------------------
                まとめてset
            ------------------------------- */
      return {
        projects: nextPjs,
        historyByPj: nextHistoryMap,
        kanbanColumns: nextCols,
        kanbanIndex: nextIndex,
      }
    })
  },
  moveNodeAboveTarget: (
    movingNodeId: string,
    belowNodeId: string,
    parentId: string
  ) => {
    set((prev) => {
      const {
        projects,
        currentPjId: targetPjId,
        focusedNodeId,
        historyByPj,
      } = prev

      const targetPj = getCurrentPj(projects, targetPjId)
      const { nodes: currentNodes, edges: currentEdges } = targetPj

      const descendantNodeIdSet = collectDescendantIdSet(
        [movingNodeId],
        currentNodes
      )

      // 改修ポイント：本当はdescendantNodeIdSetで完結したい
      const movingSubtreeIds = Array.from(descendantNodeIdSet)

      /*-------------------------------
                mindmapの更新
            ------------------------------- */

      /* 対象ノードの配下含め、ドラッグ先ノードの1つ上に移動 */
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
        return {}
      }

      // subtreeを挿入
      const nextNodes = insertBefore(
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
        return {}
      }

      // 移動するエッジ群を挿入
      const nextEdges = insertBefore(
        edgesWithoutMovingEdges,
        movingEdges,
        belowEdgeIdx
      )

      /* zustand storeに反映 */

      // pj更新ロジックの規定
      // 新nodes,edgesを反映したprojectsを取得
      // 注意：storeへの反映は末尾のsetでまとめて実施
      // const newPj = updateGraphInPj(currentPj, newNodes, newEdges)
      // const newPjs = updatePjInPjs(currentPjs, currentPjId, newPj)
      const nextPj = updateGraphInPj(targetPj, nextNodes, nextEdges)
      const nextPjs = updatePjInPjs(projects, targetPjId, nextPj)

      /*-------------------------------
                カンバンボードの更新
            ------------------------------- */

      // 親ノードがkanbanindexにあるとき
      const targetKanbanIdx = prev.kanbanIndex.get(targetPjId)
      const prevParentId = getParentIdById(movingNodeId, currentNodes) // 移動前の親ノードのID

      let nextCols: KanbanColumns = prev.kanbanColumns
      let nextIndex: KanbanIndex = prev.kanbanIndex

      if (targetKanbanIdx) {
        if (targetKanbanIdx.has(parentId)) {
          // 対象ノード群をkanbanColumnsから全削除
          nextCols = pruneColumnsSubtree(
            prev.kanbanColumns,
            descendantNodeIdSet
          )

          // 対象ノード群をkanbanindexに追加
          nextIndex = addIndexSubtree(
            prev.kanbanIndex,
            targetPjId,
            descendantNodeIdSet
          )
        } else if (prevParentId && targetKanbanIdx.has(prevParentId)) {
          // 元の親がKanbanIndexに存在するのに、移動先の親はKanbanIndexにない場合
          // 自ノードをKanbanColumnsに追加する(KanbanIndexには既に存在)

          const cardToAdd: KanbanCardRef = {
            pjId: targetPjId,
            nodeId: movingNodeId,
          }

          nextCols = {
            ...nextCols,
            ['backlog']: [cardToAdd, ...nextCols['backlog']],
          }
        }
      }

      /*-------------------------------
                履歴の更新
            ------------------------------- */
      // 更新前グラフをundoStackに格納
      // 念のためdeep copyしたものを格納
      const nextHistoryMap = pushUndoSnapshotForProject({
        nodes: targetPj.nodes,
        edges: targetPj.edges,
        focusedNodeId,
        kanbanIndex: prev.kanbanIndex,
        kanbanColumns: prev.kanbanColumns,
        historyByPj,
        pjId: targetPjId,
        maxStackSize: MAX_STACK_SIZE,
      })
      /*-------------------------------
                まとめてset
            ------------------------------- */
      return {
        projects: nextPjs,
        historyByPj: nextHistoryMap,
        kanbanColumns: nextCols,
        kanbanIndex: nextIndex,
      }
    })
  },
  moveNodeBelowTarget: (
    movingNodeId: string,
    aboveNodeId: string,
    parentId: string
  ) => {
    set((prev) => {
      const {
        projects,
        currentPjId: targetPjId,
        focusedNodeId,
        historyByPj,
      } = prev

      const targetPj = getCurrentPj(projects, targetPjId)
      const { nodes: currentNodes, edges: currentEdges } = targetPj

      const descendantNodeIdSet = collectDescendantIdSet(
        [movingNodeId],
        currentNodes
      )

      // 改修ポイント：本当はdescendantNodeIdSetで完結したい
      const movingSubtreeIds = Array.from(descendantNodeIdSet)

      /*-------------------------------
                mindmapの更新
            ------------------------------- */

      /* 対象ノードの配下含め、ドラッグ先ノードの1つ下に移動 */
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
        return {}
      }

      // subtreeを挿入
      const nextNodes = insertAfter(
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
        return {}
      }

      // 移動するエッジ群を挿入
      const nextEdges = insertAfter(
        edgesWithoutMovingEdges,
        movingEdges,
        aboveEdgeIdx
      )

      /* zustand storeに反映 */

      // pj更新ロジックの規定
      // 新nodes,edgesを反映したprojectsを取得
      // 注意：storeへの反映は末尾のsetでまとめて実施

      const nextPj = updateGraphInPj(targetPj, nextNodes, nextEdges)
      const nextPjs = updatePjInPjs(projects, targetPjId, nextPj)

      /*-------------------------------
                カンバンボードの更新
            ------------------------------- */

      const targetKanbanIdx = prev.kanbanIndex.get(targetPjId)
      const prevParentId = getParentIdById(movingNodeId, currentNodes) // 移動前の親ノードのID

      let nextCols: KanbanColumns = prev.kanbanColumns
      let nextIndex: KanbanIndex = prev.kanbanIndex

      if (targetKanbanIdx) {
        if (targetKanbanIdx.has(parentId)) {
          // 親ノードがkanbanindexにあるとき

          // 対象ノード群をkanbanColumnsから全削除
          nextCols = pruneColumnsSubtree(
            prev.kanbanColumns,
            descendantNodeIdSet
          )

          // 対象ノード群をkanbanindexに追加
          nextIndex = addIndexSubtree(
            prev.kanbanIndex,
            targetPjId,
            descendantNodeIdSet
          )
        } else if (prevParentId && targetKanbanIdx.has(prevParentId)) {
          // 元の親がKanbanIndexに存在するのに、移動先の親はKanbanIndexにない場合
          // 自ノードをKanbanColumnsに追加する(KanbanIndexには既に存在)

          const cardToAdd: KanbanCardRef = {
            pjId: targetPjId,
            nodeId: movingNodeId,
          }

          nextCols = {
            ...nextCols,
            ['backlog']: [cardToAdd, ...nextCols['backlog']],
          }
        }
      }

      /*-------------------------------
                履歴の更新
            ------------------------------- */
      // 更新前グラフをundoStackに格納
      // 念のためdeep copyしたものを格納
      const nextHistoryMap = pushUndoSnapshotForProject({
        nodes: targetPj.nodes,
        edges: targetPj.edges,
        focusedNodeId,
        kanbanIndex: prev.kanbanIndex,
        kanbanColumns: prev.kanbanColumns,
        historyByPj,
        pjId: targetPjId,
        maxStackSize: MAX_STACK_SIZE,
      })

      /*-------------------------------
                まとめてset
            ------------------------------- */
      return {
        projects: nextPjs,
        historyByPj: nextHistoryMap,
        kanbanColumns: nextCols,
        kanbanIndex: nextIndex,
      }
    })
  },
  addHorizontalElement: (parentId: string) => {
    set((prev) => {
      // historyはundoStack追加用に取得
      const {
        projects,
        currentPjId: targetPjId,
        focusedNodeId,
        historyByPj,
      } = prev

      const targetPj = getCurrentPj(projects, targetPjId)
      const { nodes: currentNodes, edges: currentEdges } = targetPj

      /*-------------------------------
                mindmapの更新
            ------------------------------- */

      /* 子ノード群の中の最下層ノードのインデックスを取得し、その1つ下に新規ノードを挿入 */
      const newNodeId = nanoid()
      const newNode = createNode(newNodeId, parentId)
      const nextNodes = insertAfter<Node<NodeData>>(
        currentNodes,
        [newNode],
        findBottomNodeIdx(parentId, currentNodes) //子ノード群の中の最下層ノードのインデックス
      )

      /* 最下層ノードをターゲットとするエッジのインデックスを取得し、その1つ下に新規エッジを挿入 */
      const newEdge = createEdge(parentId, newNodeId)
      const nextEdges = insertAfter<Edge>(
        currentEdges,
        [newEdge],
        findBottomEdgeIdx(parentId, currentEdges) //最下層ノードをターゲットとするエッジのインデックス
      )

      // 新nodes,edgesを反映したprojectsを取得
      // 注意：storeへの反映は末尾のsetでまとめて実施
      const nextPj = updateGraphInPj(targetPj, nextNodes, nextEdges)
      const nextPjs = updatePjInPjs(projects, targetPjId, nextPj)

      /*-------------------------------
                カンバンボードの更新
            ------------------------------- */

      const targetKanbanIdx = prev.kanbanIndex.get(targetPjId)

      // let nextCols: KanbanColumns = prev.kanbanColumns;
      let nextIndex: KanbanIndex = prev.kanbanIndex

      if (targetKanbanIdx && targetKanbanIdx.has(parentId)) {
        // 新規作成ノードをkanbanindexに追加
        nextIndex = addNodeIdToIndex(prev.kanbanIndex, targetPjId, newNodeId)
      }

      /*-------------------------------
                履歴の更新
            ------------------------------- */

      // Undo用：更新前グラフをundoStackに格納
      // 念のためdeep copyしたものを格納
      const nextHistoryMap = pushUndoSnapshotForProject({
        nodes: targetPj.nodes,
        edges: targetPj.edges,
        focusedNodeId,
        kanbanIndex: prev.kanbanIndex,
        kanbanColumns: prev.kanbanColumns,
        historyByPj,
        pjId: targetPjId,
        maxStackSize: MAX_STACK_SIZE,
      })

      /*-------------------------------
                まとめてset
            ------------------------------- */
      return {
        projects: nextPjs,
        historyByPj: nextHistoryMap,
        focusedNodeId: newNodeId, // 新規作成したノードにfocusあてる
        kanbanIndex: nextIndex,
      }
    })
  },

  addVerticalElement: (aboveNodeId: string, parentId: string) => {
    set((prev) => {
      // historyはundoStack追加用に取得
      const {
        projects,
        currentPjId: targetPjId,
        focusedNodeId,
        historyByPj,
      } = prev

      const targetPj = getCurrentPj(projects, targetPjId)
      const { nodes: currentNodes, edges: currentEdges } = targetPj

      /*-------------------------------
                mindmapの更新
            ------------------------------- */

      /* 選択中ノード（=aboveNode）のインデックスを取得し、その1つ下に新規ノードを挿入 */
      const aboveNodeIdx = getNodeIdxById(aboveNodeId, currentNodes)
      if (aboveNodeIdx === -1) {
        console.error(`Node "${aboveNodeId}" not found.`)
        return {}
      }

      const newNodeId = nanoid()
      const newNode: Node<NodeData> = createNode(newNodeId, parentId)
      const nextNodes = insertAfter<Node<NodeData>>(
        currentNodes,
        [newNode],
        aboveNodeIdx
      )

      /* 選択中ノード（=aboveNode）をターゲットとするedgeのインデックスを取得し、その1つ下に新規Edgeを挿入 */
      const aboveEdgeIdx = getEdgeIdxByTargetNodeId(aboveNodeId, currentEdges)
      if (aboveEdgeIdx === -1) {
        console.error(`No edge found with target "${aboveNodeId}"`)
        return {}
      }

      const newEdge: Edge = createEdge(parentId, newNodeId)
      const nextEdges = insertAfter<Edge>(currentEdges, [newEdge], aboveEdgeIdx)

      // 新nodes,edgesを反映したprojectsを取得
      // 注意：storeへの反映は末尾のsetでまとめて実施
      const nextPj = updateGraphInPj(targetPj, nextNodes, nextEdges)
      const nextPjs = updatePjInPjs(projects, targetPjId, nextPj)

      /*-------------------------------
                カンバンボードの更新
            ------------------------------- */

      const targetKanbanIdx = prev.kanbanIndex.get(targetPjId)

      // let nextCols: KanbanColumns = prev.kanbanColumns;
      let nextIndex: KanbanIndex = prev.kanbanIndex

      if (targetKanbanIdx && targetKanbanIdx.has(parentId)) {
        // 新規作成ノードをkanbanindexに追加
        nextIndex = addNodeIdToIndex(prev.kanbanIndex, targetPjId, newNodeId)
      }

      /*-------------------------------
                履歴の更新
            ------------------------------- */

      // Undo用：更新前グラフをundoStackに格納
      // 念のためdeep copyしたものを格納
      const nextHistoryMap = pushUndoSnapshotForProject({
        nodes: targetPj.nodes,
        edges: targetPj.edges,
        focusedNodeId,
        kanbanIndex: prev.kanbanIndex,
        kanbanColumns: prev.kanbanColumns,
        historyByPj,
        pjId: targetPjId,
        maxStackSize: MAX_STACK_SIZE,
      })

      /*-------------------------------
                まとめてset
            ------------------------------- */
      return {
        projects: nextPjs,
        historyByPj: nextHistoryMap,
        focusedNodeId: newNodeId, // 新規作成したノードにfocusあてる
        kanbanIndex: nextIndex,
      }
    })
  },
  undo: () => {
    set((prev) => {
      const {
        projects: currentPjs,
        focusedNodeId,
        currentPjId,
        historyByPj,
      } = prev

      const history = getCurrentHistory(historyByPj, currentPjId)
      const currentPj = getCurrentPj(currentPjs, currentPjId)
      const { undoStack, redoStack } = history

      const [poppedItem, newUndoStack] = popFromStack(undoStack)
      if (!poppedItem) return {} //pop対象0の場合undefinedを返すため

      const redoItem = cloneSnapshot(
        currentPj.nodes,
        currentPj.edges,
        focusedNodeId,
        prev.kanbanIndex,
        prev.kanbanColumns
      )

      const newRedoStack = pushToStack(redoStack, redoItem, MAX_STACK_SIZE)

      // 次のプロジェクト(mindmap)の生成
      const restoredPj = updateGraphInPj(
        currentPj,
        poppedItem.nodes,
        poppedItem.edges
      )
      const restoredPjs = updatePjInPjs(currentPjs, currentPjId, restoredPj)

      // 次のkanbanIndex, Columnsの生成
      const newKanbanIndex: KanbanIndex = poppedItem.kanbanIndex
      const newKanbanCols: KanbanColumns = poppedItem.kanbanColumns

      // 次の履歴の生成
      const newHistory: History = {
        undoStack: newUndoStack,
        redoStack: newRedoStack,
      }
      const newHistoryMap = updateHistoryMap(
        historyByPj,
        currentPjId,
        newHistory
      )

      return {
        projects: restoredPjs,
        historyByPj: newHistoryMap,
        focusedNodeId: poppedItem.focusedNodeId,
        editingNodeId: null,
        commentPopupId: null,
        kanbanIndex: newKanbanIndex,
        kanbanColumns: newKanbanCols,
      }
    })
  },
  redo: () => {
    set((prev) => {
      const {
        projects: currentPjs,
        focusedNodeId,
        currentPjId,
        historyByPj,
      } = prev

      const history = getCurrentHistory(historyByPj, currentPjId)
      const currentPj = getCurrentPj(currentPjs, currentPjId)
      const { undoStack, redoStack } = history

      const [poppedItem, newRedoStack] = popFromStack(redoStack)
      if (!poppedItem) return {} //pop対象0の場合undefinedを返すため

      const undoItem = cloneSnapshot(
        currentPj.nodes,
        currentPj.edges,
        focusedNodeId,
        prev.kanbanIndex,
        prev.kanbanColumns
      )
      const newUndoStack = pushToStack(undoStack, undoItem, MAX_STACK_SIZE)

      // 次のプロジェクト(mindmap)の生成
      const restoredPj = updateGraphInPj(
        currentPj,
        poppedItem.nodes,
        poppedItem.edges
      )
      const restoredPjs = updatePjInPjs(currentPjs, currentPjId, restoredPj)

      // 次のkanbanIndex, Columnsの生成
      const newKanbanIndex: KanbanIndex = poppedItem.kanbanIndex
      const newKanbanCols: KanbanColumns = poppedItem.kanbanColumns

      // 次の履歴の生成
      const newHistory: History = {
        undoStack: newUndoStack,
        redoStack: newRedoStack,
      }

      const newHistoryMap = updateHistoryMap(
        historyByPj,
        currentPjId,
        newHistory
      )

      return {
        projects: restoredPjs,
        historyByPj: newHistoryMap,
        focusedNodeId: poppedItem.focusedNodeId,
        editingNodeId: null,
        commentPopupId: null,
        kanbanIndex: newKanbanIndex,
        kanbanColumns: newKanbanCols,
      }
    })
  },
  lockVersion: 0,
  setLockVersion: (v: number) => {
    set({
      lockVersion: v,
    })
  },
})
