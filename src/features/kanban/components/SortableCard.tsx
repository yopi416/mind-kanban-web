import { useWholeStore } from '@/state/store'
import type { WholeStoreState } from '@/types'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { KanbanCardRef } from '@/types'
import { CardView } from './CardView'
import { useShallow } from 'zustand/shallow'
import { FiTrash2 } from 'react-icons/fi'
import { CardSubtasks } from '@/features/mindmap/components/CardSubtasks'

// type SortableProps = Card & { activeCardId: UniqueIdentifier | null }
type SortableCardProps = KanbanCardRef

const selector = (store: WholeStoreState) => {
  return {
    removeCard: store.removeCard,
  }
}

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

  const { removeCard } = useWholeStore(useShallow(selector))

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  // let cls =
  //   'rounded-lg border bg-white p-3 shadow-sm transition-all duration-150'

  let cls =
    'relative min-w-0 overflow-hidden rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition-all duration-150 hover:border-slate-300 hover:shadow-md'

  if (isDragging) {
    // dragされている時薄くなる + 縮む
    // cls += ' opacity-40 scale-95 rotate-[0.2deg] border-slate-400'
    cls += ' opacity-40 scale-[0.98] rotate-[0.2deg] border-slate-300'
  } else {
    cls += ' border-slate-200'
  }

  const onDelete = (e: React.MouseEvent) => {
    e.stopPropagation() // ドラッグ開始を防ぐ
    e.preventDefault()
    const cardToDelete: KanbanCardRef = { ...props }
    removeCard(cardToDelete)
    console.log(useWholeStore.getState().kanbanColumns)
  }

  return (
    <CardView
      ref={setNodeRef}
      style={style}
      // className={cls + ' relative'}
      className={cls}
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

      {/* パンくず＋子タスク（Depth=1） */}
      <CardSubtasks card={{ pjId, nodeId }} />
    </CardView>
  )
}
