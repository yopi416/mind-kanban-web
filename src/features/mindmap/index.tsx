// import { ReactFlow, Background, Controls, type NodeOrigin } from '@xyflow/react'
import {
  ReactFlow,
  Background,
  Controls,
  type OnConnectStart,
  type OnConnectEnd,
} from '@xyflow/react'

import { useCallback, useEffect } from 'react'
import { useShallow } from 'zustand/shallow'
import useMindMapStore, { type MindMapStore } from './store'
import CustomNode from './components/CustomNode'
import { getLayoutedNodes } from './utils/dagreLayout'

import { isEqual } from 'lodash'
import { collectDescendantIds, getParentIdById } from './utils/nodeTreeUtils'

import '@xyflow/react/dist/style.css'

const selector = (store: MindMapStore) => ({
  nodes: store.nodes,
  edges: store.edges,
  onNodesChange: store.onNodesChange,
  onEdgesChange: store.onEdgesChange,
  onNodesDelete: store.onNodesDelete,
  setNodes: store.setNodes,
  moveNodeTobeChild: store.moveNodeTobeChild,
  moveNodeBelowTarget: store.moveNodeBelowTarget,
  moveNodeAboveTarget: store.moveNodeAboveTarget,
  setMovingNodeId: store.setMovingNodeId,
})

const nodeTypes = {
  custom: CustomNode,
}

// this makes the node origin to be in the center of a node
// const nodeOrigin: NodeOrigin = [0.5, 0.5]

function MindMap() {
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onNodesDelete,
    setNodes,
    moveNodeTobeChild,
    moveNodeBelowTarget,
    moveNodeAboveTarget,
    setMovingNodeId,
  } = useMindMapStore(useShallow(selector))

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
        const { nodes: currentNodes, movingNodeId: movingNodeId } =
          useMindMapStore.getState()

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
            console.log('Right')
          } else {
            // ルートノードの上下には移動不可
            if (targetNodeId === '1') {
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
              console.log('Top')
            } else {
              moveNodeBelowTarget(movingNodeId, targetNodeId, parentId)
              console.log('Bottom')
            }
          }
        }
      } finally {
        setMovingNodeId(null)
      }
    },
    [
      setMovingNodeId,
      moveNodeTobeChild,
      moveNodeBelowTarget,
      moveNodeAboveTarget,
    ]
  )

  //全ノードが計測済み（node.measuredが格納されたら）になったらdagreによるレイアウト実行
  useEffect(() => {
    if (nodes.length && nodes.every((node) => node.measured)) {
      const layoutedNodes = getLayoutedNodes(nodes, edges, 'LR')

      // 💡 変更があるときだけ setNodes を呼ぶ
      if (!isEqual(layoutedNodes, nodes)) {
        setNodes(layoutedNodes)
      }
    }
  }, [nodes, edges, setNodes])

  return (
    <div style={{ height: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodesDelete={onNodesDelete}
        onConnectStart={onConnectStart}
        onConnectEnd={onConnectEnd}
        nodeTypes={nodeTypes}
        connectionLineStyle={{ display: 'none' }}
        // nodeOrigin={nodeOrigin}
        // nodesDraggable={false}
        // fitView
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  )
}

export default MindMap
