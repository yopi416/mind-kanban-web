import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'

// type NodeComment = { id: string; content: string; createdAt: string }
// type NodeData = {
//   label: string
//   parentId?: string | null
//   isDone: boolean
//   comments: NodeComment[]
// }

//検索用,削除とか特定のpjidだけ表示とかできるようににpjIdを持っておく
type Card = { pjId: string; nodeId: string }
type KanbanColumnName = 'backlog' | 'todo' | 'doing' | 'done'
// ex: backlog: [{id1, pj1}, [id2, pj2]], todo: [{id3, pj1}],,,,,
type KanbanColumns = Record<KanbanColumnName, Card[]>

// これはstore呼び出し側でuseState管理する
// type CardEntity = Card & NodeData

type KanbanState = {
  kanbanColumns: KanbanColumns
  addCard: (card: Card, col: KanbanColumnName) => void
  moveCard: (
    card: Card,
    from: KanbanColumnName,
    to: KanbanColumnName,
    toIndex: number
  ) => void
  removeCard: (card: Card) => void
}

export const useStore = create<KanbanState>()(
  subscribeWithSelector<KanbanState>((set) => ({
    // ---- Mindmap slice ----
    kanbanColumns: {
      backlog: [],
      todo: [],
      doing: [],
      done: [],
    },
    addCard: (cardToAdd: Card, col = 'backlog') => {
      set((prev) => {
        const kanbanColumns = prev.kanbanColumns
        for (const cards of Object.values(kanbanColumns)) {
          for (const card of cards) {
            // if (card.nodeId === cardToAdd.nodeId) return {}
            if (card.nodeId === cardToAdd.nodeId) {
              console.log('同じノード有り！！')
              return {}
            }
          }
        }

        const prevCol = kanbanColumns[col]
        const nextCol = [cardToAdd, ...prevCol]
        const nextCols = {
          ...kanbanColumns,
          [col]: nextCol,
        }

        return {
          kanbanColumns: nextCols,
        }
      })
    },
    moveCard: (
      cardToMove: Card,
      from: KanbanColumnName,
      to: KanbanColumnName,
      toIndex: number
    ) => {
      set((prev) => {
        const kanbanColumns = prev.kanbanColumns

        const prevFromCol = kanbanColumns[from]
        const prevToCol = kanbanColumns[to]

        const nextFromCol = prevFromCol.filter(
          (card) => card.nodeId !== cardToMove.nodeId
        )
        if (prevFromCol.length === nextFromCol.length) {
          console.log('移動するノードが存在しない')
          return {}
        }

        const nextToCal = [
          ...prevToCol.slice(0, toIndex),
          cardToMove,
          ...prevToCol.slice(toIndex),
        ]
        const nextCols: KanbanColumns = {
          ...kanbanColumns,
          [from]: nextFromCol,
          [to]: nextToCal,
        }

        return {
          kanbanColumns: nextCols,
        }
      })
    },
    removeCard: (cardToRemove: Card) => {
      set((prev) => {
        const kanbanColumns = prev.kanbanColumns
        const nextCols: KanbanColumns = {
          backlog: [],
          todo: [],
          doing: [],
          done: [],
        }

        for (const [key, cards] of Object.entries(kanbanColumns) as [
          KanbanColumnName,
          Card[],
        ][]) {
          const nextCol = cards.filter(
            (card) => card.nodeId !== cardToRemove.nodeId
          )
          nextCols[key] = nextCol
        }

        return {
          kanbanColumns: nextCols,
        }
      })
    },
  }))
)

// if (import.meta.env.DEV) {
//   // @ts-ignore
//   window.__store__ = useStore;
// }

// export type Card = {
//   id: string
//   title: string
// }

// export type CardContainer = Record<string, Card[]>
// ------↑はもともとのtype -------

// import { nanoid } from "nanoid"

// export type NodeComment = {
//   id: string
//   content: string
//   createdAt: string
// }
// export type NodeData = {
//   label: string
//   parentId?: string | null
//   isDone: boolean
//   comments: NodeComment[]
// }

// export type Card = {
//   pjId: string
//   nodeId: string
// }

// export type CardContent = {
//     cardId: string,
//     nodeData: NodeData
// }

// export type CardContainer = Record<string, Card[]>
// export type ContentOfCards = Record<string, CardContent[]>

// // store管理（初期値はDBからとってきたやつ。デモでは、初期にボード0として、一旦0でおK）
// export const initialCards_init: CardContainer = {
//   backlog: [

//   ],
//   todo: [

//   ],
//   doing: [

//   ],
//   done: [

//   ],
// }

// // カンバン側
// // カンバンボタン押す
// // ↓になるようなsetterをstoreに用意
// export const initialCards_after_kanbanbutton: CardContainer = {
//   backlog: [
//     { pjId: 'pj1', nodeId: "2a" }

//   ],
//   todo: [

//   ],
//   doing: [

//   ],
//   done: [

//   ],
// }

// // useStoreで↑を引っ張る
// // 更新が起こる ⇒ storeのprojectsをgetStateする
// // ⇒ pjIdキーを見る ⇒ nodesの中から nodeIdに対応するidのdataを抜き出す
// //

// export const ContentOfCards: ContentOfCards = {
//   backlog: [
//     {
//         cardId: nanoid(),
//         nodeData: { label: 'input', parentId: null, isDone: false, comments: [] }
//     }

//   ],
//   todo: [

//   ],
//   doing: [

//   ],
//   done: [

//   ],
// }

// これができた後、nodeDataをsortableに渡せばOK
// 後はsortableのレイアウトを工夫
// 基本はlabelを表示。commentをどう表示するか、子ノードのタスクをどう表示するか。
// -- 子ノードをkanbanに追加する時には、親ノードが入ってるかチェックしてはいってたら追加禁止
// -- 親ノードをkanbanに追加する時には、子ノードが入っている場合は、カンバンから削除
// とりあえずここまでで、ノードの表示までは行けそう

// export const initialCards: CardContainer = {
//   backlog: [
//     { id: 'row1-1', title: 'row1-1' },
//     { id: 'row1-2', title: 'row1-2' },
//   ],
//   todo: [
//     { id: 'row2-1', title: 'row2-1' },
//     { id: 'row2-2', title: 'row2-2' },
//   ],
//   doing: [
//     { id: 'row3-1', title: 'row3-1' },
//     { id: 'row3-2', title: 'row3-2' },
//   ],
//   done: [
//     { id: 'row4-1', title: 'row4-1' },
//     { id: 'row4-2', title: 'row4-2' },
//     { id: 'row4-3', title: 'row4-3' },
//     { id: 'row4-4', title: 'row4-4' },
//     { id: 'row4-5', title: 'row4-5' },
//     { id: 'row4-6', title: 'row4-6' },
//   ],
// }
