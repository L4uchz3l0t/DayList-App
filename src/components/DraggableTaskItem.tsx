import { useDraggable } from '@dnd-kit/core'
import type { ComponentProps } from 'react'
import { TaskItem } from './TaskItem'

type DraggableTaskItemProps = Omit<ComponentProps<typeof TaskItem>, 'drag'>

/** Eine Aufgabenkarte, die sich auf einen anderen Tag ziehen lässt (Gruppenaufgaben nicht). Braucht einen DndContext außen herum. */
export function DraggableTaskItem(props: DraggableTaskItemProps) {
  const { setNodeRef, listeners, isDragging } = useDraggable({
    id: props.task.id,
    disabled: props.task.group !== undefined || props.task.google !== undefined,
  })
  return <TaskItem {...props} drag={{ setNodeRef, listeners, isDragging }} />
}
