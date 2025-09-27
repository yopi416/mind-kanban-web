import { useWholeStore } from '@/state/store'
import type { KanbanColumnName, WholeStoreState } from '@/types'
import { SortableContext } from '@dnd-kit/sortable'
import { CardDropZone } from './CardDropZone'
import { SortableCard } from './SortableCard'
import { useShallow } from 'zustand/shallow'
import { ApplyDoneButton } from '../ApplyDoneButton'

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

  const isDone = props.colName === 'done'
  const hasCards = cardRefList.length > 0

  return (
    <div
      key={props.colName}
      className="flex min-h-[70vh] min-w-[320px] max-w-[340px] flex-col rounded-xl border border-slate-200 bg-slate-100 shadow-sm"
      // className="flex min-w-[320px] max-w-[340px] flex-col rounded-xl border border-slate-200 bg-white shadow-sm"
    >
      {/* 共通デザインのヘッダー */}
      <div className="flex items-center justify-between rounded-t-xl bg-slate-100 px-3 py-2">
        <div className="text-s font-semibold uppercase tracking-wide text-slate-700">
          {props.colName.replace('-', ' ')}
        </div>
        <span className="ml-2 rounded-full bg-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-700">
          {cardRefList.length}
        </span>
      </div>

      {/* <SortableContext id={props.columnName} items={containerKeyTocardIds[key]}> */}
      <SortableContext
        id={props.colName}
        items={cardRefList.map((cardRef) => cardRef.nodeId)}
      >
        {/* 内部でuseDroppableを使ったコンポーネント */}
        <CardDropZone id={props.colName}>
          <div className="flex flex-1 flex-col gap-2 p-3">
            {cardRefList.map((cardRef) => (
              // 内部でuseSortableを使ったコンポーネント
              <SortableCard key={cardRef.nodeId} {...cardRef} />
            ))}
          </div>
        </CardDropZone>
      </SortableContext>

      {/* DONE列だけのフッターボタン */}
      {isDone && hasCards && (
        <div className="mt-auto rounded-b-xl border-t bg-slate-50 px-3 py-3">
          <ApplyDoneButton />
        </div>
      )}
    </div>
  )
}
