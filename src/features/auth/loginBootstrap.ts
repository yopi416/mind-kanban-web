// このコードは、app.tsxにて、/app配下アクセス時に挟み込まれる

import { MINKAN_ENDPOINT, USER_PROFILE_ENDPOINT } from '@/constants/api'
import { useWholeStore } from '@/state/store'
import type {
  KanbanColumns,
  KanbanIndex,
  MinkanData,
  MinkanGetResponse,
  Projects,
  WholeStoreState,
} from '@/types'
import { useEffect } from 'react'
import { useShallow } from 'zustand/shallow'
import {
  deserializeKanbanIndex,
  validateMinkanData,
} from '../shared/minkanUtils'
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

      setProjects(structuredClone(initialProjects))
      setCurrentPjId(initialCurrentPjId)

      const clonedKanbanIndex = new Map(
        [...initialKanbanIndex.entries()].map(([k, v]) => [k, new Set(v)])
      )
      setKanbanIndex(clonedKanbanIndex)
      setKanbanColumns(structuredClone(initialKanbanColumns))

      console.log('init finished')
    }

    ;(async () => {
      try {
        // users/meエンドポイントから、ユーザー情報を取得
        const resProfile = await fetch(`${USER_PROFILE_ENDPOINT}`, {
          credentials: 'include',
        })

        if (resProfile.status !== 200) {
          const errorBody = await resProfile.text()
          throw new Error(
            `failed to get user_profile: ${resProfile.status}, ${errorBody}`
          )
        }

        const userInfo = await resProfile.json()

        setUserInfo({
          displayName: userInfo.displayName ?? '',
          email: userInfo.email ?? '',
        })

        // /minkanエンドポイントから、ユーザー情報をfetch
        const resMinkan = await fetch(`${MINKAN_ENDPOINT}`, {
          credentials: 'include',
        })

        if (resMinkan.status !== 200) {
          const errorBody = await resMinkan.text()
          throw new Error(
            `failed to get mindmap_data: ${resMinkan.status}, ${errorBody}`
          )
        }

        const { minkan, version: lockVersion }: MinkanGetResponse =
          await resMinkan.json()

        if (!validateMinkanData(minkan)) {
          throw new Error('Invalid minkan format from backend')
        }

        // バックエンドから取得したデータをstoreに格納(初期化)
        const minkanData: MinkanData = minkan
        initStore(
          minkanData.projects,
          minkanData.currentPjId,
          deserializeKanbanIndex(minkanData.kanbanIndex),
          minkanData.kanbanColumns
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
  }, [
    isLogin,
    authStatus,
    setUserInfo,
    setIsLogin,
    setAuthStatus,
    setProjects,
    setCurrentPjId,
    setKanbanColumns,
    setKanbanIndex,
    setLockVersion,
  ])
}

// export function AuthCheck() {
//   return <Outlet />
// }
