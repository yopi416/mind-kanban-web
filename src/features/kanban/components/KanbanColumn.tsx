import { useWholeStore } from '@/state/store'
import type { KanbanColumnName, WholeStoreState } from '@/types'
import { SortableContext } from '@dnd-kit/sortable'
import { CardDropZone } from './CardDropZone'
import { SortableCard } from './SortableCard'
import { useShallow } from 'zustand/shallow'

type KanbanColumnProps = {
  colName: KanbanColumnName
}

export const KanbanColumn = (props: KanbanColumnProps) => {
  const selector = (store: WholeStoreState) => {
    return {
      cardRefList: store.kanbanColumns[props.colName],
    }
  }

  //   console.log('KanbanColumn:', props.columnName, ' render')

  const { cardRefList } = useWholeStore(useShallow(selector))

  return (
    <div
      key={props.colName}
      className="flex min-w-[280px] max-w-[320px] flex-col gap-3 rounded-xl border border-slate-200 bg-slate-100 p-3 shadow-sm"
    >
      {/* <SortableContext id={props.columnName} items={containerKeyTocardIds[key]}> */}
      <SortableContext
        id={props.colName}
        items={cardRefList.map((cardRef) => cardRef.nodeId)}
      >
        <div className="rounded-md border border-slate-300 bg-slate-200 px-2 py-1.5 text-sm font-semibold text-slate-700">
          {props.colName}
        </div>

        {/* 内部でuseDroppableを使ったコンポーネント */}
        <CardDropZone id={props.colName}>
          aa
          {cardRefList.map((cardRef) => (
            // 内部でuseSortableを使ったコンポーネント
            <SortableCard
              key={cardRef.nodeId}
              {...cardRef}
              // activeCardId={activeCardId}
            />
          ))}
        </CardDropZone>
      </SortableContext>
    </div>
  )
}
