import { Canvas } from '@react-three/fiber'
import { useEffect, useRef, useState } from 'react'

/**
 * Mounts the WebGL canvas once it nears the viewport and pauses the render
 * loop while it is off-screen.
 */
export function LazyCanvas({ children, className, ...props }) {
  const ref = useRef(null)
  const [mounted, setMounted] = useState(false)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([e]) => {
        setVisible(e.isIntersecting)
        if (e.isIntersecting) setMounted(true)
      },
      { rootMargin: '200px' }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <div ref={ref} className={className}>
      {mounted && (
        <Canvas
          dpr={[1, 1.75]}
          gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
          frameloop={visible ? 'always' : 'never'}
          {...props}
        >
          {children}
        </Canvas>
      )}
    </div>
  )
}
