import { useMemo } from 'react'
import clsx from 'clsx'
import { Checkbox } from '@/components/ui/checkbox'
import { useWholeStore } from '@/state/store'
import { useShallow } from 'zustand/shallow'
import type { KanbanCardRef, WholeStoreState, Project } from '@/types'
import { SubtasksPopover } from './SubtasksPopover'

type Props = { card: KanbanCardRef }

export const CardSubtasks = ({ card }: Props) => {
  const selector = useMemo(
    () => (store: WholeStoreState) => {
      // 所属するプロジェクトのnodeのみを取得
      const targetPj: Project = store.projects[card.pjId]
      const targetNodes = targetPj.nodes
      const targetPjName = targetPj.name

      return {
        targetNodes,
        targetPjName,
        updateIsDoneFromKanban: store.updateIsDoneFromKanban,
        // setCommentPopupId: store.setCommentPopupId
      }
    },
    [card.pjId]
  )

  const { targetNodes, targetPjName, updateIsDoneFromKanban } = useWholeStore(
    useShallow(selector)
  )

  // 本nodeIdに対応するNodeを取得
  const currentNode = useMemo(
    () => targetNodes.find((n) => n.id === card.nodeId),
    [targetNodes, card.nodeId]
  )

  // 親ノードを取得
  const parentNode = useMemo(() => {
    const pid = currentNode?.data.parentId
    return pid ? targetNodes.find((n) => n.id === pid) : undefined
  }, [targetNodes, currentNode])

  // 親の親ノードを取得
  const grandParentNode = useMemo(() => {
    const gpid = parentNode?.data.parentId
    return gpid ? targetNodes.find((n) => n.id === gpid) : undefined
  }, [targetNodes, parentNode])

  // 子ノードの取得 (孫以降は取得しない)
  const childrenNode = useMemo(
    () => targetNodes.filter((n) => n.data.parentId === card.nodeId),
    [targetNodes, card.nodeId]
  )

  if (!currentNode) return null
  if (!parentNode) return null // rootNodeのみ親をもたないが、kanban追加不可なので問題なし

  return (
    <div className="space-y-1">
      {/* パンくず */}
      <div className="text-muted-foreground/80 flex items-center gap-1 text-[10px] leading-tight">
        <span
          className="bg-muted max-w-[7rem] truncate rounded-full px-1.5 py-0.5"
          title={targetPjName}
        >
          {targetPjName}
        </span>

        <span>›</span>

        {grandParentNode && (
          <>
            <span
              className="max-w-[7rem] truncate"
              title={grandParentNode.data.label}
            >
              {grandParentNode.data.label}
            </span>
            <span>›</span>
          </>
        )}

        {parentNode && (
          <span className="max-w-[7rem] truncate" title={parentNode.data.label}>
            {parentNode.data.label}
          </span>
        )}
      </div>
      <div className="min-w-0 pr-2 pt-0.5">
        <span
          className="text-foreground/80 block max-w-[94%] truncate text-sm"
          title={currentNode.data.label}
        >
          {currentNode.data.label}
        </span>
      </div>

      {/* 子タスク（Depth=1） */}
      <ul className="space-y-px">
        {/* {childrenNode.length === 0 && (
          <li className="text-xs text-muted-foreground">子タスクなし</li>
        )} */}

        {childrenNode.map((childNode) => (
          <li
            key={childNode.id}
            className="hover:bg-accent/60 group flex items-center gap-1.5 rounded px-1 py-px"
          >
            <Checkbox
              className="h-3.5 w-3.5"
              checked={childNode.data.isDone}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
              onCheckedChange={(checked) =>
                updateIsDoneFromKanban(card.pjId, childNode.id, !!checked)
              }
              aria-label="完了"
            />
            <span
              className={clsx(
                'text-sm leading-4',
                childNode.data.isDone && 'text-muted-foreground line-through'
              )}
              title={childNode.data.label}
            >
              {childNode.data.label}
            </span>

            {/* 右端ボタン群：次段で機能接続 */}
            <div className="ml-auto">
              <SubtasksPopover pjId={card.pjId} rootNodeId={childNode.id} />
            </div>

            {/* <button
              type="button"
              className="rounded p-1 opacity-0 transition-opacity group-hover:opacity-100"
              aria-label="コメント"
              title="コメント"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation()
                setCommentPopupId(childNode.id) // 既存の CommentPopover を後段で接続
              }}
            >
              <MessageSquareMore className="h-4 w-4" />
            </button> */}
          </li>
        ))}
      </ul>
    </div>
  )
}
