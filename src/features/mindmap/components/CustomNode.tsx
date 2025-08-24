import { useRef, useState, useLayoutEffect, useEffect } from 'react'
import { Handle, Position, type Node, type NodeProps } from '@xyflow/react'
import { RiKanbanView2 } from 'react-icons/ri' //kanbanIcon
// import { MdOutlineCheckBox } from 'react-icons/md' //checkIcon
// import { MdOutlineTextRotationAngleup } from 'react-icons/md' //checkIcon
// import { MdOutlineCheckBoxOutlineBlank} from "react-icons/md"; //checkIcon
import { CiCirclePlus } from 'react-icons/ci' //plusIcon
import useMindMapStore from '../store'
import { useShallow } from 'zustand/shallow'
import clsx from 'clsx'
import { type NodeData, type MindMapStore } from '../../../types.ts'
import { CommentPopover } from './CommentPopover.tsx'
import { Checkbox } from '@/components/ui/checkbox'
// import { set } from 'lodash'
import { MAX_NODE_LABEL_LENGTH } from '../constants.ts'

type HoverZone = 'left-top' | 'left-bottom' | 'right' | null

const selector = (store: MindMapStore) => ({
  updateNodeLabel: store.updateNodeLabel,
  addHorizontalElement: store.addHorizontalElement,
  addVerticalElement: store.addVerticalElement,
  setFocusedNodeId: store.setFocusedNodeId,
  setEditingNodeId: store.setEditingNodeId,
  setCommentPopupId: store.setCommentPopupId,
  updateIsDone: store.updateIsDone,
})

function CustomNode({ id, data }: NodeProps<Node<NodeData>>) {
  // console.log(`${new Date().toLocaleString()} 再描画:`, id)

  /* zustan-storeから呼び出し */
  const {
    updateNodeLabel,
    addHorizontalElement,
    addVerticalElement,
    setFocusedNodeId,
    setEditingNodeId,
    setCommentPopupId,
    updateIsDone,
  } = useMindMapStore(useShallow(selector))

  /* 自ノードがfocus時に枠色を強調 */
  const [isFocused, setIsFocused] = useState<boolean>(false) //自ノードがフォーカスされているかのフラグ

  useEffect(() => {
    const unsub = useMindMapStore.subscribe(
      (state) => state.focusedNodeId,
      (newId) => {
        setIsFocused(newId === id)
      },
      { fireImmediately: true }
    )

    return () => unsub()
  }, [id])

  /* 編集モードがフラグがたったら、編集モードへ移行 */
  useEffect(() => {
    const unsub = useMindMapStore.subscribe(
      (state) => state.editingNodeId,
      (newId) => {
        if (newId === id) {
          setIsEditing(true)
          setTimeout(() => textAreaRef.current?.focus(), 0)
        }
      },
      { fireImmediately: true }
    )

    return () => unsub()
  }, [id])

  /* ノードの付け替え時に色を付ける処理 */
  const [hoverPosition, setHoverPosition] = useState<HoverZone>(null)
  const [isHighlight, setIsHighlight] = useState<boolean>(false)

  const nodeRef = useRef<HTMLDivElement>(null) //ノード全体をwrapするdivへのref
  const movingNodeIdRef = useRef<string | null>(null)

  const [isMovingSelf, setIsMovingSelf] = useState(false) //自ノードが移動されているかのフラグ

  useEffect(() => {
    const unsub = useMindMapStore.subscribe(
      (state) => state.movingNodeId,
      (newId) => {
        movingNodeIdRef.current = newId
        setIsMovingSelf(newId === id)
      },
      { fireImmediately: true }
    )

    return () => unsub()
  }, [id])

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!nodeRef.current) return

    const rect = nodeRef.current.getBoundingClientRect()
    const offsetX = e.clientX - rect.left
    const offsetY = e.clientY - rect.top

    const isRight = offsetX > rect.width * (4 / 5)
    const isTop = offsetY < rect.height / 2

    if (isRight) {
      setHoverPosition('right')
    } else {
      setHoverPosition(isTop ? 'left-top' : 'left-bottom')
    }

    const shouldHighlight =
      movingNodeIdRef.current !== null && movingNodeIdRef.current != id

    setIsHighlight((prev) =>
      prev !== shouldHighlight ? shouldHighlight : prev
    ) //同じときはprevをセットすることでリレンダリング防止
  }

  const handleMouseLeave = () => {
    setHoverPosition(null)
  }

  /* ---textareaとHandle(source)どちらが動作するかの管理--- */

  // textareaをpointer-events-autoにするかのフラグ
  const [isEditing, setIsEditing] = useState(false)

  // textarea の className
  const textAreaCls = clsx(
    // 'w-60 resize-none overflow-hidden px-3 pt-1 text-center text-2xl',
    'w-60 resize-none overflow-hidden px-3 pt-1 text-center text-2xl',
    'whitespace-pre-wrap break-words',
    isEditing
      ? 'relative z-[2] pointer-events-auto focus:outline-none'
      : 'pointer-events-none select-none opacity-90'
  )

  // 編集モードへ移行するクリックハンドラ
  const enterEdit = () => {
    if (isFocused) {
      setEditingNodeId(id)
    } else {
      setFocusedNodeId(id)
    }
  }

  // blur(focusが外れた時)で編集終了
  const leaveEdit = () => {
    setIsEditing(false)
    setEditingNodeId(null)
    console.log('eeeee')
  }

  /* --- コメントポップアップ用 --- */
  const [isPopupOpen, setIsPopupOpen] = useState<boolean>(false)

  useEffect(() => {
    const unsub = useMindMapStore.subscribe(
      (state) => state.commentPopupId,
      (newId) => {
        setIsPopupOpen(newId === id)
      },
      { fireImmediately: true }
    )

    return () => unsub()
  }, [id])

  /* ---テキスト変更時に、zustandstoreに反映&テキストボックスリサイズする処理--- */
  const textAreaRef = useRef<HTMLTextAreaElement>(null) //ノードのテキストへのrefへのref

  const resizeTextArea = (el: HTMLTextAreaElement) => {
    if (!el) return
    el.style.height = '0px' // or 'auto'
    el.style.height = `${el.scrollHeight}px`
  }

  // ノードのテキストを更新 & 入力中に textareaのwidth を更新する
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const limitedLengthLabel = e.target.value.slice(0, MAX_NODE_LABEL_LENGTH) // 入力文字数制限

    updateNodeLabel(id, limitedLengthLabel)
    e.currentTarget.value = limitedLengthLabel
    resizeTextArea(e.currentTarget) //高さを変更
  }

  // マウント直後 & ノードのラベル更新が起こったときにに textareaのwidth を合わせる
  useLayoutEffect(() => {
    if (textAreaRef.current) {
      resizeTextArea(textAreaRef.current)
    }
  }, [data.label])

  return (
    <div
      tabIndex={0}
      ref={nodeRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={enterEdit}
      className={clsx(
        'relative z-[1] border-2',
        isFocused ? 'ring-2 ring-blue-500' : '',
        isMovingSelf ? 'border-2 border-dashed border-blue-500' : '',
        data.isDone ? 'bg-gray-200' : ''
      )}
    >
      {isHighlight && hoverPosition === 'left-top' && (
        <div className="pointer-events-none absolute left-0 top-0 z-10 h-1/2 w-4/5 rounded-tl-lg bg-blue-200 opacity-40" />
      )}
      {isHighlight && hoverPosition === 'left-bottom' && (
        <div className="pointer-events-none absolute bottom-0 left-0 z-10 h-1/2 w-4/5 rounded-bl-lg bg-green-200 opacity-40" />
      )}
      {isHighlight && hoverPosition === 'right' && (
        <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-1/5 rounded-r-lg bg-yellow-200 opacity-40" />
      )}

      <div className="flex items-center justify-between">
        {/* 左端に表示 */}
        {isMovingSelf ? (
          <span className="ml-3 animate-pulse text-sm font-semibold text-blue-500">
            {' '}
            移動中...
          </span>
        ) : (
          <span /> // スペース保持のため（isMovingSelfがfalseでも左端に空要素を維持）
        )}

        {/* 右端のボタン群 */}
        <div className="flex items-center gap-2">
          {data.parentId && (
            <button
              type="button"
              onClick={() => addVerticalElement(id, data.parentId!)}
              className="relative z-[2]"
            >
              <CiCirclePlus size={20} />
            </button>
          )}

          <button
            type="button"
            onClick={() => addHorizontalElement(id)}
            className="relative z-[2]"
          >
            <CiCirclePlus size={20} />
          </button>

          <Checkbox
            checked={data.isDone}
            onClick={(e) => e.stopPropagation()}
            onCheckedChange={(checked) => updateIsDone(id, !!checked)}
            className={clsx(
              'relative z-[2]',
              !data.isDone && 'border-gray-600'
            )}
          />

          <RiKanbanView2 size={20} />
          <CommentPopover
            id={id}
            data={data}
            open={isPopupOpen} //ポップアップフラグ
            onOpenChange={(open) => setCommentPopupId(open ? id : null)} //コメントボタン開閉
          />
          {/* <FaRegCommentDots size={20} /> */}
        </div>
      </div>

      <textarea
        ref={textAreaRef}
        value={data.label}
        onChange={handleChange}
        maxLength={MAX_NODE_LABEL_LENGTH}
        onBlur={leaveEdit}
        // readOnly={!isEditing}
        tabIndex={isEditing ? 0 : -1} // 編集中以外はフォーカス対象外
        onKeyDown={(e) => {
          //Ctrl + Enterで入力完了
          if ((e.ctrlKey && e.key === 'Enter') || e.key === 'Escape') {
            e.preventDefault()
            textAreaRef.current?.blur()
          }

          e.stopPropagation() // textarea入力中は上位に矢印キーの伝播を止める
        }}
        className={textAreaCls}
      />

      {/* <div className="absolute bottom-1 right-2 text-xs text-muted-foreground">
        {data.label.length} / {MAX_NODE_LABEL_LENGTH}
      </div> */}

      <Handle type="target" position={Position.Left} />
      <Handle
        type="source"
        position={Position.Right}
        className={
          isEditing ? 'pointer-events-none' : 'pointer-events-auto z-0'
        }
      />
    </div>
  )
}

export default CustomNode
