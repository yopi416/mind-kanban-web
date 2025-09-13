import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

// import useMindMapStore from '../store'
import { useShallow } from 'zustand/shallow'
import { type WholeStoreState } from '../../../types.ts'
import { useWholeStore } from '@/state/store.ts'

const selector = (store: WholeStoreState) => ({
  showDoneNodes: store.showDoneNodes,
  setShowDoneNodes: store.setShowDoneNodes,
})

export default function DoneVisibilitySwitch() {
  const { showDoneNodes, setShowDoneNodes } = useWholeStore(
    useShallow(selector)
  )

  return (
    <div className="fixed right-10 top-7 z-50 rounded-xl bg-blue-200 px-3 py-2 text-white shadow">
      <div className="flex items-center gap-2">
        <Switch
          id="toggle-done"
          checked={showDoneNodes}
          onCheckedChange={setShowDoneNodes}
          className="data-[state=checked]:bg-blue-500 data-[state=unchecked]:bg-gray-500"
        />
        <Label htmlFor="toggle-done" className="text-sm text-black">
          終了タスクを表示
        </Label>
      </div>
    </div>
  )
}
