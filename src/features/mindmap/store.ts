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
import { collectDescendantIds } from './utils/nodeTreeUtils'

import { initialNodes, initialEdges } from './mockInitialElements'
import { type NodeData } from './components/CustomNode'

export type MindMapStore = {
  nodes: Node<NodeData>[]
  edges: Edge[]
  onNodesChange: OnNodesChange<Node<NodeData>>
  onEdgesChange: OnEdgesChange
  onNodesDelete: OnNodesDelete<Node<NodeData>>
  setNodes: (nodes: Node<NodeData>[]) => void
  updateNodeLabel: (nodeId: string, label: string) => void
}

const useMindMapStore = create<MindMapStore>((set, get) => ({
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
        nodes: state.nodes.filter((node) => !deletedNodeIds.includes(node.id)),
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
}))

export default useMindMapStore
