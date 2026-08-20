// eslint-config-next v16 ships flat config directly — no FlatCompat shim needed.
import coreWebVitals from 'eslint-config-next/core-web-vitals'
import typescript from 'eslint-config-next/typescript'

const config = [
  ...coreWebVitals,
  ...typescript,
  { ignores: ['node_modules/**', '.next/**', 'out/**', 'build/**', 'next-env.d.ts'] },
]

export default config
