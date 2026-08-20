import type { NextConfig } from 'next'
import { DEFAULT_LOCALE } from './src/i18n/config'

const nextConfig: NextConfig = {
  // Next 15.4+ only honours qualities named here; anything else silently falls
  // back to 75. The hero is a smooth gradient, which bands at 75.
  images: { qualities: [75, 85] },

  // Every page lives under /:locale, so bare "/" has to land somewhere.
  // Imported rather than hardcoded so it cannot drift from the constant.
  async redirects() {
    return [{ source: '/', destination: `/${DEFAULT_LOCALE}`, permanent: false }]
  },
}

export default nextConfig
