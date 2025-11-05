// このコードは、app.tsxにて、/app配下アクセス時に挟み込まれる

import { USER_PROFILE_ENDPOINT } from '@/constants/api'
import { useWholeStore } from '@/state/store'
import type {
  KanbanColumns,
  KanbanIndex,
  Projects,
  WholeStoreState,
} from '@/types'
import { useEffect } from 'react'
import { useShallow } from 'zustand/shallow'
import { initialPjs } from '../mindmap/mockInitialElements'

const selector = (store: WholeStoreState) => {
  return {
    isLogin: store.isLogin,
    setIsLogin: store.setIsLogin,
    authStatus: store.authStatus,
    setAuthStatus: store.setAuthStatus,

    setUserInfo: store.setUserInfo,

    setProjects: store.setProjects,
    setCurrentPjId: store.setCurrentPjId,
    setKanbanIndex: store.setKanbanIndex,
    setKanbanColumns: store.setKanbanColumns,
  }
}

export function useLoginBootstrap() {
  const {
    // ログイン状態管理
    isLogin,
    setIsLogin,
    authStatus,
    setAuthStatus,

    // ログインユーザー情報管理
    setUserInfo,

    // マインドマップ、カンバンボード状態の管理
    setProjects,
    setCurrentPjId,
    setKanbanColumns,
    setKanbanIndex,
  } = useWholeStore(useShallow(selector))

  useEffect(() => {
    if (isLogin || authStatus !== 'unknown') return // ログイン済みの場合再フェッチしない

    const initStore = () => {
      console.log('dummy init')

      // マインドマップデータの初期化
      const initialProjects: Projects = initialPjs
      setProjects(initialProjects)

      // CurrentPjIdの初期化
      const initialCurrentPjId: string = 'pj1'
      setCurrentPjId(initialCurrentPjId)

      // カンバンIndexの初期化
      const initialKanbanIndex: KanbanIndex = new Map([
        // ['pj1', new Set(['2'])],
        // ['pj2', new Set(['2-2a', '2-2b', '2-3a', '2-3b'])],
        ['pj1', new Set([])],
        ['pj2', new Set([])],
      ])
      setKanbanIndex(initialKanbanIndex)

      // カンバンデータの初期化
      const initialKanbanColumns: KanbanColumns = {
        backlog: [
          // { pjId: 'pj1', nodeId: '2' },
          // { pjId: 'pj2', nodeId: '2-2a' },
        ],
        todo: [
          // { pjId: 'pj2', nodeId: '2-2b' }
        ],
        doing: [
          // { pjId: 'pj2', nodeId: '2-3a' }
        ],
        done: [
          // { pjId: 'pj2', nodeId: '2-3b' }
        ],
      }
      setKanbanColumns(initialKanbanColumns)

      console.log('init has been done!!')
    }

    ;(async () => {
      try {
        const res = await fetch(`${USER_PROFILE_ENDPOINT}`, {
          credentials: 'include',
        })
        // const res = await fetch(`${HEALTHZ_ENDPOINT}`, {
        //   credentials: 'include',
        // })
        console.log(res)
        if (!res.ok) throw new Error('unauthorized')

        const userInfo = await res.json()

        setUserInfo({
          displayName: userInfo.displayName ?? '',
          email: userInfo.email ?? '',
        })

        initStore()

        // const user = await res.json()
        // 本番はここで initFromServer(user) など
        setIsLogin(true)
        setAuthStatus('authenticated')
      } catch (err) {
        console.warn('未ログイン or エラー', err)
        setIsLogin(false)
        setAuthStatus('unauthenticated')
      }
    })()
  }, [isLogin, authStatus])
}

// export function AuthCheck() {
//   return <Outlet />
// }
