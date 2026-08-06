import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody, DialogFooter } from './dialog'

export function Modal({ open, onClose, title, children, size = 'md', footer }) {
  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) onClose?.() }}>
      <DialogContent size={size}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <DialogBody>{children}</DialogBody>
        {footer && <DialogFooter>{footer}</DialogFooter>}
      </DialogContent>
    </Dialog>
  )
}
