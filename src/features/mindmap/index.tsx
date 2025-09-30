import {
  ReactFlow,
  Background,
  Controls,
  type OnConnectStart,
  type OnConnectEnd,
} from '@xyflow/react'

import { useCallback, useEffect } from 'react'
import { useShallow } from 'zustand/shallow'
import type { WholeStoreState, KanbanColumnName, KanbanCardRef } from '@/types'
import CustomNode from './components/CustomNode'
import { getLayoutedNodes } from './utils/dagreLayout'

import { isEqual } from 'lodash'
import {
  collectDescendantIds,
  getParentIdById,
  getTopNodeIdByParentId,
  getAboveNodeId,
  getBelowNodeId,
} from './utils/nodeTreeUtils'

import '@xyflow/react/dist/style.css'
import { ROOT_NODE_ID } from './constants'
import { Button } from '@/components/ui/button'
import { FaUndoAlt, FaRedoAlt } from 'react-icons/fa'
import { useWholeStore } from '@/state/store'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@radix-ui/react-tooltip'

const selector = (store: WholeStoreState) => {
  const currentPj = store.projects[store.currentPjId]

  // historyByPj[store.currentPjId] は初回アクセスの場合存在しない = undefined
  // undo/redoボタンのdisabled判定用にcanUndo/Redoを使用する
  // undefinedの場合はcanUndo/redoが0なので、falseとなる
  // undoStackに追加されるような時に、historyByPj[store.currentPjId]を作成する(store.ts)
  const currentHistory = store.historyByPj[store.currentPjId]
  const canUndo = (currentHistory?.undoStack.length ?? 0) > 0
  const canRedo = (currentHistory?.redoStack.length ?? 0) > 0

  return {
    nodes: currentPj?.nodes ?? [],
    edges: currentPj?.edges ?? [],
    onNodesChange: store.onNodesChange,
    onEdgesChange: store.onEdgesChange,
    // deleteNodes: store.deleteNodes,
    deleteNodesCascade: store.deleteNodesCascade,
    setNodes: store.setNodes,
    addHorizontalElement: store.addHorizontalElement,
    addVerticalElement: store.addVerticalElement,
    moveNodeTobeChild: store.moveNodeTobeChild,
    moveNodeBelowTarget: store.moveNodeBelowTarget,
    moveNodeAboveTarget: store.moveNodeAboveTarget,
    setMovingNodeId: store.setMovingNodeId,
    focusedNodeId: store.focusedNodeId,
    setFocusedNodeId: store.setFocusedNodeId,
    updateIsDone: store.updateIsDone,
    undo: store.undo,
    redo: store.redo,
    canUndo,
    canRedo,
  }
}

const nodeTypes = {
  custom: CustomNode,
}

function createShortcuts(
  state: ReturnType<typeof useWholeStore.getState>
): Record<string, (e: KeyboardEvent) => void> {
  const {
    focusedNodeId,
    projects,
    currentPjId,
    setFocusedNodeId,
    addHorizontalElement,
    addVerticalElement,
    setCommentPopupId,
    // deleteNodes,
    deleteNodesCascade,
    updateIsDone,
    setEditingNodeId,
    addCard,
  } = state

  if (!focusedNodeId) return {}

  const currentPj = projects[currentPjId]
  if (!currentPj) return {}

  const nodes = currentPj.nodes ?? []

  /* Delete / Backspace 共通ハンドラを 1 個用意 */
  const del = (e: KeyboardEvent) => {
    e.preventDefault()

    if (focusedNodeId === ROOT_NODE_ID) return // ルートは削除不可
    deleteNodesCascade(focusedNodeId)

    /* フォーカスをひとつ上 or 親へ移す */
    const nextId =
      getAboveNodeId(focusedNodeId, nodes) ??
      getParentIdById(focusedNodeId, nodes) ??
      null
    setFocusedNodeId(nextId)
  }

  const shortcuts: Record<string, (e: KeyboardEvent) => void> = {
    /* ---フォーカス移動--- */
    ArrowUp: (e) => {
      e.preventDefault()
      const nextId = getAboveNodeId(focusedNodeId, nodes)
      if (nextId) setFocusedNodeId(nextId)
    },
    ArrowDown: (e) => {
      e.preventDefault()
      const nextId = getBelowNodeId(focusedNodeId, nodes)
      if (nextId) setFocusedNodeId(nextId)
    },
    ArrowRight: (e) => {
      e.preventDefault()
      const nextId = getTopNodeIdByParentId(focusedNodeId, nodes)

      if (nextId) setFocusedNodeId(nextId)
    },
    ArrowLeft: (e) => {
      e.preventDefault()
      const nextId = getParentIdById(focusedNodeId, nodes)

      if (nextId) setFocusedNodeId(nextId)
    },

    /* ---削除--- */
    Delete: del,
    Backspace: del,

    /* ---ノード追加--- */
    Enter: (e) => {
      e.preventDefault()
      const parentNodeId = getParentIdById(focusedNodeId, nodes)
      if (parentNodeId) addVerticalElement(focusedNodeId, parentNodeId)
    },
    Tab: (e) => {
      e.preventDefault()
      addHorizontalElement(focusedNodeId)
    },
    /* ---タスク完了--- */
    d: (e) => {
      e.preventDefault()
      const focusedNode = nodes.find((node) => node.id === focusedNodeId)
      if (focusedNode) updateIsDone(focusedNodeId, !focusedNode.data.isDone)
    },

    /* ノードテキスト編集 */
    e: (e) => {
      e.preventDefault()
      setEditingNodeId(focusedNodeId)
    },

    /* --- コメントポップアップ --- */
    m: (e) => {
      e.preventDefault()
      setCommentPopupId(focusedNodeId)
    },

    /* --- カンバンボード追加用 */
    k: (e) => {
      e.preventDefault()

      if (focusedNodeId === ROOT_NODE_ID) {
        alert('ルートノードはカンバンボードに追加できません')
        return
      }

      const cardRef: KanbanCardRef = {
        pjId: currentPjId,
        nodeId: focusedNodeId,
      }

      const columnToAddInto: KanbanColumnName = 'backlog'

      addCard(cardRef, columnToAddInto)
    },
  }

  return shortcuts
}

function MindMap() {
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    setNodes,
    moveNodeTobeChild,
    moveNodeBelowTarget,
    moveNodeAboveTarget,
    setMovingNodeId,
    setFocusedNodeId,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useWholeStore(useShallow(selector))

  // ノードの付け替え（ドラッグ開始時）の処理
  const onConnectStart: OnConnectStart = useCallback(
    (_, { nodeId }) => {
      setMovingNodeId(nodeId)
    },
    [setMovingNodeId]
  )

  // ノードの付け替え（ドロップ時）の処理
  const onConnectEnd: OnConnectEnd = useCallback(
    (e) => {
      try {
        // const { nodes: currentNodes, movingNodeId: movingNodeId } =
        //   useMindMapStore.getState()

        const { projects, currentPjId, movingNodeId } = useWholeStore.getState()

        const currentPj = projects[currentPjId]

        if (!currentPj) return

        const currentNodes = currentPj.nodes ?? []

        const target = e.target as HTMLElement
        const targetNodeElement = target.closest('.react-flow__node') //ノード外（該当する親要素がない）場合は null

        if (targetNodeElement && movingNodeId) {
          // 移動先の基準となるターゲットノードのIDを取得
          const targetNodeId = targetNodeElement.getAttribute('data-id')

          if (!targetNodeId) {
            return
          }

          // targetNodeIdが自分の配下のノードの場合処理を中止
          const sourceNodeDescendantIds = collectDescendantIds(
            [movingNodeId],
            currentNodes
          )
          if (sourceNodeDescendantIds.includes(targetNodeId)) {
            return
          }

          // ドロップ先がノードの上・下・右部分かを判断
          const rect = targetNodeElement.getBoundingClientRect()
          const x = 'touches' in e ? e.touches[0].clientX : e.clientX
          const y = 'touches' in e ? e.touches[0].clientY : e.clientY

          const offsetX = x - rect.left
          const offsetY = y - rect.top

          const isRight = offsetX > rect.width * (4 / 5)
          const isTop = offsetY < rect.height / 2

          if (isRight) {
            moveNodeTobeChild(movingNodeId, targetNodeId)
          } else {
            // ルートノードの上下には移動不可
            if (targetNodeId === ROOT_NODE_ID) {
              return
            }

            // ターゲットノードのparentIDを取得
            const parentId = getParentIdById(targetNodeId, currentNodes)

            if (parentId === null) {
              console.error(`ParentId of Node "${targetNodeId}" not found.`)
              return
            }

            if (isTop) {
              moveNodeAboveTarget(movingNodeId, targetNodeId, parentId)
            } else {
              moveNodeBelowTarget(movingNodeId, targetNodeId, parentId)
            }
          }

          setFocusedNodeId(movingNodeId)
        }
      } finally {
        setMovingNodeId(null)
      }
    },
    [
      setMovingNodeId,
      setFocusedNodeId,
      moveNodeTobeChild,
      moveNodeBelowTarget,
      moveNodeAboveTarget,
    ]
  )

  // 全ノードが計測済み（node.measuredが格納されたら）になったらdagreによるレイアウト実行
  useEffect(() => {
    if (nodes.length && nodes.every((node) => node.measured)) {
      const layoutedNodes = getLayoutedNodes(nodes, edges, 'LR')

      // 💡 変更があるときだけ setNodes を呼ぶ
      if (!isEqual(layoutedNodes, nodes)) {
        setNodes(layoutedNodes)
      }
    }
  }, [nodes, edges, setNodes])

  // Focusノードを矢印キーで移動
  useEffect(() => {
    const isComposing = (e: KeyboardEvent) => e.isComposing

    const handleKey = (e: KeyboardEvent) => {
      if (isComposing(e)) return

      // サイドバーのrename中はショートカットを無効化
      const target = e.target as HTMLElement | null
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          (target as HTMLElement).isContentEditable ||
          target.closest('[role="textbox"]'))
      ) {
        return
      }

      const state = useWholeStore.getState()
      // --- ① Undo/Redo をまずグローバルに処理 ---
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key

      // Undo: Ctrl/Cmd + Z（※Shiftなし = 純粋なUndo）
      if ((e.ctrlKey || e.metaKey) && key === 'z' && !e.shiftKey) {
        e.preventDefault()
        state.undo()
        return
      }

      // Redo: Ctrl+Y OR Cmd+Shift+Z
      if (
        (e.ctrlKey && key === 'y') ||
        (e.metaKey && e.shiftKey && key === 'z')
      ) {
        e.preventDefault()
        state.redo()
        return
      }

      // --- ② 残りのノード操作ショートカット ---
      const shortcuts = createShortcuts(state)
      const fn = shortcuts[key] // ← 正規化した key を使う
      if (fn) fn(e)
    }

    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  return (
    // <div style={{ height: '100%' }}>
    <div className="relative h-full w-full">
      {/* Undo/Redo toolbar */}
      <div className="bg-background/70 absolute left-3 top-3 z-10 flex items-center gap-1 rounded-xl border px-1.5 py-1 shadow-sm backdrop-blur">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={undo}
                disabled={!canUndo}
                aria-label="戻る (Ctrl+Z)"
              >
                <FaUndoAlt size={14} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>戻る（Ctrl+Z）</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={redo}
                disabled={!canRedo}
                aria-label="進む (Ctrl+Shift+Z)"
              >
                <FaRedoAlt size={14} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>進む（Ctrl+Shift+Z）</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      {/* <Button onClick={undo} disabled={!canUndo} size="sm">
        <FaUndoAlt size={10} />
      </Button>
      <Button onClick={redo} disabled={!canRedo} size="sm">
        <FaRedoAlt size={10} />
      </Button> */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        // onNodesDelete={onNodesDelete}
        onConnectStart={onConnectStart}
        onConnectEnd={onConnectEnd}
        nodeTypes={nodeTypes}
        deleteKeyCode={[]}
        connectionLineStyle={{ display: 'none' }}
        // nodeOrigin={nodeOrigin}
        nodesDraggable={false}
        style={{ width: '100%', height: '100%' }}

        // fitView
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  )
}

export default MindMap
