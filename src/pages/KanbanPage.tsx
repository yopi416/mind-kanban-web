import { DndContext, useDroppable } from '@dnd-kit/core'
import type {
  DragEndEvent,
  DragOverEvent,
  UniqueIdentifier,
} from '@dnd-kit/core'
import { SortableContext, useSortable, arrayMove } from '@dnd-kit/sortable'
import { useMemo, useState, useRef } from 'react'
// import { nanoid } from 'nanoid'
import { CSS } from '@dnd-kit/utilities'

type Card = {
  id: string
  title: string
}
// type ContainerKey = "backlog" | "todo" | "doing" | "done"
type CardContainer = Record<string, Card[]>

function Sortable(props: Card) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: props.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm"
      {...attributes}
      {...listeners}
    >
      {props.title}
    </div>
  )
}

type droppableProps = {
  id: string
  children: React.ReactNode
}

function Droppable(props: droppableProps) {
  const { setNodeRef } = useDroppable({ id: props.id })

  return (
    <div
      ref={setNodeRef}
      className="flex max-h-[calc(100vh-140px)] flex-col gap-2 overflow-y-auto rounded-lg p-1"
    >
      {props.children}
    </div>
  )
}

const initialCards: CardContainer = {
  backlog: [
    { id: 'row1-1', title: 'row1-1' },
    { id: 'row1-2', title: 'row1-2' },
  ],
  todo: [
    { id: 'row2-1', title: 'row2-1' },
    { id: 'row2-2', title: 'row2-2' },
  ],
  doing: [
    { id: 'row3-1', title: 'row3-1' },
    { id: 'row3-2', title: 'row3-2' },
  ],
  done: [
    { id: 'row4-1', title: 'row4-1' },
    { id: 'row4-2', title: 'row4-2' },
    { id: 'row4-3', title: 'row4-3' },
    { id: 'row4-4', title: 'row4-4' },
    { id: 'row4-5', title: 'row4-5' },
    { id: 'row4-6', title: 'row4-6' },
  ],
}

export function KanbanPage() {
  const [cardContainers, setCardContainers] =
    useState<CardContainer>(initialCards)

  // 全Containers中のカードに対して、 card.id: containerKey(格納先コンテナ) のMapを作成
  // このmapにより、指定したcardの格納先ContainerKeyをO(1)で取得できる
  const cardIdToContainerKey = useMemo(() => {
    const m = new Map<UniqueIdentifier, string>()

    for (const [containerKey, cards] of Object.entries(cardContainers)) {
      for (const card of cards) {
        m.set(card.id, containerKey)
      }
    }

    return m
  }, [cardContainers])

  function findContainerKeyByCardId(cardId: string): string | undefined {
    return cardIdToContainerKey.get(cardId)
  }

  function findContainerKeyByContainerId(
    containerId: string
  ): string | undefined {
    return cardContainers[containerId] ? containerId : undefined
  }

  const containerKeyTocardIds = useMemo(() => {
    const obj: Record<string, string[]> = {}

    for (const [containerKey, cards] of Object.entries(cardContainers)) {
      obj[containerKey] = cards.map((card) => card.id)
    }

    return obj
  }, [cardContainers])

  // 直前の配置と、1フレーム中に更新したかを記録（過度なsetState防止）
  const lastPlacementRef = useRef<{
    id: UniqueIdentifier
    to: string
    index: number
  } | null>(null)
  const movedInFrameRef = useRef(false)

  return (
    <DndContext onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
      <div className="flex items-start gap-4 overflow-x-auto bg-slate-50 p-4">
        {Object.keys(cardContainers).map((key) => {
          const cards = cardContainers[key]

          return (
            <div
              key={key}
              className="flex min-w-[280px] max-w-[320px] flex-col gap-3 rounded-xl border border-slate-200 bg-slate-100 p-3 shadow-sm"
            >
              <SortableContext id={key} items={containerKeyTocardIds[key]}>
                <div className="rounded-md border border-slate-300 bg-slate-200 px-2 py-1.5 text-sm font-semibold text-slate-700">
                  {key.toUpperCase()}
                </div>
                <Droppable id={key}>
                  {cards.map((card) => (
                    <Sortable key={card.id} {...card} />
                  ))}
                </Droppable>
              </SortableContext>
            </div>
          )
        })}
      </div>
    </DndContext>
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    lastPlacementRef.current = null
    if (!over) return

    const overId = over.id
    if (!overId || active.id === overId) return

    // コンテナ間でのカードのソートは扱わない（hadleDragOver管轄)
    const activeContainerKey = findContainerKeyByCardId(String(active.id)) // ドラッグ中Cardが所属するContainerのkey
    const overContainerKey = findContainerKeyByCardId(String(over.id)) // ドロップ先Cardが所属するContainerのkey
    // console.log("dragend: ", activeContainerKey, overContainerKey)

    if (
      !activeContainerKey ||
      !overContainerKey ||
      activeContainerKey !== overContainerKey
    )
      return

    setCardContainers((prevContainers) => {
      const targetCards = prevContainers[activeContainerKey] // 入れ替えが起こるコンテナのCard[]
      const activeCard = targetCards.find((card) => card.id === active.id)
      if (!activeCard) return prevContainers

      const activeCardIndex = targetCards.findIndex(
        (card) => card.id === active.id
      )
      const overCardIndex = targetCards.findIndex((card) => card.id === over.id)

      const nextCards = arrayMove<Card>(
        targetCards,
        activeCardIndex,
        overCardIndex
      ) //ソート後のCard[]

      return {
        ...prevContainers,
        [activeContainerKey]: nextCards,
      }
    })
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event
    if (!over) return

    const overId = over.id
    if (!overId || active.id === overId) return

    // コンテナ内ソートは扱わない（hadleDragEnd管轄)
    const activeContainerKey = findContainerKeyByCardId(String(active.id)) // ドラッグ中Cardが所属するContainerのkey
    const overContainerKey =
      findContainerKeyByCardId(String(over.id)) ??
      findContainerKeyByContainerId(String(over.id)) // ドロップ先Cardが所属するContainerのkey

    // console.log("dragover:", activeContainerKey, overContainerKey)

    if (
      !activeContainerKey ||
      !overContainerKey ||
      activeContainerKey === overContainerKey
    )
      return

    // 1フレームに1回だけ更新
    if (movedInFrameRef.current) return

    setCardContainers((prevContainers) => {
      console.log('aaa')
      const activeCards = prevContainers[activeContainerKey] //ドラッグ中カードが所属するコンテナのCard[]
      const activeCard = activeCards.find((card) => card.id === active.id)
      if (!activeCard) return prevContainers

      const overCards = prevContainers[overContainerKey] //overカードが所属するコンテナのCard[]
      // const overCard = overCards.find((card) => card.id === over.id)
      // if(!overCard) return prevContainers
      const overCardIndex = overCards.findIndex((card) => card.id === over.id)

      const isBelowOverItm =
        active.rect.current.translated &&
        active.rect.current.translated.top > over.rect.top + over.rect.height

      // const modifier = isBelowOverItm ? 1 : 0

      // const indexToInsert = overCardIndex >= 0 ? overCardIndex + modifier : overCards.length
      const insertIndexRaw =
        overCardIndex >= 0
          ? overCardIndex + (isBelowOverItm ? 1 : 0)
          : overCards.length
      const insertIndex = Math.max(
        0,
        Math.min(overCards.length, insertIndexRaw)
      )

      if (
        lastPlacementRef.current &&
        lastPlacementRef.current.id === active.id &&
        lastPlacementRef.current.to === overContainerKey &&
        lastPlacementRef.current.index === insertIndex
      ) {
        return prevContainers
      }

      // すでに同じ位置相当なら更新しない
      if (
        overCards[insertIndex]?.id === active.id ||
        (overCardIndex < 0 && overCards[overCards.length - 1]?.id === active.id)
      ) {
        return prevContainers
      }

      const nextActiveContainerCards = activeCards.filter(
        (card) => card.id !== active.id
      )

      const nextOverContainerCards = [
        ...overCards.slice(0, insertIndex),
        activeCard,
        ...overCards.slice(insertIndex),
      ]

      // 記録 & 1フレーム間引き
      lastPlacementRef.current = {
        id: active.id,
        to: overContainerKey,
        index: insertIndex,
      }
      movedInFrameRef.current = true
      requestAnimationFrame(() => (movedInFrameRef.current = false))

      return {
        ...prevContainers,
        [activeContainerKey]: nextActiveContainerCards,
        [overContainerKey]: nextOverContainerCards,
      }
    })
  }
}
