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
  success: 'border-success/30 bg-success/10 text-success',
  error: 'border-destructive/30 bg-destructive/10 text-destructive',
  info: 'border-border bg-card text-card-foreground',
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
                'flex items-start gap-2.5 rounded-lg border px-4 py-3 text-sm shadow-lg',
                'data-[state=open]:animate-[toast-in_0.2s_ease-out] data-[swipe=end]:animate-[overlay-out_0.15s_ease-in]',
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
