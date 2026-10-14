import { useEffect } from 'react'

export interface ToastItem {
  id: number
  text: string
}

function Toast({ item, onDone }: { item: ToastItem; onDone: (id: number) => void }) {
  useEffect(() => {
    const id = window.setTimeout(() => onDone(item.id), 7000)
    return () => window.clearTimeout(id)
  }, [item.id, onDone])
  return (
    <div className="toast" onClick={() => onDone(item.id)}>
      {item.text}
    </div>
  )
}

export function Toasts({ items, onDone }: { items: ToastItem[]; onDone: (id: number) => void }) {
  if (items.length === 0) return null
  return (
    <div className="toasts">
      {items.map((t) => (
        <Toast key={t.id} item={t} onDone={onDone} />
      ))}
    </div>
  )
}
