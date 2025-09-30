// ▶ を押したときに、再帰チェックリストを遅延構築して表示
// Escで閉じる、aria-expanded、DnDへの干渉を防ぐ stopPropagation も考慮

import { useEffect, useMemo, useState } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { ChevronRight } from 'lucide-react'
import { useWholeStore } from '@/state/store'
import { useShallow } from 'zustand/shallow'
import { selectDescendants } from '../utils/nodeTreeUtils'
import type { WholeStoreState, DepthNode, Project } from '@/types'

// shadcn/ui Popover コンポーネント想定
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover'

type Props = {
  pjId: string
  rootNodeId: string
}

export function SubtasksPopover({ pjId, rootNodeId }: Props) {
  const selector = useMemo(
    () => (store: WholeStoreState) => {
      // 所属するプロジェクトのnodeのみを取得
      const targetPj: Project = store.projects[pjId]
      const targetNodes = targetPj.nodes
      const targetPjName = targetPj.name

      return {
        targetNodes,
        targetPjName,
        updateIsDoneFromKanban: store.updateIsDoneFromKanban,
        // setCommentPopupId: store.setCommentPopupId
      }
    },
    [pjId]
  )
  const { targetNodes, targetPjName, updateIsDoneFromKanban } = useWholeStore(
    useShallow(selector)
  )

  const [open, setOpen] = useState(false)
  const [tree, setTree] = useState<DepthNode[] | null>(null)
  // const computedRef = useRef(false)

  // 初回オープン時のみ構築（遅延計算）
  useEffect(() => {
    if (open) {
      setTree(selectDescendants(targetNodes, rootNodeId))
      // computedRef.current = true
    }
  }, [open, targetNodes, rootNodeId])

  // root 自身
  const root = useMemo(
    () => targetNodes.find((n) => n.id === rootNodeId),
    [targetNodes, rootNodeId]
  )

  if (!root) return null

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="ml-auto rounded p-1 opacity-0 transition-opacity group-hover:opacity-100"
          aria-label="子孫を表示"
          aria-expanded={open}
          // DnD発火を防止
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation()
            setOpen((v) => !v)
          }}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={6}
        className="w-96 p-2"
        // Radix Popover は Esc で閉じる挙動がデフォルト。明示で DnD 干渉も抑制
        onEscapeKeyDown={(e) => {
          e.stopPropagation()
          setOpen(false)
        }}
        /* ドラッグ開始を抑止 */
        // 外側クリック：dnd開始はブロックしつつ、自前で閉じる
        onPointerDownOutside={(e) => {
          e.preventDefault()
          setOpen(false)
        }}
        onPointerDown={(e) => {
          e.stopPropagation()
        }}
        onMouseDown={(e) => {
          e.stopPropagation()
        }}
        onTouchStart={(e) => {
          e.stopPropagation()
        }}
      >
        <div className="max-h-80 overflow-auto pr-1">
          {/* 見出し */}
          <div className="text-muted-foreground mb-2 text-xs">
            <span className="bg-muted rounded px-2 py-0.5">{targetPjName}</span>
            <span className="mx-1">›</span>
            <span className="font-medium" title={root.data.label}>
              {root.data.label}
            </span>
          </div>

          {/* ツリー本体 */}
          {tree?.length ? (
            <ul className="space-y-1">
              {tree.map(({ node, depth }) => (
                <li
                  key={node.id}
                  className="hover:bg-accent/50 group flex items-center gap-2 rounded px-1 py-0.5"
                >
                  <Checkbox
                    checked={!!node.data.isDone}
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                    onCheckedChange={(checked) =>
                      updateIsDoneFromKanban(pjId, node.id, !!checked)
                    }
                    aria-label="完了"
                  />
                  <span
                    className={[
                      'truncate text-sm',
                      node.data.isDone
                        ? 'text-muted-foreground line-through'
                        : '',
                    ].join(' ')}
                    style={{ paddingLeft: depth * 12 }}
                    title={node.data.label}
                  >
                    {node.data.label}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground text-xs">子孫ノードなし</p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
