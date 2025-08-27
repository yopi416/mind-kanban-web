// import DoneVisibilitySwitch from '@/features/mindmap/components/DoneVisibilitySwitch'
import { Sidebar } from '@/components/layout/Sidebar'
import MindMap from '../features/mindmap'
// import { TestSomething } from './TestSomething'

function MindMapPage() {
  return (
    <>
      {/* <TestSomething /> */}
      <div className="flex h-screen">
        <Sidebar />
        <div className="min-w-0 flex-1 overflow-hidden">
          <MindMap />
        </div>
        {/* <DoneVisibilitySwitch /> */}
      </div>
    </>
  )
}

export default MindMapPage
