import { useWholeStore } from '@/state/store'
import type { WholeStoreState } from '@/types'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { KanbanCardRef, NodeData, Projects } from '@/types'
import type { Node } from '@xyflow/react'
import { CardView } from './CardView'
import { useShallow } from 'zustand/shallow'
import { useMemo } from 'react'
import { FiTrash2 } from 'react-icons/fi'

// type SortableProps = Card & { activeCardId: UniqueIdentifier | null }
type SortableCardProps = KanbanCardRef

export function SortableCard(props: SortableCardProps) {
  const { pjId, nodeId } = props

  /* カードの中身（node.data）を取得 */
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: nodeId })

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
        removeCard: store.removeCard,
      }
    },
    [pjId, nodeId]
  )

  const { cardData, removeCard } = useWholeStore(useShallow(selector))

  // nullを返したとしても、呼び出し元のmapは無視して描画するため問題なし
  if (!cardData) return null

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  let cls =
    'rounded-lg border bg-white p-3 shadow-sm transition-all duration-150'

  if (isDragging) {
    // dragされている時薄くなる + 縮む
    cls += ' opacity-40 scale-95 rotate-[0.2deg] border-slate-400'
  } else {
    cls += ' border-slate-200'
  }

  const onDelete = (e: React.MouseEvent) => {
    e.stopPropagation() // ドラッグ開始を防ぐ
    e.preventDefault()
    const cardToDelete: KanbanCardRef = { ...props }
    removeCard(cardToDelete)
  }

  return (
    <CardView
      ref={setNodeRef}
      style={style}
      className={cls + ' relative'}
      {...attributes}
      {...listeners}
    >
      {/* 右上の削除ボタン */}
      <button
        onClick={onDelete}
        onPointerDown={(e) => e.stopPropagation()} // ドラッグイベントを親に伝搬させない
        className="absolute right-1 top-1 rounded p-1 text-gray-400 hover:text-red-500"
        aria-label="カードを削除"
        title="カードを削除"
      >
        <FiTrash2 className="h-3 w-3" />
      </button>

      {cardData.label}
    </CardView>
  )
}
