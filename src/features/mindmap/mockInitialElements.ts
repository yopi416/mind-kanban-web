const position = { x: 0, y: 0 }
const edgeType = 'smoothstep'

export const initialNodes = [
  {
    id: '1',
    type: 'custom',
    data: { label: 'input', parentId: null },
    position,
  },
  {
    id: '2',
    type: 'custom',
    data: { label: 'node 2', parentId: '1' },
    position,
  },
  {
    id: '2a',
    type: 'custom',
    data: { label: 'node 2a', parentId: '2' },
    position,
  },
  {
    id: '2b',
    type: 'custom',
    data: { label: 'node 2b', parentId: '2' },
    position,
  },
  {
    id: '2c',
    type: 'custom',
    data: { label: 'node 2c', parentId: '2' },
    position,
  },
  {
    id: '2d',
    type: 'custom',
    data: { label: 'node 2d', parentId: '2c' },
    position,
  },
  {
    id: '3',
    type: 'custom',
    data: { label: 'node 3', parentId: '1' },
    position,
  },
]

export const initialEdges = [
  { id: 'e12', source: '1', target: '2', type: edgeType },
  { id: 'e13', source: '1', target: '3', type: edgeType },
  { id: 'e22a', source: '2', target: '2a', type: edgeType },
  { id: 'e22b', source: '2', target: '2b', type: edgeType },
  { id: 'e22c', source: '2', target: '2c', type: edgeType },
  { id: 'e2c2d', source: '2c', target: '2d', type: edgeType },
  { id: 'e45', source: '4', target: '5', type: edgeType },
  { id: 'e56', source: '5', target: '6', type: edgeType },
  { id: 'e57', source: '5', target: '7', type: edgeType },
]
