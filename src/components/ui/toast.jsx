import { createContext, useContext, useState, useCallback } from 'react'
import * as ToastPrimitive from '@radix-ui/react-toast'
import { CheckCircle2, XCircle, Info } from 'lucide-react'
import { cn } from '../../lib/cn'

const ToastCtx = createContext(null)

const icons = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
}

const styles = {
  success: 'border-emerald-500/30 text-emerald-300 [&>svg]:drop-shadow-[0_0_6px_rgb(16_185_129/0.6)]',
  error: 'border-rose-500/30 text-rose-300 [&>svg]:drop-shadow-[0_0_6px_rgb(244_63_94/0.6)]',
  info: 'border-violet-500/25 text-card-foreground',
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const toast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random()
    setToasts((prev) => [...prev, { id, message, type, open: true }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3500)
  }, [])

  return (
    <ToastCtx.Provider value={toast}>
      <ToastPrimitive.Provider swipeDirection="right" duration={3500}>
        {children}
        {toasts.map((t) => {
          const Icon = icons[t.type] || Info
          return (
            <ToastPrimitive.Root
              key={t.id}
              open={t.open}
              onOpenChange={(open) => {
                if (!open) setToasts((prev) => prev.filter((x) => x.id !== t.id))
              }}
              className={cn(
                'flex items-start gap-2.5 rounded-2xl border bg-card/85 px-4 py-3 text-sm backdrop-blur-xl',
                'shadow-[0_20px_50px_-12px_rgb(0_0_0/0.35)]',
                'data-[state=open]:animate-[toast-in_0.35s_cubic-bezier(0.22,1,0.36,1)] data-[swipe=end]:animate-[overlay-out_0.15s_ease-in]',
                styles[t.type]
              )}
            >
              <Icon className="mt-0.5 h-4 w-4 shrink-0" />
              <ToastPrimitive.Description className="leading-snug">{t.message}</ToastPrimitive.Description>
            </ToastPrimitive.Root>
          )
        })}
        <ToastPrimitive.Viewport className="fixed top-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2 outline-none" />
      </ToastPrimitive.Provider>
    </ToastCtx.Provider>
  )
}

export const useToast = () => useContext(ToastCtx)
