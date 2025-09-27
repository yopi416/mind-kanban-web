// import { Kanban } from './DebugKanbanPage'
import Kanban from '@/features/kanban'

export function KanbanPage() {
  return (
    <>
      <div className="pl-15 flex-1 overflow-auto pb-20 pt-10">
        <Kanban />
      </div>
    </>
  )
}
