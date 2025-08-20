import type { Node, Edge } from '@xyflow/react'
import { type NodeData } from '../../types'
import { type Projects } from '../../types'

const position = { x: 0, y: 0 }
const edgeType = 'smoothstep'

const now = () => new Date().toISOString()

export const initialNodesPj1: Node<NodeData>[] = [
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

export const initialEdgesPj1: Edge[] = [
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

export const initialNodesPj2: Node<NodeData>[] = [
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
    id: '3',
    type: 'custom',
    data: { label: 'node 3', parentId: '1', isDone: false, comments: [] },
    position,
  },

  {
    id: '3a',
    type: 'custom',
    data: { label: 'node 3a', parentId: '3', isDone: false, comments: [] },
    position,
  },

  {
    id: '3b',
    type: 'custom',
    data: { label: 'node 3b', parentId: '3a', isDone: false, comments: [] },
    position,
  },
]

export const initialEdgesPj2: Edge[] = [
  { id: 'e_1_2', source: '1', target: '2', type: edgeType },
  { id: 'e_1_3', source: '1', target: '3', type: edgeType },
  { id: 'e_2_2a', source: '2', target: '2a', type: edgeType },
  { id: 'e_2_2b', source: '2', target: '2b', type: edgeType },
  { id: 'e_3_3a', source: '3', target: '3a', type: edgeType },
  { id: 'e_3a_3b', source: '3a', target: '3b', type: edgeType },
]

export const initialPjs: Projects = {
  pj1: {
    id: 'pj1',
    name: 'pj1',
    nodes: initialNodesPj1,
    edges: initialEdgesPj1,
    createdAt: now(),
    updatedAt: now(),
  },
  pj2: {
    id: 'pj2',
    name: 'pj2',
    nodes: initialNodesPj2,
    edges: initialEdgesPj2,
    createdAt: now(),
    updatedAt: now(),
  },
}
