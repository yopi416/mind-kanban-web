import { useEffect } from 'react'
import { useLocation } from 'react-router'
import { useWholeStore } from '@/state/store'

// kanban, mindmapに移動した時に履歴を削除
// ※ お気に入りや戻るなどで飛んだ時ように念のためケア
export function ClearHistoryOnRoute() {
  const { pathname } = useLocation()
  const clearAllHistories = useWholeStore((s) => s.clearAllHistories)

  useEffect(() => {
    if (
      pathname.startsWith('/app/kanban') ||
      pathname.startsWith('/app/mindmap')
    ) {
      clearAllHistories()
    }
  }, [pathname, clearAllHistories])

  return null
}
