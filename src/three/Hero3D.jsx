import { Component } from 'react'
import { LazyCanvas } from './LazyCanvas'
import InvoiceScene from './InvoiceScene'

/* If WebGL is unavailable, render nothing rather than breaking the page. */
class SceneBoundary extends Component {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() { return this.state.failed ? null : this.props.children }
}

export default function Hero3D({ className, compact = false, fov = 38, z = 6.2 }) {
  return (
    <SceneBoundary>
      <LazyCanvas className={className} camera={{ position: [0, 0, z], fov }}>
        <InvoiceScene compact={compact} />
      </LazyCanvas>
    </SceneBoundary>
  )
}
