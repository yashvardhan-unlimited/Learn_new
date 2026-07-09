import { useEffect, useRef } from 'react'

interface Star { x: number; y: number; radius: number; phase: number; tint: number }

export function InteractiveStarfield() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const element = canvasRef.current
    if (!element) return
    const drawingContext = element.getContext('2d')
    if (!drawingContext) return
    const canvas: HTMLCanvasElement = element
    const context: CanvasRenderingContext2D = drawingContext
    const pointer = { x: -1000, y: -1000 }
    let stars: Star[] = []
    let frame = 0
    let width = 0
    let height = 0
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    function resize() {
      const scale = Math.min(window.devicePixelRatio || 1, 1.5)
      width = window.innerWidth; height = window.innerHeight
      canvas.width = width * scale; canvas.height = height * scale
      canvas.style.width = `${width}px`; canvas.style.height = `${height}px`
      context.setTransform(scale, 0, 0, scale, 0, 0)
      let seed = 7417
      const random = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646
      const count = Math.min(240, Math.max(100, Math.floor(width * height / 7500)))
      stars = Array.from({ length: count }, () => ({ x: random() * width, y: random() * height, radius: 0.45 + random() * 1.25, phase: random() * Math.PI * 2, tint: random() }))
    }
    function draw(time: number) {
      context.clearRect(0, 0, width, height)
      for (const star of stars) {
        const distance = Math.hypot(star.x - pointer.x, star.y - pointer.y)
        const proximity = Math.max(0, 1 - distance / 170)
        const wave = Math.sin(time * (0.0008 + star.tint * 0.0012) + star.phase)
        const twinkle = reducedMotion ? 0.58 : 0.5 + wave * wave * 0.24
        const brightness = Math.min(1, twinkle + proximity * 0.62)
        const radius = Math.min(1.55, star.radius * (1 + proximity * 0.08))
        context.beginPath(); context.arc(star.x, star.y, radius, 0, Math.PI * 2)
        context.fillStyle = star.tint > 0.72 ? `rgba(196,181,253,${brightness})` : star.tint > 0.42 ? `rgba(147,197,253,${brightness})` : `rgba(255,255,255,${brightness})`
        context.shadowBlur = 1.5 + brightness * 2.5 + proximity * 3; context.shadowColor = star.tint > 0.55 ? '#c4b5fd' : '#bfdbfe'; context.fill()
      }
      context.shadowBlur = 0
      frame = requestAnimationFrame(draw)
    }
    const move = (event: PointerEvent) => { pointer.x = event.clientX; pointer.y = event.clientY }
    const leave = () => { pointer.x = -1000; pointer.y = -1000 }
    resize(); window.addEventListener('resize', resize); window.addEventListener('pointermove', move); document.documentElement.addEventListener('pointerleave', leave)
    frame = requestAnimationFrame(draw)
    return () => { cancelAnimationFrame(frame); window.removeEventListener('resize', resize); window.removeEventListener('pointermove', move); document.documentElement.removeEventListener('pointerleave', leave) }
  }, [])

  return <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none fixed inset-0 z-[1]" />
}
