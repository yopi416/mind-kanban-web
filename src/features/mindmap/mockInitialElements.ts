import type { Node, Edge } from '@xyflow/react'
import { type NodeData } from '../../types'

const position = { x: 0, y: 0 }
const edgeType = 'smoothstep'

export const initialNodes: Node<NodeData>[] = [
  {
    id: '1',
    type: 'custom',
    data: { label: 'input', parentId: null, isDone: false, comments: [] },
    position,
  },
  {
    id: '2',
    type: 'custom',
    data: { label: 'node 2', parentId: '1', isDone: false, comments: [] },
    position,
  },
  {
    id: '2a',
    type: 'custom',
    data: { label: 'node 2a', parentId: '2', isDone: false, comments: [] },
    position,
  },
  {
    id: '2b',
    type: 'custom',
    data: { label: 'node 2b', parentId: '2', isDone: false, comments: [] },
    position,
  },
  {
    id: '2c',
    type: 'custom',
    data: { label: 'node 2c', parentId: '2', isDone: false, comments: [] },
    position,
  },
  {
    id: '2d',
    type: 'custom',
    data: { label: 'node 2d', parentId: '2c', isDone: false, comments: [] },
    position,
  },
  {
    id: '3',
    type: 'custom',
    data: { label: 'node 3', parentId: '1', isDone: false, comments: [] },
    position,
  },
]

export const initialEdges: Edge[] = [
  { id: 'e_1_2', source: '1', target: '2', type: edgeType },
  { id: 'e_1_3', source: '1', target: '3', type: edgeType },
  { id: 'e_2_2a', source: '2', target: '2a', type: edgeType },
  { id: 'e_2_2b', source: '2', target: '2b', type: edgeType },
  { id: 'e_2_2c', source: '2', target: '2c', type: edgeType },
  { id: 'e_2c_2d', source: '2c', target: '2d', type: edgeType },
  { id: 'e_4_5', source: '4', target: '5', type: edgeType },
  { id: 'e_5_6', source: '5', target: '6', type: edgeType },
  { id: 'e_5_7', source: '5', target: '7', type: edgeType },
]
