import { DndContext, useDroppable, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, useSortable, arrayMove } from '@dnd-kit/sortable'
import { useState } from 'react'
// import { nanoid } from 'nanoid'
import { CSS } from '@dnd-kit/utilities'

type Row = {
  id: string
  title: string
}

// function Draggable(props: Row) {
//   const {attributes, listeners, setNodeRef, transform} = useDraggable({
//     id: props.id,
//   });

//   const style = transform ? {
//     transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
//   } : undefined;

//   return (
//     <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
//         {props.title}
//     </div>
//   )
// }

function Sortable(props: Row) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: props.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {props.title}
    </div>
  )
}

export function KanbanPage() {
  const [rows, setRows] = useState<Row[]>([
    { id: 'row1', title: 'row1' },
    { id: 'row2', title: 'row2' },
  ])

  const { setNodeRef } = useDroppable({
    id: 'droppable',
  })

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <SortableContext id="Column1" items={rows}>
        <div ref={setNodeRef}>Drop here</div>
        {/* {rows.map((row) => <Draggable key={row.id} id={row.id} title={row.title} />)} */}
        {rows.map((row) => (
          <Sortable key={row.id} id={row.id} title={row.title} />
        ))}
      </SortableContext>
    </DndContext>
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event

    if (!over) return

    if (active.id !== over.id) {
      const activeIdx = rows.findIndex((row) => row.id === active.id)
      const overIdx = rows.findIndex((row) => row.id === over.id)

      setRows((prev) => {
        return arrayMove(prev, activeIdx, overIdx)
      })
    }

    console.log(rows)
  }
}
