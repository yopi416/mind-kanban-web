// このコードは、app.tsxにて、/app配下アクセス時に挟み込まれる

import { MINKAN_ENDPOINT, USER_PROFILE_ENDPOINT } from '@/constants/api'
import { useWholeStore } from '@/state/store'
import type {
  KanbanColumns,
  KanbanIndex,
  KanbanIndexJSON,
  MinkanData,
  MinkanResponse,
  Projects,
  WholeStoreState,
} from '@/types'
import { useEffect } from 'react'
import { useShallow } from 'zustand/shallow'
// import { initialPjs } from '../mindmap/mockInitialElements'

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

    setLockVersion: store.setLockVersion,
  }
}

// JSONのKanbanIndexを実際の型に変換
// Record<string, string[]> ⇒ Map<string, Set<string>>に変換
// JSONでは、setを表現できないため
function parseKanbanIndex(json: KanbanIndexJSON): KanbanIndex {
  const map: KanbanIndex = new Map()

  for (const pjId of Object.keys(json)) {
    const nodeIds = json[pjId]
    map.set(pjId, new Set(nodeIds))
  }

  return map
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

    // 楽観ロック用
    setLockVersion,
  } = useWholeStore(useShallow(selector))

  useEffect(() => {
    if (isLogin || authStatus !== 'unknown') return // ログイン済みの場合再フェッチしない

    const initStore = (
      initialProjects: Projects,
      initialCurrentPjId: string,
      initialKanbanIndex: KanbanIndex,
      initialKanbanColumns: KanbanColumns
    ) => {
      console.log('init store from backend')

      setProjects(initialProjects)
      setCurrentPjId(initialCurrentPjId)
      setKanbanIndex(initialKanbanIndex)
      setKanbanColumns(initialKanbanColumns)

      console.log('init finished')
    }

    // const initStore = () => {
    //   console.log('dummy init')

    //   // マインドマップデータの初期化
    //   const initialProjects: Projects = initialPjs
    //   setProjects(initialProjects)

    //   // CurrentPjIdの初期化
    //   const initialCurrentPjId: string = 'pj1'
    //   setCurrentPjId(initialCurrentPjId)

    //   // カンバンIndexの初期化
    //   const initialKanbanIndex: KanbanIndex = new Map([
    //     // ['pj1', new Set(['2'])],
    //     // ['pj2', new Set(['2-2a', '2-2b', '2-3a', '2-3b'])],
    //     ['pj1', new Set([])],
    //     ['pj2', new Set([])],
    //   ])
    //   setKanbanIndex(initialKanbanIndex)

    //   // カンバンデータの初期化
    //   const initialKanbanColumns: KanbanColumns = {
    //     backlog: [
    //       // { pjId: 'pj1', nodeId: '2' },
    //       // { pjId: 'pj2', nodeId: '2-2a' },
    //     ],
    //     todo: [
    //       // { pjId: 'pj2', nodeId: '2-2b' }
    //     ],
    //     doing: [
    //       // { pjId: 'pj2', nodeId: '2-3a' }
    //     ],
    //     done: [
    //       // { pjId: 'pj2', nodeId: '2-3b' }
    //     ],
    //   }
    //   setKanbanColumns(initialKanbanColumns)

    //   console.log('init has been done!!')
    // }

    ;(async () => {
      try {
        // users/meエンドポイントから、ユーザー情報を取得
        const resProfile = await fetch(`${USER_PROFILE_ENDPOINT}`, {
          credentials: 'include',
        })

        console.log(resProfile)
        if (!resProfile.ok) throw new Error('unauthorized')

        const userInfo = await resProfile.json()

        setUserInfo({
          displayName: userInfo.displayName ?? '',
          email: userInfo.email ?? '',
        })

        // /minkanエンドポイントから、ユーザー情報を取得
        const resMinkan = await fetch(`${MINKAN_ENDPOINT}`, {
          credentials: 'include',
        })

        const { minkan, version }: MinkanResponse = await resMinkan.json()

        const minkanData: MinkanData = minkan
        const lockVersion: number = version

        const initialProjects: Projects = minkanData.projects
        const initialCurrentPjId: string = minkanData.currentPjId
        // KanbanIndexだけsetを使用するので変換が入る
        const initialKanbanIndex: KanbanIndex = parseKanbanIndex(
          minkanData.kanbanIndex
        )
        const initialKanbanColumns: KanbanColumns = minkanData.kanbanColumns

        // console.log('initialProjects:', initialProjects)
        // console.log('initialCurrentPjId:', initialCurrentPjId)
        // console.log('initialKanbanIndex:', initialKanbanIndex)
        // console.log('initialKanbanColumns:', initialKanbanColumns)

        // storeのバックエンドから取得するデータを初期化
        initStore(
          initialProjects,
          initialCurrentPjId,
          initialKanbanIndex,
          initialKanbanColumns
        )

        // 楽観ロック用versionをset
        setLockVersion(lockVersion)

        // 認証情報の更新
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
