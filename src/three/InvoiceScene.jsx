import { useFrame, useThree } from '@react-three/fiber'
import { Environment, Float, Lightformer, RoundedBox } from '@react-three/drei'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'

/* deterministic pseudo-random so textures and layouts are stable */
function rng(seed) {
  let s = seed
  return () => ((s = (s * 9301 + 49297) % 233280) / 233280)
}

/* ---------- Invoice face texture (drawn on a 2D canvas) ---------- */
function makeInvoiceTexture() {
  const W = 768
  const H = 1024
  const c = document.createElement('canvas')
  c.width = W
  c.height = H
  const g = c.getContext('2d')

  const base = g.createLinearGradient(0, 0, W, H)
  base.addColorStop(0, '#15121f')
  base.addColorStop(0.55, '#0c0c14')
  base.addColorStop(1, '#0a1218')
  g.fillStyle = base
  g.fillRect(0, 0, W, H)

  const a = g.createRadialGradient(W * 0.9, 0, 10, W * 0.9, 0, W * 0.8)
  a.addColorStop(0, 'rgba(139,92,246,0.5)')
  a.addColorStop(0.5, 'rgba(99,102,241,0.1)')
  a.addColorStop(1, 'rgba(0,0,0,0)')
  g.fillStyle = a
  g.fillRect(0, 0, W, H)
  const b = g.createRadialGradient(0, H, 10, 0, H, W * 0.75)
  b.addColorStop(0, 'rgba(34,211,238,0.3)')
  b.addColorStop(1, 'rgba(0,0,0,0)')
  g.fillStyle = b
  g.fillRect(0, 0, W, H)

  // logo tile
  const lg = g.createLinearGradient(56, 56, 120, 120)
  lg.addColorStop(0, '#8b5cf6')
  lg.addColorStop(1, '#22d3ee')
  g.fillStyle = lg
  g.beginPath()
  g.roundRect(56, 56, 64, 64, 16)
  g.fill()
  g.fillStyle = '#fff'
  g.font = '700 28px Inter, sans-serif'
  g.textAlign = 'center'
  g.fillText('JV', 88, 98)
  g.textAlign = 'left'
  g.font = '600 34px Inter, sans-serif'
  g.fillStyle = 'rgba(255,255,255,0.92)'
  g.fillText('GST', 140, 100)
  const w1 = g.measureText('GST').width
  g.fillStyle = '#a78bfa'
  g.fillText('Bill', 140 + w1, 100)

  g.textAlign = 'right'
  g.fillStyle = 'rgba(255,255,255,0.45)'
  g.font = '600 18px Inter, sans-serif'
  g.fillText('TAX INVOICE', W - 56, 78)
  g.fillStyle = 'rgba(255,255,255,0.9)'
  g.font = '500 24px "JetBrains Mono", monospace'
  g.fillText('INV-2026-0042', W - 56, 110)
  g.textAlign = 'left'

  const bar = (x, y, w, h = 12, col = 'rgba(255,255,255,0.14)') => {
    g.fillStyle = col
    g.beginPath()
    g.roundRect(x, y, w, h, h / 2)
    g.fill()
  }

  // bill-to block
  g.fillStyle = 'rgba(255,255,255,0.4)'
  g.font = '600 16px Inter, sans-serif'
  g.fillText('BILLED TO', 56, 186)
  bar(56, 204, 240, 16, 'rgba(255,255,255,0.75)')
  bar(56, 232, 300)
  bar(56, 254, 210)
  g.fillStyle = 'rgba(255,255,255,0.4)'
  g.fillText('GSTIN', W - 300, 186)
  g.fillStyle = 'rgba(255,255,255,0.75)'
  g.font = '500 18px "JetBrains Mono", monospace'
  g.fillText('33ABCDE1234F1Z5', W - 300, 216)

  // items table
  g.strokeStyle = 'rgba(255,255,255,0.08)'
  g.lineWidth = 2
  g.beginPath()
  g.moveTo(56, 310)
  g.lineTo(W - 56, 310)
  g.stroke()
  g.fillStyle = 'rgba(255,255,255,0.4)'
  g.font = '600 15px Inter, sans-serif'
  g.fillText('ITEM', 56, 340)
  g.fillText('HSN', 380, 340)
  g.textAlign = 'right'
  g.fillText('AMOUNT', W - 56, 340)
  g.textAlign = 'left'
  const r = rng(11)
  const amounts = ['₹ 42,000', '₹ 18,500', '₹ 27,300', '₹ 9,800', '₹ 4,200']
  for (let i = 0; i < 5; i++) {
    const y = 372 + i * 56
    bar(56, y, 180 + r() * 120, 14, 'rgba(255,255,255,0.55)')
    bar(56, y + 22, 120 + r() * 80, 10)
    g.fillStyle = 'rgba(255,255,255,0.5)'
    g.font = '400 16px "JetBrains Mono", monospace'
    g.fillText(String(8400 + Math.floor(r() * 900)), 380, y + 14)
    g.textAlign = 'right'
    g.fillStyle = 'rgba(255,255,255,0.85)'
    g.font = '500 18px "JetBrains Mono", monospace'
    g.fillText(amounts[i], W - 56, y + 15)
    g.textAlign = 'left'
  }
  g.beginPath()
  g.moveTo(56, 662)
  g.lineTo(W - 56, 662)
  g.stroke()

  // taxes
  const line = (label, val, y) => {
    g.fillStyle = 'rgba(255,255,255,0.45)'
    g.font = '500 17px Inter, sans-serif'
    g.fillText(label, W - 360, y)
    g.textAlign = 'right'
    g.fillStyle = 'rgba(255,255,255,0.8)'
    g.font = '500 18px "JetBrains Mono", monospace'
    g.fillText(val, W - 56, y)
    g.textAlign = 'left'
  }
  line('Subtotal', '₹ 1,01,800', 700)
  line('CGST 9%', '₹ 9,162', 732)
  line('SGST 9%', '₹ 9,162', 764)

  // grand total
  const tg = g.createLinearGradient(W - 400, 0, W - 56, 0)
  tg.addColorStop(0, '#c4b5fd')
  tg.addColorStop(0.5, '#818cf8')
  tg.addColorStop(1, '#67e8f9')
  g.fillStyle = 'rgba(255,255,255,0.5)'
  g.font = '600 16px Inter, sans-serif'
  g.fillText('GRAND TOTAL', W - 360, 818)
  g.textAlign = 'right'
  g.fillStyle = tg
  g.font = '700 46px Inter, sans-serif'
  g.fillText('₹ 1,20,124', W - 56, 870)
  g.textAlign = 'left'

  // PAID stamp
  g.save()
  g.translate(170, 820)
  g.rotate(-0.22)
  g.strokeStyle = 'rgba(52,211,153,0.85)'
  g.lineWidth = 5
  g.beginPath()
  g.roundRect(-100, -44, 200, 88, 18)
  g.stroke()
  g.fillStyle = 'rgba(52,211,153,0.9)'
  g.font = '800 46px Inter, sans-serif'
  g.textAlign = 'center'
  g.fillText('PAID', 0, 16)
  g.restore()
  g.textAlign = 'left'

  // QR-ish block
  const q = rng(5)
  g.fillStyle = 'rgba(255,255,255,0.35)'
  for (let y = 0; y < 9; y++)
    for (let x = 0; x < 9; x++) if (q() > 0.5) g.fillRect(56 + x * 9, 920 + y * 9, 8, 8)
  g.fillStyle = 'rgba(255,255,255,0.3)'
  g.font = '400 15px Inter, sans-serif'
  g.fillText('Thank you for your business', 160, 960)

  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 8
  return tex
}

/* ---------- ₹ coin face ---------- */
function makeCoinTexture() {
  const S = 256
  const c = document.createElement('canvas')
  c.width = S
  c.height = S
  const g = c.getContext('2d')
  const rg = g.createRadialGradient(S * 0.35, S * 0.3, 10, S / 2, S / 2, S / 2)
  rg.addColorStop(0, '#fff3c4')
  rg.addColorStop(0.45, '#f5c451')
  rg.addColorStop(1, '#b8862b')
  g.fillStyle = rg
  g.fillRect(0, 0, S, S)
  g.strokeStyle = 'rgba(120,80,20,0.45)'
  g.lineWidth = 6
  g.beginPath()
  g.arc(S / 2, S / 2, S * 0.4, 0, Math.PI * 2)
  g.stroke()
  g.fillStyle = 'rgba(110,70,15,0.75)'
  g.font = '700 140px Inter, sans-serif'
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.fillText('₹', S / 2, S / 2 + 6)
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

/** Draws the texture now, and again once webfonts load so the type stays crisp. */
function useCanvasTexture(make) {
  return useMemo(() => {
    const t = make()
    document.fonts?.ready.then(() => {
      t.image = make().image
      t.needsUpdate = true
    })
    return t
  }, [make])
}

function Invoice() {
  const group = useRef(null)
  const texture = useCanvasTexture(makeInvoiceTexture)
  const { pointer } = useThree()

  useFrame((state, dt) => {
    if (!group.current) return
    const t = state.clock.elapsedTime
    const tx = -0.12 + pointer.y * 0.22 + Math.sin(t * 0.6) * 0.03
    const ty = -0.38 + pointer.x * 0.4 + Math.sin(t * 0.4) * 0.07
    group.current.rotation.x = THREE.MathUtils.damp(group.current.rotation.x, tx, 3, dt)
    group.current.rotation.y = THREE.MathUtils.damp(group.current.rotation.y, ty, 3, dt)
  })

  return (
    <Float speed={1.4} rotationIntensity={0.12} floatIntensity={0.55}>
      <group ref={group} rotation={[-0.12, -0.38, 0.05]}>
        <RoundedBox args={[2.16, 2.88, 0.05]} radius={0.1} smoothness={6}>
          <meshPhysicalMaterial color="#0e0d16" metalness={0.6} roughness={0.28} clearcoat={1} clearcoatRoughness={0.12} iridescence={0.4} iridescenceIOR={1.3} />
        </RoundedBox>
        <mesh position={[0, 0, 0.0262]}>
          <planeGeometry args={[2.06, 2.75]} />
          <meshPhysicalMaterial map={texture} transparent metalness={0.25} roughness={0.35} clearcoat={1} clearcoatRoughness={0.08} />
        </mesh>
        <mesh position={[0, 0, -0.04]} scale={1.04}>
          <planeGeometry args={[2.16, 2.88]} />
          <meshBasicMaterial color="#7c3aed" transparent opacity={0.2} blending={THREE.AdditiveBlending} />
        </mesh>
      </group>
    </Float>
  )
}

/* gold ₹ coins orbiting the invoice */
function Coins() {
  const ref = useRef(null)
  const face = useCanvasTexture(makeCoinTexture)
  const coins = useMemo(
    () => [
      { r: 1.95, s: 0.32, y: 0.95, p: 0, size: 1 },
      { r: 2.2, s: -0.24, y: -0.9, p: 2.2, size: 0.8 },
      { r: 1.75, s: 0.27, y: -0.1, p: 4.1, size: 0.65 },
    ],
    []
  )
  const materials = useMemo(() => {
    const side = new THREE.MeshStandardMaterial({ color: '#d4a640', metalness: 1, roughness: 0.3 })
    const f = new THREE.MeshStandardMaterial({ map: face, metalness: 0.85, roughness: 0.28 })
    return [side, f, f]
  }, [face])

  useFrame((s) => {
    ref.current?.children.forEach((m, i) => {
      const n = coins[i]
      const t = s.clock.elapsedTime * n.s + n.p
      m.position.set(Math.cos(t) * n.r, n.y + Math.sin(t * 2) * 0.12, Math.sin(t) * n.r * 0.55 + 0.2)
      m.rotation.y = s.clock.elapsedTime * 1.2 + n.p
    })
  })

  return (
    <group ref={ref}>
      {coins.map((n, i) => (
        <group key={i} scale={n.size}>
          <mesh rotation={[Math.PI / 2, 0, 0]} material={materials}>
            <cylinderGeometry args={[0.3, 0.3, 0.055, 48]} />
          </mesh>
          <mesh scale={2.6}>
            <sphereGeometry args={[0.12, 16, 16]} />
            <meshBasicMaterial color="#f5c451" transparent opacity={0.08} blending={THREE.AdditiveBlending} depthWrite={false} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

/* nodes + proximity edges drifting behind the invoice */
function Network({ count = 80 }) {
  const ref = useRef(null)
  const { positions, lines } = useMemo(() => {
    const r = rng(42)
    const pts = []
    for (let i = 0; i < count; i++) {
      const u = r() * Math.PI * 2
      const v = Math.acos(2 * r() - 1)
      const rad = 3 + r() * 1.6
      pts.push(new THREE.Vector3(rad * Math.sin(v) * Math.cos(u) * 1.5, rad * Math.sin(v) * Math.sin(u) * 0.8, rad * Math.cos(v) * 0.7 - 2.4))
    }
    const seg = []
    for (let i = 0; i < count; i++)
      for (let j = i + 1; j < count; j++) if (pts[i].distanceTo(pts[j]) < 1.5) seg.push(...pts[i].toArray(), ...pts[j].toArray())
    return { positions: new Float32Array(pts.flatMap((p) => p.toArray())), lines: new Float32Array(seg) }
  }, [count])

  useFrame((s) => {
    if (ref.current) ref.current.rotation.y = s.clock.elapsedTime * 0.03
  })

  return (
    <group ref={ref}>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <pointsMaterial color="#a78bfa" size={0.05} sizeAttenuation transparent opacity={0.85} />
      </points>
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[lines, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color="#6366f1" transparent opacity={0.14} />
      </lineSegments>
    </group>
  )
}

/* payment particles streaming into the invoice */
function Streams({ count = 220 }) {
  const ref = useRef(null)
  const data = useMemo(() => {
    const r = rng(7)
    const curves = []
    for (let i = 0; i < 9; i++) {
      const side = i % 2 ? 1 : -1
      const start = new THREE.Vector3(side * (4.5 + r() * 2), (r() - 0.5) * 5, -1.5 - r() * 2)
      curves.push(
        new THREE.CubicBezierCurve3(
          start,
          new THREE.Vector3(side * 3, start.y * 0.4 + (r() - 0.5) * 2, 0.5),
          new THREE.Vector3(side * 1.1, (r() - 0.5) * 1.2, 0.8),
          new THREE.Vector3((r() - 0.5) * 0.6, (r() - 0.5) * 0.5, 0.1)
        )
      )
    }
    const palette = [new THREE.Color('#a78bfa'), new THREE.Color('#67e8f9'), new THREE.Color('#f5c451')]
    const colors = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) palette[i % 3].toArray(colors, i * 3)
    return {
      curves,
      colors,
      offsets: Float32Array.from({ length: count }, () => r()),
      speeds: Float32Array.from({ length: count }, () => 0.06 + r() * 0.08),
      positions: new Float32Array(count * 3),
    }
  }, [count])
  const tmp = useMemo(() => new THREE.Vector3(), [])

  useFrame((_, dt) => {
    const pts = ref.current
    if (!pts) return
    const attr = pts.geometry.attributes.position
    for (let i = 0; i < count; i++) {
      data.offsets[i] = (data.offsets[i] + data.speeds[i] * dt) % 1
      data.curves[i % data.curves.length].getPoint(data.offsets[i], tmp)
      attr.setXYZ(i, tmp.x, tmp.y, tmp.z)
    }
    attr.needsUpdate = true
  })

  return (
    <points ref={ref} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[data.positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[data.colors, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.045} vertexColors transparent opacity={0.95} blending={THREE.AdditiveBlending} depthWrite={false} />
    </points>
  )
}

function Rig() {
  const { camera, pointer } = useThree()
  useFrame((_, dt) => {
    camera.position.x = THREE.MathUtils.damp(camera.position.x, pointer.x * 0.35, 2, dt)
    camera.position.y = THREE.MathUtils.damp(camera.position.y, pointer.y * 0.25, 2, dt)
    camera.lookAt(0, 0, 0)
  })
  return null
}

export default function InvoiceScene({ compact = false }) {
  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight position={[3, 4, 5]} intensity={1.2} />
      <pointLight position={[-4, -2, 2]} intensity={18} color="#22d3ee" />
      <pointLight position={[4, 3, 1]} intensity={22} color="#8b5cf6" />
      <Environment resolution={256}>
        <Lightformer intensity={2.2} position={[0, 4, 4]} scale={[10, 2, 1]} color="#ffffff" />
        <Lightformer intensity={3} position={[-5, 0, 2]} scale={[2, 6, 1]} color="#8b5cf6" />
        <Lightformer intensity={2.5} position={[5, -1, 2]} scale={[2, 6, 1]} color="#22d3ee" />
        <Lightformer form="ring" intensity={1.2} position={[0, 0, -6]} scale={6} color="#6366f1" />
      </Environment>
      <Network count={compact ? 55 : 85} />
      <Streams count={compact ? 140 : 240} />
      <Coins />
      <Invoice />
      <Rig />
    </>
  )
}
