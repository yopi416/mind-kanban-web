import { useDroppable } from '@dnd-kit/core'

type CardDropZoneProps = {
  id: string
  children: React.ReactNode
}

export const CardDropZone = (props: CardDropZoneProps) => {
  const { setNodeRef } = useDroppable({ id: props.id })

  return (
    <div
      ref={setNodeRef}
      className="flex max-h-[calc(100vh-140px)] flex-col gap-2 overflow-y-auto rounded-lg p-1"
    >
      {props.children}
    </div>
  )
}
