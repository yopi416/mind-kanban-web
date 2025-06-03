import { Handle, Position, type Node, type NodeProps } from '@xyflow/react'
import { RiKanbanView2 } from 'react-icons/ri' //kanbanIcon
import { MdOutlineCheckBox } from 'react-icons/md' //checkIcon
// import { MdOutlineCheckBoxOutlineBlank} from "react-icons/md"; //checkIcon
import { FaRegCommentDots } from 'react-icons/fa' //commentIcon
import { CiCirclePlus } from 'react-icons/ci' //plusIcon

export type NodeData = {
  label: string
}

function CustomNode({ data }: NodeProps<Node<NodeData>>) {
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
          }}
        >
          <CiCirclePlus size={20} />
        </button>
        <MdOutlineCheckBox size={20} />
        <RiKanbanView2 size={20} />
        <FaRegCommentDots size={20} />
      </div>

      <textarea
        rows={1}
        defaultValue={data.label}
        className="w-40 text-center text-2xl"
      />

      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  )
}

export default CustomNode
