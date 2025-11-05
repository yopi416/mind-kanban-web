import { Outlet } from 'react-router'
import AppHeader from '@/components/layout/AppHeader'
import { useLoginBootstrap } from '@/features/auth/loginBootstrap'
import type { WholeStoreState } from '@/types'
import { useWholeStore } from '@/state/store'
import { useShallow } from 'zustand/shallow'

const selector = (store: WholeStoreState) => {
  return { userInfo: store.userInfo }
}

export function AppLayout() {
  // ログイン状態の変更 + 初期化
  useLoginBootstrap()

  const { userInfo } = useWholeStore(useShallow(selector))

  return (
    <div className="flex min-h-screen flex-col">
      {/* <AppHeader user={{ name: 'ゲスト' }} /> */}
      <AppHeader userInfo={userInfo} />
      <main className="min-w-0 flex-1 overflow-hidden">
        <Outlet />
      </main>
    </div>
  )
}
