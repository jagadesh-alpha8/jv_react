import { useEffect, useRef } from 'react'
import { animate, motion, useMotionTemplate, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { cn } from '../../lib/cn'

export const ease = [0.22, 1, 0.36, 1]

/** Fade + lift + un-blur on mount. */
export function Reveal({ children, delay = 0, y = 18, className, ...rest }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y, filter: 'blur(6px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)', transitionEnd: { filter: 'none' } }}
      transition={{ duration: 0.7, delay, ease }}
      {...rest}
    >
      {children}
    </motion.div>
  )
}

/** Parent/child pair for staggered entrances. */
export const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
}
export const riseItem = {
  hidden: { opacity: 0, y: 22, rotateX: -12, filter: 'blur(6px)' },
  show: { opacity: 1, y: 0, rotateX: 0, filter: 'blur(0px)', transition: { duration: 0.7, ease }, transitionEnd: { filter: 'none' } },
}

/** Sets --mx/--my on the element so .ring-glow can follow the cursor. */
export function trackPointer(e) {
  const r = e.currentTarget.getBoundingClientRect()
  e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`)
  e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`)
}

/**
 * 3D perspective card that tilts toward the cursor, with a moving glare highlight
 * and the cursor-following gradient border.
 */
export function TiltCard({ children, className, max = 10, glare = true, ...rest }) {
  const rx = useMotionValue(0)
  const ry = useMotionValue(0)
  const gx = useMotionValue(50)
  const gy = useMotionValue(50)
  const srx = useSpring(rx, { stiffness: 180, damping: 18 })
  const sry = useSpring(ry, { stiffness: 180, damping: 18 })
  const glareBg = useMotionTemplate`radial-gradient(420px circle at ${gx}% ${gy}%, rgb(255 255 255 / 0.16), transparent 45%)`

  const onMove = (e) => {
    trackPointer(e)
    const r = e.currentTarget.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width
    const py = (e.clientY - r.top) / r.height
    ry.set((px - 0.5) * max * 2)
    rx.set(-(py - 0.5) * max * 2)
    gx.set(px * 100)
    gy.set(py * 100)
  }
  const onLeave = () => { rx.set(0); ry.set(0) }

  return (
    <motion.div
      variants={riseItem}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      whileHover={{ z: 20, scale: 1.015 }}
      style={{ rotateX: srx, rotateY: sry, transformPerspective: 900, transformStyle: 'preserve-3d' }}
      className={cn('ring-glow glass group relative rounded-2xl shadow-[0_10px_40px_-18px_rgb(76_29_149/0.45)]', className)}
      {...rest}
    >
      {children}
      {glare && (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{ background: glareBg }}
        />
      )}
    </motion.div>
  )
}

/** Number that counts from its previous value to the new one. */
export function AnimatedNumber({ value, format = (v) => Math.round(v).toLocaleString('en-IN'), duration = 1.4 }) {
  const mv = useMotionValue(0)
  const fmtRef = useRef(format)
  fmtRef.current = format
  const text = useTransform(mv, (v) => fmtRef.current(v))

  useEffect(() => {
    const target = Number(value) || 0
    const c = animate(mv, target, { duration, ease: [0.16, 1, 0.3, 1] })
    return c.stop
  }, [value, duration, mv])

  return <motion.span>{text}</motion.span>
}

/** Small pill label with a glowing gradient dot. */
export function Eyebrow({ children, className, dark = false }) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-medium tracking-wide',
        dark ? 'border-white/10 bg-white/[0.04] text-white/70' : 'border-border bg-card/60 text-muted-foreground',
        className
      )}
    >
      <span className="relative flex h-1.5 w-1.5">
        <span className="pulse-ring absolute inset-0 rounded-full bg-violet-400" />
        <span className="relative h-1.5 w-1.5 rounded-full bg-gradient-to-r from-violet-400 to-cyan-300 shadow-[0_0_10px_2px_rgba(139,92,246,0.6)]" />
      </span>
      {children}
    </div>
  )
}
