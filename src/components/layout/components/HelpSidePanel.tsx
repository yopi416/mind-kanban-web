// HelpSidePanel.tsx
import { useEffect } from 'react'
import { cn } from '@/lib/utils'
import { HelpDialogContent } from './HelpDialog'
import { X } from 'lucide-react' // ← 追加

type Props = {
  open: boolean
  onClose: () => void
}

export function HelpSidePanel({ open, onClose }: Props) {
  // Esc キーで閉じる
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <>
      {/* 本体パネル */}
      <div
        className={cn(
          'fixed right-0 top-0 z-[9999] h-full w-[520px] border-l bg-white shadow-xl',
          'transform transition-transform duration-300',
          open ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* ヘッダー（×あり） */}
        <div className="flex items-center justify-between border-b p-4">
          <h2 className="text-lg font-semibold">操作ガイド</h2>

          <button
            aria-label="閉じる"
            onClick={onClose}
            className="hover:bg-muted rounded p-1 transition"
          >
            <X className="text-muted-foreground h-5 w-5" />
          </button>
        </div>

        {/* コンテンツ */}
        <div className="h-[calc(100%-60px)] overflow-y-auto p-4">
          <HelpDialogContent />
        </div>
      </div>

      {/* 背景（透明・操作通す） */}
      {open && (
        <div className="pointer-events-none fixed inset-0 z-[9998] bg-transparent" />
      )}
    </>
  )
}
