import { useWholeStore } from '@/state/store'
import type { KanbanCard, WholeStoreState } from '@/types'
import { useShallow } from 'zustand/shallow'

const selector = (store: WholeStoreState) => {
  return {
    kanbanColumns: store.kanbanColumns,
    addCard: store.addCard,
    moveCard: store.moveCard,
    removeCard: store.removeCard,
  }
}

export function DebugPanel() {
  const { kanbanColumns, addCard, moveCard, removeCard } = useWholeStore(
    useShallow(selector)
  )

  const card1: KanbanCard = {
    pjId: 'pj1',
    nodeId: '2',
  }

  const card2: KanbanCard = {
    pjId: 'pj1',
    nodeId: '3',
  }

  return (
    <>
      <div>
        {Object.entries(kanbanColumns).map((column) => {
          const [columnKey, cards] = column

          return (
            <div key={columnKey}>
              <div>{columnKey}:</div>
              {cards.map((card) => {
                return <div key={card.nodeId}>{card.nodeId}</div>
              })}
            </div>
          )
        })}
      </div>
      <div className="fixed bottom-4 right-4 space-x-2 rounded bg-white p-2 shadow">
        <button
          onClick={() => addCard(card1, 'backlog')}
          className="border px-2 py-1"
        >
          add card1
        </button>

        <button
          onClick={() => addCard(card2, 'backlog')}
          className="border px-2 py-1"
        >
          add card2
        </button>
        <button
          onClick={() => moveCard(card1, 'backlog', 'doing', 0)}
          className="border px-2 py-1"
        >
          move card1
        </button>
        <button
          onClick={() => moveCard(card2, 'backlog', 'doing', 0)}
          className="border px-2 py-1"
        >
          move card2
        </button>

        <button onClick={() => removeCard(card2)} className="border px-2 py-1">
          remove card2
        </button>
      </div>
    </>
  )
}
