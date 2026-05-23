'use client'

import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Eye, EyeOff } from 'lucide-react'

export interface SectionOrderItem {
  id: string
  type: string
  label: string
  enabled: boolean
}

/** Default section list — used when the offer's section_order is empty. */
export const DEFAULT_SECTIONS: SectionOrderItem[] = [
  { id: 'understanding', type: 'understanding', label: 'So haben wir Euch verstanden', enabled: true },
  { id: 'empathy',       type: 'empathy',       label: 'Unsere Perspektive (Empathy)', enabled: true },
  { id: 'newEra',        type: 'newEra',        label: 'Eine neue Ära der Überzeugungsarbeit', enabled: true },
  { id: 'ingredients',   type: 'ingredients',   label: '3 Zutaten für wirksame Überzeugung', enabled: true },
  { id: 'timeline',      type: 'timeline',      label: 'Programm & Timeline', enabled: true },
  { id: 'economic',      type: 'economic',      label: 'Ökonomische Ergebnisse', enabled: true },
  { id: 'pricing',       type: 'pricing',       label: 'Preise (DIY · DWY · DFY)', enabled: true },
  { id: 'accept',        type: 'accept',        label: 'Angebot annehmen (CTA)', enabled: true },
]

interface Props {
  items: SectionOrderItem[]
  onChange: (next: SectionOrderItem[]) => void
}

export function SectionOrderEditor({ items, onChange }: Props) {
  const list = items.length ? items : DEFAULT_SECTIONS
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e
    if (!over || active.id === over.id) return
    const oldIdx = list.findIndex((s) => s.id === active.id)
    const newIdx = list.findIndex((s) => s.id === over.id)
    if (oldIdx < 0 || newIdx < 0) return
    onChange(arrayMove(list, oldIdx, newIdx))
  }

  function toggle(id: string) {
    onChange(list.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s)))
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={list.map((s) => s.id)} strategy={verticalListSortingStrategy}>
        <ul className="space-y-2">
          {list.map((s) => (
            <SortableRow key={s.id} item={s} onToggle={() => toggle(s.id)} />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  )
}

function SortableRow({ item, onToggle }: { item: SectionOrderItem; onToggle: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id })
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.7 : 1,
  }
  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 rounded-xl border bg-white px-3 py-2.5 transition-colors ${
        item.enabled ? 'border-gray-200' : 'border-gray-100 bg-gray-50'
      }`}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="cursor-grab touch-none text-gray-300 hover:text-gray-600 active:cursor-grabbing"
        aria-label="Verschieben"
      >
        <GripVertical size={16} />
      </button>
      <span className={`flex-1 text-sm font-semibold ${item.enabled ? 'text-gray-800' : 'text-gray-400 line-through'}`}>
        {item.label}
      </span>
      <button
        type="button"
        onClick={onToggle}
        className="flex h-7 w-7 items-center justify-center rounded-md text-blue-600 hover:bg-blue-50"
        aria-label={item.enabled ? 'Ausblenden' : 'Einblenden'}
        title={item.enabled ? 'Ausblenden' : 'Einblenden'}
      >
        {item.enabled ? <Eye size={15} /> : <EyeOff size={15} />}
      </button>
    </li>
  )
}
