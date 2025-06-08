import { useRef, useLayoutEffect } from 'react'
import { Handle, Position, type Node, type NodeProps } from '@xyflow/react'
import { RiKanbanView2 } from 'react-icons/ri' //kanbanIcon
import { MdOutlineCheckBox } from 'react-icons/md' //checkIcon
// import { MdOutlineCheckBoxOutlineBlank} from "react-icons/md"; //checkIcon
import { FaRegCommentDots } from 'react-icons/fa' //commentIcon
import { CiCirclePlus } from 'react-icons/ci' //plusIcon
import useMindMapStore from '../store'

export type NodeData = {
  label: string
  parentId?: string | null
}

function CustomNode({ id, data }: NodeProps<Node<NodeData>>) {
  const textAreaRef = useRef<HTMLTextAreaElement>(null)
  const updateNodeLabel = useMindMapStore((store) => store.updateNodeLabel)

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

  // マウント直後 & React Flow からラベル更新が来たときに textareのwidth を合わせる
  useLayoutEffect(() => {
    if (textAreaRef.current) {
      resizeTextArea(textAreaRef.current, data.label)
    }
  }, [data.label])

  // 入力中にもリアルタイムで textareのwidth を更新する
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateNodeLabel(id, e.target.value)
    resizeTextArea(e.currentTarget, e.target.value)
  }

  return (
    <div>
      <div className="flex justify-end gap-2">
        <button
          onClick={() => {
            console.log('test-button')
          }}
        >
          <CiCirclePlus size={20} />
        </button>
        <button
          onClick={() => {
            console.log('test-button')
            console.log(data.label)
          }}
        >
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
