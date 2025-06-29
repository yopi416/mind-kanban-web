import { useRef, useState, useLayoutEffect, useEffect } from 'react'
import { Handle, Position, type Node, type NodeProps } from '@xyflow/react'
import { RiKanbanView2 } from 'react-icons/ri' //kanbanIcon
import { MdOutlineCheckBox } from 'react-icons/md' //checkIcon
// import { MdOutlineTextRotationAngleup } from 'react-icons/md' //checkIcon
// import { MdOutlineCheckBoxOutlineBlank} from "react-icons/md"; //checkIcon
import { FaRegCommentDots } from 'react-icons/fa' //commentIcon
import { CiCirclePlus } from 'react-icons/ci' //plusIcon
import useMindMapStore, { type MindMapStore } from '../store'
import { useShallow } from 'zustand/shallow'

export type NodeData = {
  label: string
  parentId?: string | null
}

type HoverZone = 'left-top' | 'left-bottom' | 'right' | null

const selector = (store: MindMapStore) => ({
  updateNodeLabel: store.updateNodeLabel,
  addHorizontalElement: store.addHorizontalElement,
  addVerticalElement: store.addVerticalElement,
})

function CustomNode({ id, data }: NodeProps<Node<NodeData>>) {
  console.log(`customeNode "${id}" が再レンダリング`)

  /* ノードの付け替え時に色を付ける処理 */
  const [hoverPosition, setHoverPosition] = useState<HoverZone>(null)
  const [isHighlight, setIsHighlight] = useState<boolean>(false)

  const nodeRef = useRef<HTMLDivElement>(null) //ノード全体をwrapするdivへのref
  const movingNodeIdRef = useRef<string | null>(null)

  const { updateNodeLabel, addHorizontalElement, addVerticalElement } =
    useMindMapStore(useShallow(selector))

  useEffect(() => {
    const unsub = useMindMapStore.subscribe(
      (state) => state.movingNodeId,
      (newId) => (movingNodeIdRef.current = newId),
      { fireImmediately: true }
    )

    return () => unsub()
  }, [])

  // useEffect(() => {
  // const unsubscribe = useMindMapStore.subscribe(

  // )
  // return unsubscribe
  // }, [])

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

  /* テキスト変更時に、zustandstoreに反映&テキストボックスリサイズする処理 */

  const textAreaRef = useRef<HTMLTextAreaElement>(null) //ノードのテキストへのrefへのref

  const resizeTextArea = (el: HTMLTextAreaElement, text: string) => {
    if (!el) return

    const lines = text.split('\n')
    // const maxLineLength = Math.max(...lines.map((line) => line.length))
    const lineCount = lines.length

    // 横幅：最長行に基づき ch 単位で指定
    // const charWidth = maxLineLength * 1.53
    // el.style.width = `${charWidth}ch`

    // 縦幅：行数 × 行の高さ（1em） + 少し余白（例: 0.5em）
    const lineHeight = lineCount * 1.33
    el.style.height = `${lineHeight + 0.5}em`
  }

  // 入力中にリアルタイムで textareのwidth を更新する
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateNodeLabel(id, e.target.value)
    resizeTextArea(e.currentTarget, e.target.value)
  }

  // マウント直後 & ノードのラベル更新が起こったときにに textareaのwidth を合わせる
  useLayoutEffect(() => {
    if (textAreaRef.current) {
      resizeTextArea(textAreaRef.current, data.label)
    }
  }, [data.label])

  return (
    <div
      ref={nodeRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative"
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

      <div className="flex justify-end gap-2">
        {data.parentId && (
          <button
            type="button"
            onClick={() => addVerticalElement(id, data.parentId!)}
          >
            <CiCirclePlus size={20} />
          </button>
        )}

        <button type="button" onClick={() => addHorizontalElement(id)}>
          <CiCirclePlus size={20} />
        </button>

        <MdOutlineCheckBox size={20} />
        <RiKanbanView2 size={20} />
        <FaRegCommentDots size={20} />
      </div>

      <textarea
        value={data.label}
        onChange={handleChange}
        ref={textAreaRef}
        className="w-60 resize-none overflow-hidden px-3 pt-1 text-center text-2xl"
      />

      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  )
}

export default CustomNode
