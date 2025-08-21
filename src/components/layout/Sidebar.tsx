import { useMemo, useState } from 'react'
import { useShallow } from 'zustand/shallow'

import { type MindMapStore } from '@/types'
import useMindMapStore from '../../features/mindmap/store'
import { FiFolder, FiPlus } from 'react-icons/fi'

import clsx from 'clsx'

import { Button } from '../ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
// import { Separator } from "@/components/ui/separator";

// import {
//   DropdownMenu,
//   DropdownMenuTrigger,
//   DropdownMenuContent,
//   DropdownMenuItem,
// } from "@/components/ui/dropdown-menu";

// import {
//   AlertDialog,
//   AlertDialogTrigger,
//   AlertDialogContent,
//   AlertDialogHeader,
//   AlertDialogTitle,
//   AlertDialogDescription,
//   AlertDialogFooter,
//   AlertDialogCancel,
//   AlertDialogAction,
// } from "@/components/ui/alert-dialog";

const selector = (store: MindMapStore) => {
  return {
    projects: store.projects,
    currentPjId: store.currentPjId,
    setCurrentPjId: store.setCurrentPjId,
    addPj: store.addPj,
  }
}

export function Sidebar() {
  const { projects, currentPjId, setCurrentPjId, addPj } = useMindMapStore(
    useShallow(selector)
  )

  const pjList = useMemo(
    () => Object.values(projects).sort((a, b) => a.name.localeCompare(b.name)),
    [projects]
  )

  const [editingPjId, setEditingPjId] = useState<string | null>(null)
  const [draft, setDraft] = useState<string>('')

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

      {/* List */}
      <ScrollArea className="flex-1">
        <ul className="py-2">
          {pjList.map((pj) => {
            const selected = pj.id === currentPjId
            const isEditing = pj.id === editingPjId

            return (
              <li
                key={pj.id}
                className={clsx(
                  'group mx-2 flex items-center rounded-md px-2',
                  selected ? 'bg-muted' : 'hover:bg-accent'
                )}
              >
                <button
                  className="flex-1 truncate py-2 text-left"
                  onClick={() => setCurrentPjId(pj.id)}
                  // onDoubleClick={() => startRename(pj.id, pj.name)}
                >
                  {isEditing ? (
                    <Input
                      autoFocus
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      // onBlur={submitRename}
                      onKeyDown={(e) => {
                        // if (e.key === "Enter") submitRename();
                        if (e.key === 'Escape') setEditingPjId(null) //要確認
                      }}
                      className="h-7"
                    />
                  ) : (
                    <span
                      className={clsx(
                        'text-sm',
                        selected && 'text-foreground font-medium'
                      )}
                      title={pj.name}
                    >
                      {pj.name}
                    </span>
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      </ScrollArea>
    </aside>
  )
}
