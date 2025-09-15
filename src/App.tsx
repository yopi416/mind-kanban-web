// import MindMap from './features/mindmap'
// import Kanban from './features/kanban'
import { BrowserRouter, Routes, Route, Outlet, Navigate } from 'react-router'
import MindMapPage from './pages/MindMapPage'
import { KanbanPage } from './pages/KanbanPage'
// import { DebugKanban } from './pages/DebugKanbanPage'
import { LoginPage } from './pages/LoginPage'

// import { TestSomething } from './pages/TestSomething'
// import { TestSomething2 } from "./pages/TestSomething2"

import type { WholeStoreState } from '@/types'
import { useWholeStore } from '@/state/store'
import { useShallow } from 'zustand/shallow'

const selector = (store: WholeStoreState) => {
  return {
    isLogin: store.isLogin,
  }
}

function AuthGate() {
  const { isLogin } = useWholeStore(useShallow(selector))
  if (!isLogin) {
    console.log('Login していないのでリダイレクト')
    return <Navigate to="login" replace />
  }

  console.log('試験用のため常に認証成功')
  return <Outlet /> // ← 常に通す
}

function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route index element={<Navigate to="login" replace />} />{' '}
          {/* HomePageを追加予定 */}
          <Route path="login" element={<LoginPage />} />
          <Route element={<AuthGate />}>
            <Route path="app">
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
    </>
  )
}

export default App
