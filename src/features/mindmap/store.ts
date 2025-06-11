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

export type MindMapStore = {
  nodes: Node<NodeData>[]
  edges: Edge[]
  onNodesChange: OnNodesChange<Node<NodeData>>
  onEdgesChange: OnEdgesChange
  onNodesDelete: OnNodesDelete<Node<NodeData>>
  setNodes: (nodes: Node<NodeData>[]) => void
  addHorizontalElement: (parentId: string) => void
  addVerticalElement: (aboveNodeId: string, parentId: string) => void
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
  addHorizontalElement: (parentId: string) => {
    const currentNodes = get().nodes
    const currentEdges = get().edges

    const newNodeId = nanoid()
    const newNode: Node<NodeData> = createNode(newNodeId, parentId)
    const newEdge: Edge = createEdge(parentId, newNodeId)

    set({
      nodes: insertAfter<Node<NodeData>>(
        currentNodes,
        newNode,
        findBottomNodeIdx(parentId, currentNodes)
      ),
      edges: insertAfter<Edge>(
        currentEdges,
        newEdge,
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
      nodes: insertAfter<Node<NodeData>>(currentNodes, newNode, aboveNodeIdx),
      edges: insertAfter<Edge>(currentEdges, newEdge, aboveEdgeIdx),
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
