import { Component } from 'react'
import { LazyCanvas } from './LazyCanvas'
import InvoiceScene from './InvoiceScene'
import GrowthScene from './GrowthScene'

/* If WebGL is unavailable, render nothing rather than breaking the page. */
class SceneBoundary extends Component {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() { return this.state.failed ? null : this.props.children }
}

/**
 * variant="invoice" → floating 3D invoice (Login page)
 * variant="growth"  → 3D sales bar chart shaped by `values` (Dashboard)
 */
export default function Hero3D({ className, compact = false, fov = 38, z = 6.2, variant = 'invoice', values }) {
  return (
    <SceneBoundary>
      <LazyCanvas className={className} camera={{ position: [0, 0, z], fov }}>
        {variant === 'growth'
          ? <GrowthScene compact={compact} values={values} />
          : <InvoiceScene compact={compact} />}
      </LazyCanvas>
    </SceneBoundary>
  )
}
