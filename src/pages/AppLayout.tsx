import { Outlet } from 'react-router'
import AppHeader from '@/components/layout/AppHeader'

export function AppLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader user={{ name: 'ゲスト' }} />
      <main className="min-w-0 flex-1 overflow-hidden">
        <Outlet />
      </main>
    </div>
  )
}
