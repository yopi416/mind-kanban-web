import { Outlet } from 'react-router'
import AppHeader from '@/components/layout/AppHeader'
import { useLoginBootstrap } from '@/features/auth/loginBootstrap'

export function AppLayout() {
  // ログイン状態の変更 + 初期化
  useLoginBootstrap()

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader user={{ name: 'ゲスト' }} />
      <main className="min-w-0 flex-1 overflow-hidden">
        <Outlet />
      </main>
    </div>
  )
}
