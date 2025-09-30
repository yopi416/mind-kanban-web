const ROOT_NODE_ID = 'root'
const position = { x: 0, y: 0 }
const DEFAULT_NODE_TYPE = 'custom'

const testNode: Node<NodeData> = [
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

const depthNode = selectDescendants([testNode], ROOT_NODE_ID)
console.log(depthNode)
