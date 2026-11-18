import { useFrame } from '@react-three/fiber'
import { Environment, Float, Lightformer, RoundedBox } from '@react-three/drei'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { Network, Streams, Rig } from './InvoiceScene'

/* Used when there is too little sales history to draw a meaningful shape. */
const DEFAULT_SHAPE = [0.42, 0.55, 0.5, 0.68, 0.62, 0.8, 0.74, 0.92, 0.86, 1.05, 1.0, 1.2]

const BAR_W = 0.22
const GAP = 0.31 // centre-to-centre spacing
const MIN_H = 0.28
const MAX_H = 2.0
const VIOLET = new THREE.Color('#8b5cf6')
const CYAN = new THREE.Color('#22d3ee')

/** Turn monthly revenue into bar heights (oldest → newest, at most 12 bars). */
function toHeights(values) {
  const v = (values || []).map((n) => Math.max(Number(n) || 0, 0)).slice(-12)
  const usable = v.length >= 4 && v.some((n) => n > 0) ? v : DEFAULT_SHAPE
  const max = Math.max(...usable)
  return usable.map((n) => MIN_H + (MAX_H - MIN_H) * (n / max))
}

/* One column that grows up from the base plate after a staggered delay. */
function Bar({ x, height, color, delay, highlight }) {
  const ref = useRef(null)
  const grow = useRef(0)

  useFrame((state, dt) => {
    const m = ref.current
    if (!m) return
    const t = state.clock.elapsedTime
    const target = t > delay ? 1 : 0
    grow.current = THREE.MathUtils.damp(grow.current, target, 3.2, dt)
    // gentle "breathing" once grown, so the chart never looks frozen
    const breathe = 1 + Math.sin(t * 1.3 + x * 2.1) * 0.025 * grow.current
    const h = Math.max(height * grow.current * breathe, 0.001)
    m.scale.y = h
    m.position.y = h / 2
  })

  return (
    <group position={[x, 0, 0]}>
      <RoundedBox ref={ref} args={[BAR_W, 1, BAR_W]} radius={0.05} smoothness={3} scale={[1, 0.001, 1]}>
        <meshPhysicalMaterial
          color={color}
          emissive={color}
          emissiveIntensity={highlight ? 0.85 : 0.35}
          metalness={0.35}
          roughness={0.22}
          clearcoat={1}
          clearcoatRoughness={0.15}
          transparent
          opacity={highlight ? 1 : 0.9}
        />
      </RoundedBox>
    </group>
  )
}

/* Glowing trend line through the bar tops, drawn left → right. */
function TrendLine({ points, delay }) {
  const tube = useRef(null)
  const head = useRef(null)
  const progress = useRef(0)

  const { geometry, curve } = useMemo(() => {
    const c = new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.35)
    return { curve: c, geometry: new THREE.TubeGeometry(c, 160, 0.022, 10, false) }
  }, [points])
  useEffect(() => () => geometry.dispose(), [geometry])

  const tmp = useMemo(() => new THREE.Vector3(), [])

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime
    progress.current = THREE.MathUtils.damp(progress.current, t > delay ? 1 : 0, 1.6, dt)
    const p = Math.min(progress.current, 1)
    const total = geometry.index ? geometry.index.count : 0
    geometry.setDrawRange(0, Math.floor(total * p))
    if (head.current) {
      curve.getPoint(Math.max(p, 0.0001), tmp)
      head.current.position.copy(tmp)
      const pulse = 1 + Math.sin(t * 4) * 0.18
      head.current.scale.setScalar(p > 0.02 ? pulse : 0.0001)
    }
  })

  return (
    <group>
      <mesh ref={tube} geometry={geometry}>
        <meshBasicMaterial color="#67e8f9" transparent opacity={0.95} toneMapped={false} />
      </mesh>
      <mesh ref={head}>
        <sphereGeometry args={[0.065, 20, 20]} />
        <meshBasicMaterial color="#e0f2fe" toneMapped={false} />
      </mesh>
    </group>
  )
}

function GrowthChart({ values }) {
  const group = useRef(null)
  const heights = useMemo(() => toHeights(values), [values])
  const n = heights.length
  const startX = -((n - 1) * GAP) / 2

  const bars = useMemo(
    () =>
      heights.map((h, i) => ({
        x: startX + i * GAP,
        height: h,
        color: VIOLET.clone().lerp(CYAN, n > 1 ? i / (n - 1) : 1),
      })),
    [heights, n, startX]
  )

  const linePoints = useMemo(
    () => bars.map((b) => new THREE.Vector3(b.x, b.height + 0.16, BAR_W * 0.6)),
    [bars]
  )

  const plateW = n * GAP + 0.35

  useFrame((state) => {
    if (group.current) {
      const t = state.clock.elapsedTime
      group.current.rotation.y = -0.5 + Math.sin(t * 0.25) * 0.08
    }
  })

  return (
    <Float speed={1.2} rotationIntensity={0.08} floatIntensity={0.35}>
      <group ref={group} position={[0, -1.05, 0]} rotation={[0.22, -0.5, 0]}>
        {/* glass base plate */}
        <RoundedBox args={[plateW, 0.08, 0.95]} radius={0.04} smoothness={3} position={[0, -0.05, 0]}>
          <meshPhysicalMaterial
            color="#1e1b4b"
            metalness={0.2}
            roughness={0.1}
            transmission={0.6}
            thickness={0.4}
            transparent
            opacity={0.85}
            clearcoat={1}
          />
        </RoundedBox>
        {/* faint grid lines on the plate */}
        {[0.25, 0.75, 1.25, 1.75].map((y) => (
          <mesh key={y} position={[0, y, -0.32]}>
            <planeGeometry args={[plateW - 0.2, 0.006]} />
            <meshBasicMaterial color="#a78bfa" transparent opacity={0.12} />
          </mesh>
        ))}

        {bars.map((b, i) => (
          <Bar key={i} x={b.x} height={b.height} color={b.color} delay={0.15 + i * 0.08} highlight={i === n - 1} />
        ))}

        <TrendLine points={linePoints} delay={0.15 + n * 0.08} />
      </group>
    </Float>
  )
}

export default function GrowthScene({ compact = false, values }) {
  return (
    <>
      <ambientLight intensity={0.35} />
      <directionalLight position={[3, 4, 5]} intensity={1.1} />
      <pointLight position={[-4, -1, 2]} intensity={16} color="#22d3ee" />
      <pointLight position={[4, 3, 1]} intensity={20} color="#8b5cf6" />
      <Environment resolution={256}>
        <Lightformer intensity={2.2} position={[0, 4, 4]} scale={[10, 2, 1]} color="#ffffff" />
        <Lightformer intensity={3} position={[-5, 0, 2]} scale={[2, 6, 1]} color="#8b5cf6" />
        <Lightformer intensity={2.5} position={[5, -1, 2]} scale={[2, 6, 1]} color="#22d3ee" />
        <Lightformer form="ring" intensity={1.2} position={[0, 0, -6]} scale={6} color="#6366f1" />
      </Environment>
      <Network count={compact ? 55 : 85} />
      <Streams count={compact ? 110 : 200} />
      <GrowthChart values={values} />
      <Rig />
    </>
  )
}
