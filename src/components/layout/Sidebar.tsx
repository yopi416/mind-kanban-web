import { useMemo, useState } from 'react'
import { useShallow } from 'zustand/shallow'

import { type MindMapStore } from '@/types'
import useMindMapStore from '../../features/mindmap/store'
import {
  FiFolder,
  FiMoreHorizontal,
  FiPlus,
  FiEdit2,
  FiTrash2,
} from 'react-icons/fi'

import clsx from 'clsx'

import { Button } from '../ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog'

const selector = (store: MindMapStore) => {
  return {
    projects: store.projects,
    currentPjId: store.currentPjId,
    setCurrentPjId: store.setCurrentPjId,
    addPj: store.addPj,
    renamePj: store.renamePj,
    deletePj: store.deletePj,
  }
}

export function Sidebar() {
  const { projects, currentPjId, setCurrentPjId, addPj, deletePj, renamePj } =
    useMindMapStore(useShallow(selector))

  const pjList = useMemo(
    () => Object.values(projects).sort((a, b) => a.name.localeCompare(b.name)),
    [projects]
  )

  const [pjIdBeingEdited, setPjIdBeingEdited] = useState<string | null>(null)
  const [draft, setDraft] = useState<string>('') //編集中のPJ名を格納

  const startRenamePj = (pjId: string, currentPjName: string) => {
    setPjIdBeingEdited(pjId)
    setDraft(currentPjName)
  }

  const submitRename = () => {
    if (!pjIdBeingEdited) return

    renamePj(pjIdBeingEdited, draft)
    cancelRename()
  }

  const cancelRename = () => {
    setPjIdBeingEdited(null)
    setDraft('')
  }

  /* --- PJ削除時のクラッシュを防止--- */
  const [openMenuFor, setOpenMenuFor] = useState<string | null>(null)
  const [confirmingId, setConfirmingId] = useState<string | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)

  // メニューから「削除…」を押した時
  const onAskDelete = (id: string) => {
    setOpenMenuFor(null) // 先に必ずメニューを閉じる
    setConfirmingId(id)
    setConfirmOpen(true)
  }

  // 実際に削除する時
  const onConfirmDelete = () => {
    if (confirmingId) deletePj(confirmingId)
    setConfirmOpen(false)
    setConfirmingId(null)
  }

  // ダイアログが閉じられた時（×/キャンセル含む）
  const onDialogOpenChange = (open: boolean) => {
    setConfirmOpen(open)
    if (!open) {
      setOpenMenuFor(null) // キャンセル時もメニュー残留を確実に消す
      setConfirmingId(null)
    }
  }

  return (
    <aside className="bg-card border-border relative flex h-full w-64 flex-col border-r pt-4 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <FiFolder className="h-4 w-4" />
          Projects
          <span className="text-muted-foreground text-xs">
            ({pjList.length})
          </span>
        </div>
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7"
          title="New project"
          onClick={() => addPj()}
        >
          <FiPlus className="h-4 w-4" />
        </Button>
      </div>
      <Separator />

      {/* List */}
      <ScrollArea className="flex-1">
        <ul className="py-2">
          {pjList.map((pj) => {
            const selected = pj.id === currentPjId
            const isEditing = pj.id === pjIdBeingEdited

            return (
              <li
                key={pj.id}
                className={clsx(
                  'group mx-2 flex items-center rounded-md px-2',
                  selected ? 'bg-muted' : 'hover:bg-accent'
                )}
              >
                {isEditing ? (
                  <Input
                    autoFocus
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onBlur={submitRename}
                    onKeyDown={(e) => {
                      e.stopPropagation() // windowのショートカットを遮断
                      if (e.nativeEvent?.isComposing) return
                      if (e.key === 'Enter') submitRename()
                      if (e.key === 'Escape') cancelRename()
                    }}
                    className="h-7"
                  />
                ) : (
                  <button
                    className="flex-1 truncate py-2 text-left"
                    onClick={() => setCurrentPjId(pj.id)}
                    onDoubleClick={() => startRenamePj(pj.id, pj.name)}
                  >
                    <span
                      className={clsx(
                        'text-sm',
                        selected && 'text-foreground font-medium'
                      )}
                      title={pj.name}
                    >
                      {pj.name}
                    </span>
                  </button>
                )}

                {/* 行のaction */}
                <DropdownMenu
                  open={openMenuFor === pj.id}
                  onOpenChange={(o) => setOpenMenuFor(o ? pj.id : null)}
                >
                  <DropdownMenuTrigger asChild>
                    <Button
                      onClick={() => setOpenMenuFor(pj.id)}
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 opacity-0 group-hover:opacity-100"
                      aria-label="Project actions"
                    >
                      <FiMoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem
                      onSelect={() => startRenamePj(pj.id, pj.name)}
                    >
                      <FiEdit2 className="mr-2 h-3.5 w-3.5" />
                      名前の編集
                    </DropdownMenuItem>

                    {/* ここではダイアログを直接開かない。問い合わせ関数だけ呼ぶ */}
                    <DropdownMenuItem
                      onSelect={(e) => {
                        e.preventDefault() // フォーカス移動を抑制
                        onAskDelete(pj.id)
                      }}
                      className="text-destructive focus:text-destructive"
                    >
                      <FiTrash2 className="mr-2 h-3.5 w-3.5" />
                      削除…
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </li>
            )
          })}

          {pjList.length === 0 && (
            <li className="text-muted-foreground px-4 py-8 text-center text-sm">
              プロジェクトがありません。
            </li>
          )}
        </ul>
      </ScrollArea>

      {/* 🔻 リストの外に置く単一の AlertDialog（confirmingId で対象を切替） */}
      <AlertDialog open={confirmOpen} onOpenChange={onDialogOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {(() => {
                const pj = confirmingId ? projects[confirmingId] : undefined
                return pj ? `“${pj.name}”を削除しますか？` : '削除しますか？'
              })()}
            </AlertDialogTitle>
            <AlertDialogDescription>
              ※プロジェクトが1つのみの場合は削除不可
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              onClick={onConfirmDelete}
              className="text-destructive-foreground hover:bg-destructive/90 bg-red-400"
            >
              削除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </aside>
  )
}
