import { DndContext, useDroppable, DragOverlay } from '@dnd-kit/core'
import type {
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  UniqueIdentifier,
} from '@dnd-kit/core'
import { SortableContext, useSortable, arrayMove } from '@dnd-kit/sortable'
import { useMemo, useState, useRef, forwardRef } from 'react'
import type { ComponentPropsWithoutRef } from 'react'
// import { nanoid } from 'nanoid'
import { CSS } from '@dnd-kit/utilities'
// import { initialCards, type Card, type CardContainer } from './initialCards'

import { Button } from '@/components/ui/button'
import { Link } from 'react-router'

type Card = {
  id: string
  title: string
}

type CardContainer = Record<string, Card[]>

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

// React19より、fowardRef不要になったようだが、念のためfowardRefを使用
type ItemProps = ComponentPropsWithoutRef<'div'>

const Item = forwardRef<HTMLDivElement, ItemProps>(
  ({ children, ...props }, ref) => {
    return (
      <div ref={ref} {...props}>
        {children}
      </div>
    )
  }
)
Item.displayName = 'Item'

type SortableProps = Card & { activeCardId: UniqueIdentifier | null }

function Sortable(props: SortableProps) {
  const { id: myOwnCardId, title, activeCardId } = props

  if (myOwnCardId === 'row4-1') {
    console.log('render:', myOwnCardId)
  }

  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: myOwnCardId })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const isActive = activeCardId === myOwnCardId //dragされている時true

  let cls =
    'rounded-lg border bg-white p-3 shadow-sm transition-all duration-150'

  if (isActive) {
    // dragされている時薄くなる + 縮む
    cls += ' opacity-40 scale-95 rotate-[0.2deg] border-slate-400'
  } else {
    cls += ' border-slate-200'
  }

  return (
    <Item
      ref={setNodeRef}
      style={style}
      className={cls}
      {...attributes}
      {...listeners}
    >
      {title}
    </Item>
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

export function DebugKanban() {
  // key: 'backlog', 'todo', 'doing', 'done' それぞれに、Card[] が所属
  const [cardContainers, setCardContainers] =
    useState<CardContainer>(initialCards)

  // カードがドラッグ中(active)であれば、見た目を変えたり、DragOverLay(移動中のUI)対象とする
  // この判定のために、ドラッグ中のカードIDをstate管理する
  const [activeCardId, setActiveCardId] = useState<UniqueIdentifier | null>(
    null
  )

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

  // ??
  const containerKeyTocardIds = useMemo(() => {
    const obj: Record<string, string[]> = {}

    for (const [containerKey, cards] of Object.entries(cardContainers)) {
      obj[containerKey] = cards.map((card) => card.id)
    }

    return obj
  }, [cardContainers])

  // カードを移動する時に、同コンテナ内(onDragEnd)か、コンテナ間(onDragOver)かで処理が変わる
  // その際に、カードがどのContainerに所属するかを把握するための関数
  function findContainerKeyByCardId(cardId: string): string | undefined {
    return cardIdToContainerKey.get(cardId)
  }

  function findContainerKeyByContainerId(
    containerId: string
  ): string | undefined {
    return cardContainers[containerId] ? containerId : undefined
  }

  // Drag中カード情報の取得
  const activeCard = useMemo(() => {
    if (!activeCardId) return null

    const key = findContainerKeyByCardId(String(activeCardId))

    if (!key) return null

    return cardContainers[key]?.find((c) => c.id === activeCardId) ?? null
  }, [activeCardId, cardContainers])

  // 直前の配置と、1フレーム中に更新したかを記録（過度なsetState防止）
  const lastPlacementRef = useRef<{
    id: UniqueIdentifier
    to: string
    index: number
  } | null>(null)
  const movedInFrameRef = useRef(false)

  return (
    <>
      <Button>
        <Link to="/app/mindmap">マインドマップへ移動!!</Link>
      </Button>
      <DndContext
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
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
                      <Sortable
                        key={card.id}
                        {...card}
                        activeCardId={activeCardId}
                      />
                    ))}
                  </Droppable>
                </SortableContext>
              </div>
            )
          })}
        </div>

        <DragOverlay /* dropAnimation など必要ならここで指定可 */>
          {activeCard ? (
            // useSortable を呼ばない「見た目専用」の Item を使う
            <Item className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
              {activeCard.title}
            </Item>
          ) : null}
        </DragOverlay>
      </DndContext>
    </>
  )

  function handleDragStart(event: DragStartEvent) {
    const { active } = event
    setActiveCardId(active.id)
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
      const activeCards = prevContainers[activeContainerKey] //ドラッグ中カードが所属するコンテナのCard[]
      const activeCard = activeCards.find((card) => card.id === active.id)
      if (!activeCard) return prevContainers

      const overCards = prevContainers[overContainerKey] //overカードが所属するコンテナのCard[]

      // Drop先がContainer本体の場合(Containerが空)  -1になる
      const overCardIndex = overCards.findIndex((card) => card.id === over.id)

      const isBelowOverItm =
        active.rect.current.translated &&
        active.rect.current.translated.top > over.rect.top + over.rect.height

      // Drop先がContainer本体の場合, :後の判定の値になる
      // ⇒ 先頭(カード無し時の対応) OR 末尾（カード有時）
      const insertIndexRaw =
        overCardIndex >= 0
          ? overCardIndex + (isBelowOverItm ? 1 : 0)
          : overCards.length

      // 範囲外アクセスを防止
      const insertIndex = Math.max(
        0, // 下限は0
        Math.min(overCards.length, insertIndexRaw) // 上限は配列長
      )

      // 前回のソートと同じ状況ならば,更新しない
      // コンテナ間移動時に、1度だけこれにより無駄なレンダリング防止できるぐらい
      // よって、正直効果は薄いのだが、レンダリング回数削減のために残す
      if (
        lastPlacementRef.current &&
        lastPlacementRef.current.id === active.id &&
        lastPlacementRef.current.to === overContainerKey &&
        lastPlacementRef.current.index === insertIndex
      ) {
        return prevContainers
      }

      // ↑と同じくなくてもよいが、念のため残す
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

      // 更新前に今回の更新情報を保持
      // 本情報を基に次回のhandleDragOverにて、同じ処理を使用としているかを判断
      // 同じ処理の場合 return
      lastPlacementRef.current = {
        id: active.id,
        to: overContainerKey,
        index: insertIndex,
      }

      // setStateが行われるのを1フレームに1回とする
      movedInFrameRef.current = true // 次フレームまでは、handleDragOverを即returnする
      requestAnimationFrame(() => (movedInFrameRef.current = false))

      return {
        ...prevContainers,
        [activeContainerKey]: nextActiveContainerCards,
        [overContainerKey]: nextOverContainerCards,
      }
    })
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    lastPlacementRef.current = null
    if (!over) {
      setActiveCardId(null)
      return
    }

    const overId = over.id
    if (!overId || active.id === overId) {
      setActiveCardId(null)
      return
    }

    // コンテナ間でのカードのソートは扱わない（hadleDragOver管轄)
    const activeContainerKey = findContainerKeyByCardId(String(active.id)) // ドラッグ中Cardが所属するContainerのkey
    const overContainerKey = findContainerKeyByCardId(String(over.id)) // ドロップ先Cardが所属するContainerのkey
    // console.log("dragend: ", activeContainerKey, overContainerKey)

    if (
      !activeContainerKey ||
      !overContainerKey ||
      activeContainerKey !== overContainerKey
    ) {
      setActiveCardId(null)
      return
    }

    setCardContainers((prevContainers) => {
      const targetCards = prevContainers[activeContainerKey] // 入れ替えが起こるコンテナのCard[]
      const activeCard = targetCards.find((card) => card.id === active.id)
      if (!activeCard) {
        setActiveCardId(null)
        return prevContainers
      }
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

    setActiveCardId(null)
  }

  function handleDragCancel() {
    setActiveCardId(null)
  }
}
