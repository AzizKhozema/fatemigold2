'use client'

import { useEffect, useRef } from 'react'

type Props = {
  shape: 'bangle' | 'ring' | 'bracelet' | 'earring' | 'necklace'
  karat: string
  size?: number
}

const GOLD_COLORS: Record<string, { main: string; light: string; dark: string }> = {
  '24K': { main: '#FFD700', light: '#FFE566', dark: '#CCA800' },
  '22K': { main: '#E8C97A', light: '#F0DC9A', dark: '#C9A84C' },
  '21K': { main: '#E0B84A', light: '#EAC96A', dark: '#B8922A' },
  '18K': { main: '#D4A843', light: '#DDB85A', dark: '#AA842A' },
  '14K': { main: '#C49A3C', light: '#D4AA52', dark: '#9A7820' },
  'silver': { main: '#C0C0C0', light: '#D8D8D8', dark: '#A0A0A0' },
}

export default function ThreeDViewer({ shape, karat, size = 300 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef   = useRef<number>(0)
  const angleRef  = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const colors = GOLD_COLORS[karat] ?? GOLD_COLORS['22K']
    const cx = size / 2
    const cy = size / 2

    const drawBangle = (angle: number) => {
      ctx.clearRect(0, 0, size, size)
      const rx = size * 0.32
      const ry = size * 0.13
      const thickness = size * 0.08

      const steps = 120
      for (let i = steps; i >= 0; i--) {
        const t = (i / steps) * Math.PI * 2 + angle
        const x = cx + rx * Math.cos(t)
        const y = cy + ry * Math.sin(t) + size * 0.05 * Math.sin(t * 2)
        const depth = Math.sin(t)
        const r = thickness * (0.7 + 0.3 * Math.abs(Math.cos(t)))

        const grad = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, 0, x, y, r)
        if (depth > 0) {
          grad.addColorStop(0, colors.light)
          grad.addColorStop(0.4, colors.main)
          grad.addColorStop(1, colors.dark)
        } else {
          grad.addColorStop(0, colors.dark)
          grad.addColorStop(0.6, colors.main)
          grad.addColorStop(1, colors.dark)
        }
        ctx.beginPath()
        ctx.arc(x, y, r, 0, Math.PI * 2)
        ctx.fillStyle = grad
        ctx.fill()
      }

      const shimmerGrad = ctx.createLinearGradient(cx - rx, cy, cx + rx, cy)
      shimmerGrad.addColorStop(0, 'rgba(255,255,255,0)')
      shimmerGrad.addColorStop(0.3 + 0.2 * Math.sin(angle * 2), 'rgba(255,255,255,0.15)')
      shimmerGrad.addColorStop(1, 'rgba(255,255,255,0)')
      ctx.beginPath()
      ctx.ellipse(cx, cy, rx, ry + thickness, 0, 0, Math.PI * 2)
      ctx.fillStyle = shimmerGrad
      ctx.fill()
    }

    const drawRing = (angle: number) => {
      ctx.clearRect(0, 0, size, size)
      const bandH    = size * 0.18
      const bandW    = size * 0.42
      const bandY    = cy + size * 0.05
      const stoneR   = size * 0.1

      const bandGrad = ctx.createLinearGradient(cx - bandW, bandY, cx + bandW, bandY)
      bandGrad.addColorStop(0, colors.dark)
      bandGrad.addColorStop(0.2 + 0.1 * Math.sin(angle), colors.light)
      bandGrad.addColorStop(0.5, colors.main)
      bandGrad.addColorStop(0.8 - 0.1 * Math.sin(angle), colors.light)
      bandGrad.addColorStop(1, colors.dark)

      ctx.beginPath()
      ctx.ellipse(cx, bandY, bandW, bandH, 0, 0, Math.PI)
      ctx.fillStyle = bandGrad
      ctx.fill()

      ctx.beginPath()
      ctx.rect(cx - bandW, bandY, bandW * 2, bandH * 0.6)
      ctx.fillStyle = bandGrad
      ctx.fill()

      const settingGrad = ctx.createLinearGradient(cx - stoneR * 1.5, cy - size * 0.15, cx + stoneR * 1.5, cy - size * 0.05)
      settingGrad.addColorStop(0, colors.dark)
      settingGrad.addColorStop(0.5, colors.light)
      settingGrad.addColorStop(1, colors.dark)
      ctx.beginPath()
      ctx.ellipse(cx, cy - size * 0.1, stoneR * 1.5, stoneR * 0.8, 0, 0, Math.PI * 2)
      ctx.fillStyle = settingGrad
      ctx.fill()

      const stoneGrad = ctx.createRadialGradient(cx - stoneR * 0.3, cy - size * 0.13, 0, cx, cy - size * 0.1, stoneR)
      stoneGrad.addColorStop(0, '#ffffff')
      stoneGrad.addColorStop(0.2, '#e0f0ff')
      stoneGrad.addColorStop(0.5, '#90c0ff')
      stoneGrad.addColorStop(0.8, '#4080d0')
      stoneGrad.addColorStop(1, '#204060')
      ctx.beginPath()
      ctx.arc(cx, cy - size * 0.1, stoneR, 0, Math.PI * 2)
      ctx.fillStyle = stoneGrad
      ctx.fill()

      ctx.beginPath()
      ctx.arc(cx - stoneR * 0.3, cy - size * 0.13, stoneR * 0.2, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(255,255,255,0.7)'
      ctx.fill()
    }

    const drawBracelet = (angle: number) => {
      ctx.clearRect(0, 0, size, size)
      const links   = 10
      const linkW   = size * 0.07
      const linkH   = size * 0.055
      const chainY  = cy
      const totalW  = size * 0.72
      const startX  = cx - totalW / 2

      for (let i = 0; i < links; i++) {
        const x    = startX + (i / (links - 1)) * totalW
        const wave = Math.sin(angle + i * 0.5) * size * 0.02
        const depth = Math.sin(angle * 0.5 + i * 0.3)

        const grad = ctx.createLinearGradient(x - linkW, chainY + wave - linkH, x + linkW, chainY + wave + linkH)
        grad.addColorStop(0, colors.dark)
        grad.addColorStop(0.3 + 0.1 * depth, colors.light)
        grad.addColorStop(0.7, colors.main)
        grad.addColorStop(1, colors.dark)

        ctx.beginPath()
        ctx.ellipse(x, chainY + wave, linkW, linkH, Math.PI * 0.1 * Math.sin(angle + i), 0, Math.PI * 2)
        ctx.fillStyle = grad
        ctx.fill()
        ctx.strokeStyle = colors.dark
        ctx.lineWidth = 0.5
        ctx.stroke()
      }

      const claspGrad = ctx.createLinearGradient(cx + totalW * 0.38, chainY - linkH, cx + totalW * 0.5, chainY + linkH)
      claspGrad.addColorStop(0, colors.light)
      claspGrad.addColorStop(1, colors.dark)
      ctx.beginPath()
      ctx.rect(cx + totalW * 0.38, chainY - linkH * 0.8, totalW * 0.08, linkH * 1.6)
      ctx.fillStyle = claspGrad
      ctx.fill()
    }

    const drawEarring = (angle: number) => {
      ctx.clearRect(0, 0, size, size)
      const swing = Math.sin(angle) * size * 0.03

      const leftX: number = cx - size * 0.18;
      const rightX: number = cx + size * 0.18;
      const positions: [number, number][] = [[leftX, cy], [rightX, cy]];

      positions.forEach(([ex, ey], idx) => {
        const s = idx === 0 ? -1 : 1
        const sx = ex + swing * s
        const sy = ey

        const hookGrad = ctx.createLinearGradient(sx - 8, sy - size * 0.12, sx + 8, sy)
        hookGrad.addColorStop(0, colors.light)
        hookGrad.addColorStop(1, colors.dark)
        ctx.beginPath()
        ctx.arc(sx, sy - size * 0.08, size * 0.06, Math.PI, Math.PI * 2)
        ctx.strokeStyle = colors.main
        ctx.lineWidth = size * 0.02
        ctx.stroke()

        ctx.beginPath()
        ctx.moveTo(sx, sy - size * 0.02)
        ctx.lineTo(sx, sy + size * 0.08)
        ctx.strokeStyle = colors.main
        ctx.lineWidth = size * 0.015
        ctx.stroke()

        const dropGrad = ctx.createRadialGradient(sx - size * 0.02, sy + size * 0.06, 0, sx, sy + size * 0.1, size * 0.07)
        dropGrad.addColorStop(0, colors.light)
        dropGrad.addColorStop(0.4, colors.main)
        dropGrad.addColorStop(1, colors.dark)
        ctx.beginPath()
        ctx.moveTo(sx - size * 0.055, sy + size * 0.08)
        ctx.lineTo(sx, sy + size * 0.18)
        ctx.lineTo(sx + size * 0.055, sy + size * 0.08)
        ctx.closePath()
        ctx.fillStyle = dropGrad
        ctx.fill()
      })
    }

    const drawNecklace = (angle: number) => {
      ctx.clearRect(0, 0, size, size)
      const beads  = 18
      const rx     = size * 0.36
      const ry     = size * 0.22

      for (let i = 0; i < beads; i++) {
        const t    = (i / beads) * Math.PI * 2 + angle * 0.3
        const x    = cx + rx * Math.cos(t)
        const y    = cy + ry * Math.sin(t) + size * 0.05
        const r    = size * 0.038 * (0.8 + 0.2 * Math.abs(Math.sin(t)))
        const depth = Math.sin(t)

        const grad = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, 0, x, y, r)
        if (depth > 0) {
          grad.addColorStop(0, colors.light)
          grad.addColorStop(0.5, colors.main)
          grad.addColorStop(1, colors.dark)
        } else {
          grad.addColorStop(0, colors.dark)
          grad.addColorStop(0.5, colors.main)
          grad.addColorStop(1, colors.dark)
        }
        ctx.beginPath()
        ctx.arc(x, y, r, 0, Math.PI * 2)
        ctx.fillStyle = grad
        ctx.fill()
      }

      const pendX  = cx
      const pendY  = cy + ry + size * 0.05
      const pendR  = size * 0.065
      const pendGrad = ctx.createRadialGradient(pendX - pendR * 0.3, pendY - pendR * 0.3, 0, pendX, pendY, pendR)
      pendGrad.addColorStop(0, colors.light)
      pendGrad.addColorStop(0.4, colors.main)
      pendGrad.addColorStop(1, colors.dark)
      ctx.beginPath()
      ctx.arc(pendX, pendY, pendR, 0, Math.PI * 2)
      ctx.fillStyle = pendGrad
      ctx.fill()

      const stoneGrad = ctx.createRadialGradient(pendX - pendR * 0.2, pendY - pendR * 0.2, 0, pendX, pendY, pendR * 0.7)
      stoneGrad.addColorStop(0, '#fff')
      stoneGrad.addColorStop(0.3, '#ffe0e0')
      stoneGrad.addColorStop(0.7, '#cc2244')
      stoneGrad.addColorStop(1, '#660011')
      ctx.beginPath()
      ctx.arc(pendX, pendY, pendR * 0.65, 0, Math.PI * 2)
      ctx.fillStyle = stoneGrad
      ctx.fill()
    }

    const DRAW_MAP = {
      bangle:   drawBangle,
      ring:     drawRing,
      bracelet: drawBracelet,
      earring:  drawEarring,
      necklace: drawNecklace,
    }

    const draw = DRAW_MAP[shape] ?? drawBangle
    let dragging   = false
    let lastX      = 0

    const onDown = (e: MouseEvent | TouchEvent) => {
      dragging = true
      lastX = 'touches' in e ? e.touches[0].clientX : e.clientX
    }
    const onUp = () => { dragging = false }
    const onMove = (e: MouseEvent | TouchEvent) => {
      if (!dragging) return
      const x = 'touches' in e ? e.touches[0].clientX : e.clientX
      angleRef.current += (x - lastX) * 0.02
      lastX = x
    }

    canvas.addEventListener('mousedown', onDown)
    canvas.addEventListener('mouseup', onUp)
    canvas.addEventListener('mousemove', onMove)
    canvas.addEventListener('touchstart', onDown)
    canvas.addEventListener('touchend', onUp)
    canvas.addEventListener('touchmove', onMove)

    const animate = () => {
      if (!dragging) angleRef.current += 0.008
      draw(angleRef.current)
      animRef.current = requestAnimationFrame(animate)
    }
    animate()

    return () => {
      cancelAnimationFrame(animRef.current)
      canvas.removeEventListener('mousedown', onDown)
      canvas.removeEventListener('mouseup', onUp)
      canvas.removeEventListener('mousemove', onMove)
      canvas.removeEventListener('touchstart', onDown)
      canvas.removeEventListener('touchend', onUp)
      canvas.removeEventListener('touchmove', onMove)
    }
  }, [shape, karat, size])

  return (
    <div style={{
      position: 'relative',
      width: size,
      height: size,
      background: 'radial-gradient(ellipse at 40% 35%, #2a2418, #0D0C0A)',
      borderRadius: '12px',
      overflow: 'hidden',
      cursor: 'grab',
    }}>
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        style={{ display: 'block' }}
      />
      <div style={{
        position: 'absolute', bottom: '10px', right: '12px',
        fontSize: '10px', color: 'rgba(201,168,76,0.5)',
        letterSpacing: '0.1em',
      }}>
        drag to rotate
      </div>
    </div>
  )
}