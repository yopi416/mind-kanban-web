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
    <div className="flex h-screen flex-col overflow-hidden">
      <AppHeader userInfo={userInfo} />
      <main className="flex-1 overflow-hidden">
        {/* <main className="min-w-0 flex-1 overflow-hidden"> */}
        <Outlet />
      </main>
    </div>
  )
}
