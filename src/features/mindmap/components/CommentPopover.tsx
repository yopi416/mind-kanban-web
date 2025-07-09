import { useState } from 'react'

import { type NodeData, type MindMapStore } from '@/types'
import useMindMapStore from '../store'

import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

import { format } from 'date-fns'
import { FaRegCommentDots } from 'react-icons/fa'
import { FiTrash2 } from 'react-icons/fi'
import { useShallow } from 'zustand/shallow'

type CommentPopoverProps = {
  id: string
  data: NodeData
  open: boolean
  onOpenChange: (open: boolean) => void
}

const selector = (store: MindMapStore) => ({
  addComment: store.addComment,
  editComment: store.editComment,
  deleteComment: store.deleteComment,
})

export function CommentPopover({
  id,
  data,
  open,
  onOpenChange,
}: CommentPopoverProps) {
  // console.log("re-lendaring:", id)
  // console.log(`${new Date().toLocaleString()} 再描画:`, id)

  const { addComment, editComment, deleteComment } = useMindMapStore(
    useShallow(selector)
  )
  const [draft, setDraft] = useState<string>('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState<string>('')

  const handleSubmit = () => {
    if (!draft.trim()) return
    addComment(id, draft)
    setDraft('')
  }

  const handleCancel = () => {
    setEditDraft('')
    setEditingId(null)
  }

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          onClick={(e) => e.stopPropagation()}
          className="relative z-[2] rounded-full hover:bg-gray-100"
        >
          <FaRegCommentDots
            size={20}
            className={data.comments.length ? 'text-blue-500' : ''}
          />
        </button>
      </PopoverTrigger>

      <PopoverContent
        className="z-[999] flex max-h-[400px] w-[400px] flex-col p-0"
        onClick={(e) => e.stopPropagation()}
      >
        {/* === コメント一覧 === */}
        <ScrollArea className="flex-1 space-y-4 overflow-y-auto p-3">
          {data.comments.map((c) => (
            <div key={c.id} className="mb-5 flex gap-2">
              {/* 左側：縦ライン */}
              <div className="flex w-4 flex-col items-center">
                <div className="h-full w-1 rounded-full bg-gray-300" />
              </div>

              {/* 右側：本文 */}
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div className="mb-1 text-xs font-medium text-gray-500">
                    {format(new Date(c.createdAt), 'yyyy年M月d日 HH:mm')}
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => deleteComment(id, c.id)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <FiTrash2 size={14} />
                    </button>
                  </div>
                </div>

                {editingId === c.id ? (
                  <>
                    <Textarea
                      autoFocus
                      value={editDraft}
                      className="mt-1 rounded-md px-3 py-2 text-sm leading-relaxed"
                      onChange={(e) => setEditDraft(e.target.value)}
                      onKeyDown={(e) => {
                        e.stopPropagation()
                      }}
                      maxLength={100}
                    />
                    <p className="text-right text-xs text-gray-500">
                      {editDraft.length}/100
                    </p>
                    <div className="mt-2 flex justify-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => {
                          if (editDraft !== c.content) {
                            editComment(id, c.id, editDraft)
                          }
                          setEditDraft('')
                          setEditingId(null)
                        }}
                        onKeyDown={(e) => e.stopPropagation()}
                      >
                        保存
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="border text-gray-400 hover:text-red-500"
                        onClick={handleCancel}
                        onKeyDown={(e) => e.stopPropagation()}
                      >
                        キャンセル
                      </Button>
                    </div>
                  </>
                ) : (
                  <div
                    className="mt-1 cursor-pointer whitespace-pre-wrap rounded-md bg-gray-50 px-3 py-2 text-sm leading-relaxed"
                    onClick={() => {
                      setEditingId(c.id)
                      setEditDraft(c.content)
                    }}
                  >
                    {c.content}
                  </div>
                )}
              </div>
            </div>
          ))}
        </ScrollArea>

        <Separator />

        {/* === 追記入力欄 === */}
        <div className="space-y-2 p-3">
          <Textarea
            placeholder="コメントを追加..."
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              e.stopPropagation() // ショートカット反応を防ぐ
            }}
            maxLength={100}
            className="min-h-[5rem] rounded-md text-sm shadow-sm focus:outline-none focus:ring focus:ring-blue-200"
          />
          <p className="text-right text-xs text-gray-500">{draft.length}/100</p>
          <Button
            size="sm"
            className="w-full"
            onClick={handleSubmit}
            onKeyDown={(e) => {
              e.stopPropagation()
            }}
          >
            送信
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
