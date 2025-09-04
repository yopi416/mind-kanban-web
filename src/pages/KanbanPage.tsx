import { DndContext, useDraggable, useDroppable } from '@dnd-kit/core'
import { useState } from 'react'
import { nanoid } from 'nanoid'

function Draggable(props) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: props.id,
  })

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined

  return (
    <button ref={setNodeRef} style={style} {...listeners} {...attributes}>
      {props.children}
    </button>
  )
}

function Droppable(props) {
  const { isOver, setNodeRef } = useDroppable({
    id: props.id,
  })
  const style = {
    color: isOver ? 'green' : undefined,
  }

  return (
    <div ref={setNodeRef} style={style}>
      {props.children}
    </div>
  )
}

export const KanbanPage = () => {
  const containers = ['A', 'B', 'C']
  const [parent, setParent] = useState(null)

  const draggableMarkup = <Draggable id={nanoid()}>Drag me</Draggable>

  function handleDragEnd(e) {
    const { over } = e
    setParent(over ? over.id : null)
  }

  return (
    <DndContext onDragEnd={handleDragEnd}>
      {parent === null ? draggableMarkup : null}

      {containers.map((c) => {
        return (
          <Droppable key={c} id={c}>
            {parent === c ? draggableMarkup : 'Drop here'}
          </Droppable>
        )
      })}

      {[<p>1</p>, <p>2</p>, <p>3</p>]}
    </DndContext>
  )
}
