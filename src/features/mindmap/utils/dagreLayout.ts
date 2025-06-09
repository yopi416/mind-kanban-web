import dagre from '@dagrejs/dagre'
import { type Node, type Edge, Position } from '@xyflow/react'
import type { NodeData } from '../components/CustomNode'

const FALLBACK_W = 160
const FALLBACK_H = 40

export function getLayoutedNodes(
  nodes: Node<NodeData>[],
  edges: Edge[],
  dir: 'TB' | 'LR' = 'LR'
): Node<NodeData>[] {
  // console.log("testtesttest")
  const isHorizontal = dir === 'LR'
  const g = new dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}))

  g.setGraph({
    rankdir: dir,
    // align: "UR",
    // acyclicer: 'greedy',
    nodesep: 50,
    ranksep: 80,
    marginx: 100,
    // marginy: 30,
  })

  nodes.forEach((node) => {
    const w = node.measured?.width ?? FALLBACK_W
    const h = node.measured?.height ?? FALLBACK_H
    // const w = FALLBACK_W
    // const h = FALLBACK_H
    g.setNode(node.id, { width: w, height: h })
  })

  edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target)
  })

  dagre.layout(g, { disableOptimalOrderHeuristic: true })

  const layoutedNodes = nodes.map((node) => {
    const { x, y, width, height } = g.node(node.id)

    return {
      ...node,
      targetPosition: isHorizontal ? Position.Left : Position.Top,
      sourcePosition: isHorizontal ? Position.Right : Position.Bottom,

      // We are shifting the dagre node position (anchor=center center) to the top left
      // so it matches the React Flow node anchor point (top left).
      position: {
        x: x - width / 2,
        y: y - height / 2,
      },
    }
  })

  return layoutedNodes
}
