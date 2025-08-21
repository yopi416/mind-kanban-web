import type { Node, Edge } from '@xyflow/react'
import { type NodeData } from '../../types'
import { type Projects } from '../../types'
import { ROOT_NODE_ID, DEFAULT_NODE_TYPE, DEFAULT_EDGE_TYPE } from './constants'

const position = { x: 0, y: 0 }

const now = () => new Date().toISOString()

export const initialNodesPj1: Node<NodeData>[] = [
  {
    id: ROOT_NODE_ID,
    type: DEFAULT_NODE_TYPE,
    data: { label: 'input', parentId: null, isDone: false, comments: [] },
    position,
  },
  {
    id: '2',
    type: DEFAULT_NODE_TYPE,
    data: {
      label: 'node 2',
      parentId: ROOT_NODE_ID,
      isDone: false,
      comments: [],
    },
    position,
  },
  {
    id: '2a',
    type: DEFAULT_NODE_TYPE,
    data: { label: 'node 2a', parentId: '2', isDone: false, comments: [] },
    position,
  },
  {
    id: '2b',
    type: DEFAULT_NODE_TYPE,
    data: { label: 'node 2b', parentId: '2', isDone: false, comments: [] },
    position,
  },
  {
    id: '2c',
    type: DEFAULT_NODE_TYPE,
    data: { label: 'node 2c', parentId: '2', isDone: false, comments: [] },
    position,
  },
  {
    id: '2d',
    type: DEFAULT_NODE_TYPE,
    data: { label: 'node 2d', parentId: '2c', isDone: false, comments: [] },
    position,
  },
  {
    id: '3',
    type: DEFAULT_NODE_TYPE,
    data: {
      label: 'node 3',
      parentId: ROOT_NODE_ID,
      isDone: false,
      comments: [],
    },
    position,
  },
]

export const initialEdgesPj1: Edge[] = [
  {
    id: 'e_' + ROOT_NODE_ID + '_2',
    source: ROOT_NODE_ID,
    target: '2',
    type: DEFAULT_EDGE_TYPE,
  },
  {
    id: 'e_' + ROOT_NODE_ID + '_3',
    source: ROOT_NODE_ID,
    target: '3',
    type: DEFAULT_EDGE_TYPE,
  },
  { id: 'e_2_2a', source: '2', target: '2a', type: DEFAULT_EDGE_TYPE },
  { id: 'e_2_2b', source: '2', target: '2b', type: DEFAULT_EDGE_TYPE },
  { id: 'e_2_2c', source: '2', target: '2c', type: DEFAULT_EDGE_TYPE },
  { id: 'e_2c_2d', source: '2c', target: '2d', type: DEFAULT_EDGE_TYPE },
  { id: 'e_4_5', source: '4', target: '5', type: DEFAULT_EDGE_TYPE },
  { id: 'e_5_6', source: '5', target: '6', type: DEFAULT_EDGE_TYPE },
  { id: 'e_5_7', source: '5', target: '7', type: DEFAULT_EDGE_TYPE },
]

export const initialNodesPj2: Node<NodeData>[] = [
  {
    id: ROOT_NODE_ID,
    type: DEFAULT_NODE_TYPE,
    data: { label: 'input', parentId: null, isDone: false, comments: [] },
    position,
  },
  {
    id: '2',
    type: DEFAULT_NODE_TYPE,
    data: {
      label: 'node 2',
      parentId: ROOT_NODE_ID,
      isDone: false,
      comments: [],
    },
    position,
  },
  {
    id: '2a',
    type: DEFAULT_NODE_TYPE,
    data: { label: 'node 2a', parentId: '2', isDone: false, comments: [] },
    position,
  },
  {
    id: '2b',
    type: DEFAULT_NODE_TYPE,
    data: { label: 'node 2b', parentId: '2', isDone: false, comments: [] },
    position,
  },

  {
    id: '3',
    type: DEFAULT_NODE_TYPE,
    data: {
      label: 'node 3',
      parentId: ROOT_NODE_ID,
      isDone: false,
      comments: [],
    },
    position,
  },

  {
    id: '3a',
    type: DEFAULT_NODE_TYPE,
    data: { label: 'node 3a', parentId: '3', isDone: false, comments: [] },
    position,
  },

  {
    id: '3b',
    type: DEFAULT_NODE_TYPE,
    data: { label: 'node 3b', parentId: '3a', isDone: false, comments: [] },
    position,
  },
]

export const initialEdgesPj2: Edge[] = [
  {
    id: 'e_' + ROOT_NODE_ID + '_2',
    source: ROOT_NODE_ID,
    target: '2',
    type: DEFAULT_EDGE_TYPE,
  },
  {
    id: 'e_' + ROOT_NODE_ID + '_3',
    source: ROOT_NODE_ID,
    target: '3',
    type: DEFAULT_EDGE_TYPE,
  },
  { id: 'e_2_2a', source: '2', target: '2a', type: DEFAULT_EDGE_TYPE },
  { id: 'e_2_2b', source: '2', target: '2b', type: DEFAULT_EDGE_TYPE },
  { id: 'e_3_3a', source: '3', target: '3a', type: DEFAULT_EDGE_TYPE },
  { id: 'e_3a_3b', source: '3a', target: '3b', type: DEFAULT_EDGE_TYPE },
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
