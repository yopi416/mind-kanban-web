import { Button } from './components/ui/button'
import MindMap from './features/mindmap'
import Kanban from './features/kanban'

function App() {
  return (
    <>
      <p className="bg-amber-50 text-3xl">test</p>
      <Button
        size="sm"
        onClick={() => {
          console.log('test')
        }}
      >
        TEST
      </Button>

      <MindMap />
      <Kanban />
    </>
  )
}

export default App
