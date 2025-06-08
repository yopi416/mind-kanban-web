import { type Node } from '@xyflow/react'
import { type NodeData } from '../components/CustomNode'

export function collectDescendantIds(
  nodeIds: string[],
  nodes: Node<NodeData>[]
): string[] {
  const collectedNodeIds = new Set<string>(nodeIds)
  const queue = [...nodeIds]

  // 幅優先で探索
  while (queue.length) {
    const current = queue.shift()!
    nodes.forEach((n) => {
      const pid = n.data?.parentId
      if (pid && pid === current && !collectedNodeIds.has(n.id)) {
        collectedNodeIds.add(n.id)
        queue.push(n.id)
      }
    })
  }
  return Array.from(collectedNodeIds)
}
