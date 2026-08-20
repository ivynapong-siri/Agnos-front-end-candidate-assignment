import type { NextConfig } from 'next'
import { DEFAULT_LOCALE } from './src/i18n/config'

const nextConfig: NextConfig = {
  // Every page lives under /:locale, so bare "/" has to land somewhere.
  // Imported rather than hardcoded so it cannot drift from the constant.
  async redirects() {
    return [{ source: '/', destination: `/${DEFAULT_LOCALE}`, permanent: false }]
  },
}

export default nextConfig
