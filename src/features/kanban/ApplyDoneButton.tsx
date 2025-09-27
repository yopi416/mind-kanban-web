import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { useState } from 'react'
import { useWholeStore } from '@/state/store'
import type { KanbanCardRef, WholeStoreState } from '@/types'
import { useShallow } from 'zustand/shallow'

export function ApplyDoneButton() {
  const [open, setOpen] = useState(false)
  const [includeSubtasks, setIncludeSubtasks] = useState(false)

  const selector = (store: WholeStoreState) => {
    return {
      removeDoneCards: store.removeDoneCards,
      applyKanbanDoneToMindmap: store.applyKanbanDoneToMindmap,
    }
  }

  const { removeDoneCards, applyKanbanDoneToMindmap } = useWholeStore(
    useShallow(selector)
  )

  return (
    <>
      <Button
        className="w-full bg-red-400 text-white hover:bg-red-500"
        onClick={() => setOpen(true)}
      >
        完了状態をマインドマップに反映
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>完了状態の反映</DialogTitle>
            <DialogDescription>
              DONEタスクをカンバンボードから削除し、マインドマップに完了状態を反映します。
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="subtasks"
              checked={includeSubtasks}
              onCheckedChange={(v) => setIncludeSubtasks(!!v)}
            />
            <label htmlFor="subtasks" className="text-sm">
              配下のタスクもすべて完了状態にする
            </label>
          </div>

          <DialogFooter>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              キャンセル
            </Button>
            <Button
              className="bg-red-500 text-white hover:bg-red-600"
              onClick={() => {
                // doneカラムのcardRef配列を取得
                const cardsInDoneCol: KanbanCardRef[] =
                  useWholeStore.getState().kanbanColumns.done
                // マインドマップに完了状態を反映
                applyKanbanDoneToMindmap(cardsInDoneCol, includeSubtasks)
                // カンバンボード(index含む)からdoneカラムのカードを削除
                removeDoneCards()

                setOpen(false)
              }}
            >
              反映
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
