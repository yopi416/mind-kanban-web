import { useWholeStore } from '@/state/store'
import type { WholeStoreState } from '@/types'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { KanbanCardRef, NodeData, Projects } from '@/types'
import type { Node } from '@xyflow/react'
import { CardView } from './CardView'
import { useShallow } from 'zustand/shallow'
import { useMemo } from 'react'

// type SortableProps = Card & { activeCardId: UniqueIdentifier | null }
type SortableCardProps = KanbanCardRef

export function SortableCard(props: SortableCardProps) {
  const { pjId, nodeId } = props

  //   console.log('SortableCard:', nodeId, ' render')

  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: nodeId })

  const selector = useMemo(
    () => (store: WholeStoreState) => {
      // zustand storeのPjsから、このカード（nodeId）に対応するカードの中身(nodeData)を取ってくる

      const allPjs: Projects = store.projects
      const nodesInTargetPj = allPjs[pjId].nodes

      // 【ロジック改善検討余地あり】 現状、全カードでorder(N)
      // おそらくそこまで枚数が多くないので、大丈夫かもだが影響が出そうなら改善を検討
      const targetNode: Node<NodeData> | undefined = nodesInTargetPj.find(
        (node) => node.id === nodeId
      )

      if (!targetNode) {
        console.warn(`Node not found: pjId=${pjId}, nodeId=${nodeId}`)
      }

      return {
        cardData: targetNode ? targetNode.data : null,
      }
    },
    [pjId, nodeId]
  )

  const { cardData } = useWholeStore(useShallow(selector))

  // nullを返したとしても、呼び出し元のmapは無視して描画するため問題なし
  if (!cardData) return null

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  //dragされている時true
  //   const isActive = activeCardId === myOwnCardId

  const cls =
    'rounded-lg border bg-white p-3 shadow-sm transition-all duration-150'

  //   if (isActive) {
  //     // dragされている時薄くなる + 縮む
  //     cls += ' opacity-40 scale-95 rotate-[0.2deg] border-slate-400'
  //   } else {
  //     cls += ' border-slate-200'
  //   }

  return (
    <CardView
      ref={setNodeRef}
      style={style}
      className={cls}
      {...attributes}
      {...listeners}
    >
      {cardData.label}
    </CardView>
  )
}
