import { ReactFlow, Background, Controls, type NodeOrigin } from '@xyflow/react'

import { useShallow } from 'zustand/shallow'
import useMindMapStore, { type MindMapStore } from './store'
import CustomNode from './components/CustomNode'

import '@xyflow/react/dist/style.css'

const selector = (state: MindMapStore) => ({
  nodes: state.nodes,
  edges: state.edges,
  onNodesChange: state.onNodesChange,
  onEdgesChange: state.onEdgesChange,
})

const nodeTypes = {
  custom: CustomNode,
}

// this makes the node origin to be in the center of a node
const nodeOrigin: NodeOrigin = [0.5, 0.5]

function MindMap() {
  const { nodes, edges, onNodesChange, onEdgesChange } = useMindMapStore(
    useShallow(selector)
  )

  return (
    <div style={{ height: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        nodeOrigin={nodeOrigin}
        nodesDraggable={false}
        fitView
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  )
}

export default MindMap
