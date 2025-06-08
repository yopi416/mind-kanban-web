// import { ReactFlow, Background, Controls, type NodeOrigin } from '@xyflow/react'
import { ReactFlow, Background, Controls } from '@xyflow/react'

import { useEffect } from 'react'
import { useShallow } from 'zustand/shallow'
import useMindMapStore, { type MindMapStore } from './store'
import CustomNode from './components/CustomNode'
import { getLayoutedNodes } from './utils/dagreLayout'

import { isEqual } from 'lodash'

import '@xyflow/react/dist/style.css'

const selector = (state: MindMapStore) => ({
  nodes: state.nodes,
  edges: state.edges,
  onNodesChange: state.onNodesChange,
  onEdgesChange: state.onEdgesChange,
  onNodesDelete: state.onNodesDelete,
  setNodes: state.setNodes,
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
    setNodes,
    onNodesDelete,
  } = useMindMapStore(useShallow(selector))

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
        nodeTypes={nodeTypes}
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
