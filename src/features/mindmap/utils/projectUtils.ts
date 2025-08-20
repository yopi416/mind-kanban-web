import { type MindMapStore, type Project } from '../../../types'
import useMindMapStore from '../store'

const now = () => new Date().toISOString()

// currentPjの内容を取得
export function getCurrentPj(getStore: () => MindMapStore) {
  const store = getStore()
  const currentPj = store.projects[store.currentPjId]

  if (!currentPj) {
    throw new Error(`Project not found: ${store.currentPjId}`)
  }

  return currentPj
}

// currentPjの変更をProjects全体に反映
export function applyPjChanges(
  getStore: () => MindMapStore,
  setStore: typeof useMindMapStore.setState,
  updater: (pj: Project) => Project //pjを投げると、あるプロパティを更新したcurrentPjを返す関数
) {
  const store = getStore()
  const currentPj = getCurrentPj(getStore)
  setStore({
    projects: {
      ...store.projects,
      [store.currentPjId]: updater({ ...currentPj, updatedAt: now() }), //storeのcurrentPj部分をupdaterで取得した変更反映後pjに更新
    },
  })
}
