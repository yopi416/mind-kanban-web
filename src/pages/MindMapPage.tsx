// import DoneVisibilitySwitch from '@/features/mindmap/components/DoneVisibilitySwitch'
import { Sidebar } from '@/components/layout/Sidebar'
import MindMap from '../features/mindmap'
// import { TestSomething } from './TestSomething'

function MindMapPage() {
  return (
    <>
      {/* <DebugPanel /> */}
      {/* <TestSomething /> */}
      {/* <KanbanPage /> */}

      <div className="flex h-full w-full overflow-hidden">
        <Sidebar />
        <div className="min-w-0 flex-1 overflow-hidden">
          <MindMap />
          <div>test</div>
        </div>
        {/* <DoneVisibilitySwitch /> */}
      </div>
    </>
  )
}

export default MindMapPage
