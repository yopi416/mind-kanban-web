// import MindMap from './features/mindmap'
// import Kanban from './features/kanban'
import { BrowserRouter, Routes, Route, Outlet, Navigate } from 'react-router'
import MindMapPage from './pages/MindMapPage'
import { KanbanPage } from './pages/KanbanPage'
import { LoginPage } from './pages/LoginPage'

import { TestSomething } from './pages/TestSomething'
// import { TestSomething2 } from "./pages/TestSomething2"

function AuthGate() {
  console.log('試験用のため常に認証成功')
  return <Outlet /> // ← 常に通す
}

function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route index element={<TestSomething />} /> {/* HomePageを追加予定 */}
          <Route path="login" element={<LoginPage />} />
          <Route element={<AuthGate />}>
            <Route path="app">
              <Route index element={<Navigate to="mindmap" replace />} />
              <Route path="mindmap" element={<MindMapPage />} />
              <Route path="kanban" element={<KanbanPage />} />
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
