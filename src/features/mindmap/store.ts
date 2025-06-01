import {
  applyNodeChanges,
  applyEdgeChanges,
  Position,
  type Edge,
  type EdgeChange,
  type Node,
  type NodeChange,
  type OnNodesChange,
  type OnEdgesChange,
} from '@xyflow/react'
import { create } from 'zustand'
import { nanoid } from 'nanoid/non-secure'

export type MindMapStore = {
  nodes: Node[]
  edges: Edge[]
  onNodesChange: OnNodesChange
  onEdgesChange: OnEdgesChange
}

const initialNodes: Node[] = [
  {
    // id: nanoid(),
    id: '1',
    // type: 'mindmap',
    type: 'default',
    data: { label: '1' },
    targetPosition: Position.Left,
    sourcePosition: Position.Right,
    position: { x: 0, y: 0 },
  },
  {
    // id: nanoid(),
    id: '2',
    // type: 'mindmap',
    type: 'default',
    data: { label: '2' },
    targetPosition: Position.Left,
    sourcePosition: Position.Right,
    position: { x: 0, y: 300 },
  },
  {
    // id: nanoid(),
    id: '3',
    // type: 'mindmap',
    type: 'default',
    data: { label: '3' },
    targetPosition: Position.Left,
    sourcePosition: Position.Right,
    position: { x: 0, y: 600 },
  },
  {
    // id: nanoid(),
    id: '1-1',
    // type: 'mindmap',
    type: 'default',
    data: { label: '1-1' },
    targetPosition: Position.Left,
    sourcePosition: Position.Right,
    position: { x: 300, y: 0 },
    parentId: '1',
  },
  {
    // id: nanoid(),
    id: '1-2',
    // type: 'mindmap',
    type: 'default',
    data: { label: '1-2' },
    targetPosition: Position.Left,
    sourcePosition: Position.Right,
    position: { x: 300, y: 100 },
    parentId: '1',
  },
  {
    // id: nanoid(),
    id: '2-1',
    // type: 'mindmap',
    type: 'default',
    data: { label: '2-1' },
    targetPosition: Position.Left,
    sourcePosition: Position.Right,
    position: { x: 300, y: 0 },
    parentId: '2',
  },
  {
    // id: nanoid(),
    id: '2-1-1',
    // type: 'mindmap',
    type: 'default',
    data: { label: '2-1-1' },
    targetPosition: Position.Left,
    sourcePosition: Position.Right,
    position: { x: 300, y: 0 },
    parentId: '2-1',
  },
  {
    // id: nanoid(),
    id: '3-1',
    // type: 'mindmap',
    type: 'default',
    data: { label: '3-1' },
    targetPosition: Position.Left,
    sourcePosition: Position.Right,
    position: { x: 300, y: 0 },
    parentId: '3',
  },
  {
    // id: nanoid(),
    id: '3-2',
    // type: 'mindmap',
    type: 'default',
    data: { label: '3-2' },
    targetPosition: Position.Left,
    sourcePosition: Position.Right,
    position: { x: 300, y: 100 },
    parentId: '3',
  },
  {
    // id: nanoid(),
    id: '3-3',
    // type: 'mindmap',
    type: 'default',
    data: { label: '3-3' },
    targetPosition: Position.Left,
    sourcePosition: Position.Right,
    position: { x: 300, y: 200 },
    parentId: '3',
  },
]

const initialEdges: Edge[] = [
  {
    id: nanoid(),
    source: '1',
    target: '1-1',
    type: 'smoothstep',
  },
  {
    id: nanoid(),
    source: '1',
    target: '1-2',
    type: 'smoothstep',
  },
  {
    id: nanoid(),
    source: '2',
    target: '2-1',
    type: 'smoothstep',
  },
  {
    id: nanoid(),
    source: '2-1',
    target: '2-1-1',
    type: 'smoothstep',
  },
  {
    id: nanoid(),
    source: '3',
    target: '3-1',
    type: 'smoothstep',
  },
  {
    id: nanoid(),
    source: '3',
    target: '3-2',
    type: 'smoothstep',
  },
  {
    id: nanoid(),
    source: '3',
    target: '3-3',
    type: 'smoothstep',
  },
]

const useMindMapStore = create<MindMapStore>((set, get) => ({
  nodes: initialNodes,
  edges: initialEdges,
  onNodesChange: (changes: NodeChange[]) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes),
    })
  },
  onEdgesChange: (changes: EdgeChange[]) => {
    set({
      edges: applyEdgeChanges(changes, get().edges),
    })
  },
}))

export default useMindMapStore
