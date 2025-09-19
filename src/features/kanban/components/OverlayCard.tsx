import type { NodeData, Projects, WholeStoreState } from '@/types'
import type { Node } from '@xyflow/react'
import { useWholeStore } from '@/state/store'
import { useShallow } from 'zustand/shallow'

import { CardView } from './CardView'

const selector = (store: WholeStoreState) => {
  return {
    activeCardRef: store.activeCardRef,
  }
}

export const OverlayCard = () => {
  const { activeCardRef } = useWholeStore(useShallow(selector))

  // 移動中ノードがない時は表示しないのでnullでOK
  if (!activeCardRef) return null

  const allPjs: Projects = useWholeStore.getState().projects
  const nodesInTargetPj = allPjs[activeCardRef.pjId].nodes

  const activeNode: Node<NodeData> | undefined = nodesInTargetPj.find(
    (node) => node.id === activeCardRef.nodeId
  )

  if (!activeNode) {
    console.warn(
      `Node not found: pjId=${activeCardRef.pjId}, nodeId=${activeCardRef.nodeId}`
    )
    return null
  }

  const activeNodeData = activeNode.data

  return (
    <CardView className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
      {activeNodeData.label}
    </CardView>
  )
}
