import sharp from 'sharp'
import { existsSync, mkdirSync } from 'fs'

if (!existsSync('scripts')) mkdirSync('scripts')
if (!existsSync('public'))  mkdirSync('public')

const svg = `
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" fill="#0D0C0A" rx="80"/>
  <text
    x="256" y="200"
    font-family="serif" font-size="80" font-weight="bold"
    fill="#C9A84C" text-anchor="middle"
  >FG</text>
  <text
    x="256" y="310"
    font-family="serif" font-size="36"
    fill="#8B6E2E" text-anchor="middle"
  >GOLD</text>
  <rect x="156" y="330" width="200" height="2" fill="#C9A84C" opacity="0.5"/>
  <text
    x="256" y="380"
    font-family="sans-serif" font-size="22"
    fill="#4A4236" text-anchor="middle" letter-spacing="8"
  >فاطمی</text>
</svg>
`

const svgBuffer = Buffer.from(svg)

sharp(svgBuffer)
  .resize(192, 192)
  .png()
  .toFile('public/icon-192.png')
  .then(() => console.log('✓ icon-192.png created'))

sharp(svgBuffer)
  .resize(512, 512)
  .png()
  .toFile('public/icon-512.png')
  .then(() => console.log('✓ icon-512.png created'))