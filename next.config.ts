import type { NextConfig } from 'next'
// eslint-disable-next-line @typescript-eslint/no-require-imports
const withPWA = require('next-pwa')({
  dest:            'public',
  register:        true,
  skipWaiting:     true,
  disable:         process.env.NODE_ENV === 'development',
  runtimeCaching:  [],
})

const nextConfig: NextConfig = {
  /* config options here */

  turbopack: {
    // Leaving this empty tells Next.js you acknowledge Turbopack is active
  },
}

module.exports = withPWA(nextConfig)