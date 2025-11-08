// import MindMap from './features/mindmap'
// import Kanban from './features/kanban'
import { BrowserRouter, Routes, Route, Outlet, Navigate } from 'react-router'
import MindMapPage from './pages/MindMapPage'
import { KanbanPage } from './pages/KanbanPage'
// import { DebugKanban } from './pages/DebugKanbanPage'
import { LoginPage } from './pages/LoginPage'
import { AppLayout } from './pages/AppLayout'

// import { TestSomething } from './pages/TestSomething'
// import { TestSomething2 } from "./pages/TestSomething2"

import type { WholeStoreState } from '@/types'
import { useWholeStore } from '@/state/store'
import { useShallow } from 'zustand/shallow'
import { ClearHistoryOnRoute } from './components/ClearHistoryOnRoute'
import { Toaster } from './components/ui/sonner'

const selector = (store: WholeStoreState) => {
  return {
    // isLogin: store.isLogin,
    authStatus: store.authStatus,
  }
}

function AuthGate() {
  const { authStatus } = useWholeStore(useShallow(selector))

  // 初回はAuthGateをすり抜けて、AppLayout内でのログインチェックを受けたいため以下のように設定
  // - 初回ログイン後のログインチェック前 = unknown
  // - 初回ログイン後のログインチェック後 = authed/ unauthed
  if (authStatus === 'unauthenticated') {
    console.log('Login していないのでリダイレクト')
    return <Navigate to="login" replace />
  }

  console.log('試験用なので常に認証成功')
  return <Outlet /> // ← 一旦は常に通す
}

function App() {
  return (
    <>
      <BrowserRouter>
        <ClearHistoryOnRoute />
        <Routes>
          <Route index element={<Navigate to="login" replace />} />{' '}
          {/* HomePageを追加予定 */}
          <Route path="login" element={<LoginPage />} />
          <Route element={<AuthGate />}>
            <Route path="app" element={<AppLayout />}>
              <Route index element={<Navigate to="mindmap" replace />} />
              <Route path="mindmap" element={<MindMapPage />} />
              <Route path="kanban" element={<KanbanPage />} />
              {/* <Route path="kanban" element={<DebugKanban />} /> */}
            </Route>
          </Route>
          <Route path="*" element={<div>Not Found</div>} />{' '}
          {/* 404ちゃんと作る */}
        </Routes>
      </BrowserRouter>

      {/*ここに Toaster を置けばアプリ全体で toast が使える */}
      <Toaster richColors closeButton />
    </>
  )
}

export default App
