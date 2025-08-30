import type { Node, Edge } from '@xyflow/react'
import type { NodeData, Project, Projects } from '../../../types'
import useMindMapStore from '../store'
import { cloneSnapshot, pushUndoItem } from './historyUtils'

const now = () => new Date().toISOString()

// currentPjの内容を取得
export function getCurrentPj(pjs: Projects, currentPjId: string): Project {
  const currentPj = pjs[currentPjId]

  // 存在しないcurrentPjIdが入力されることはないので、エラーを投げる
  if (!currentPj) {
    throw new Error(`Project not found: ${currentPjId}`)
  }

  return currentPj
}

// currentPjの変更をProjects全体に反映
// export function applyPjChanges(
//   getStore: () => MindMapStore,
//   setStore: typeof useMindMapStore.setState,
//   updater: (pj: Project) => Project, //current pj更新ロジックは呼び出し元で規定
//   isAddedToStack: boolean = false // UndoStackに追加されるかのフラグ
// ) {
//   const store = getStore()
//   const currentPj = getCurrentPj(store)
//   setStore({
//     projects: {
//       ...store.projects,
//       [store.currentPjId]: updater({ ...currentPj, updatedAt: now() }), //storeのcurrentPj部分をupdaterで取得した変更反映後pjに更新
//     },
//   })
// }

export function updateGraphInPj(
  pj: Project,
  newNodes: Node<NodeData>[],
  newEdges: Edge[]
): Project {
  return {
    ...pj,
    nodes: newNodes,
    edges: newEdges,
    updatedAt: new Date().toISOString(),
  }
}

export function updatePjInPjs(
  pjs: Projects,
  currenPjId: string,
  newPj: Project
): Projects {
  return { ...pjs, [currenPjId]: newPj }
}

export function applyPjChangesTrial(
  // getStore: () => MindMapStore,
  setStore: typeof useMindMapStore.setState,
  updater: (pj: Project) => Project, //current pj更新ロジックは呼び出し元で規定
  opts: applyPjChangesOpts = {}
) {
  const { shouldAddToStack = false } = opts

  setStore((prevStore) => {
    const { projects: currentPjs, currentPjId, history } = prevStore
    const currentPj = currentPjs[currentPjId]
    if (!currentPj) {
      throw new Error(`Project not found: ${prevStore.currentPjId}`)
    }

    // UndoStack追加オプションがtrueであれば、変更前状態を取得
    const undoItem = shouldAddToStack
      ? cloneSnapshot(currentPj.nodes, currentPj.edges)
      : undefined

    // 変更反映後の状態のProjectsを計算
    const newPj = updater({ ...currentPj, updatedAt: now() })
    const newPjs = { ...currentPjs, [currentPjId]: newPj }

    // スタックに追加しつつ、戻り値でカウンタを受け取る
    let nextUndoCount = prevStore.undoCount
    let nextRedoCount = prevStore.redoCount

    if (undoItem) {
      const { undoCount, redoCount } = pushUndoItem(history, undoItem)
      nextUndoCount = undoCount
      nextRedoCount = redoCount
    }

    return {
      // ...prevStore,
      projects: newPjs,
      history, // ← HistoryStack の中身は push/clear で更新済み（参照はそのまま）
      undoCount: nextUndoCount,
      redoCount: nextRedoCount,
    }
  })
}
