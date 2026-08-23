import { useEffect, useImperativeHandle, useRef } from 'react'
import type { Ref } from 'react'
import { defineCustomElements } from 'pose-viewer/loader'

export interface PoseViewerElement extends HTMLElement {
  src: string
  width: string
  height: string
  padding: string
  playbackRate: number
  currentTime: number
  duration: number
  paused: boolean
  ended: boolean
  loop: boolean
  autoplay: boolean
  play(): Promise<void>
  pause(): Promise<void>
  getPose(): Promise<{ body: { fps: number } }>
}

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'pose-viewer': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & { renderer?: 'canvas' | 'svg' | 'interactive' },
        HTMLElement
      >
    }
  }
}

let definitionPromise: Promise<void> | null = null

function ensurePoseViewerDefined(): Promise<void> {
  if (!definitionPromise) {
    definitionPromise = Promise.resolve(defineCustomElements())
  }
  return definitionPromise
}

export interface SignAvatarHandle {
  play: () => void
  pause: () => void
}

interface SignAvatarProps {
  src: string | null
  durationMs: number | null
  startAtMs?: number
  loop?: boolean
  playing?: boolean
  className?: string
  ref?: Ref<SignAvatarHandle>
}

const RATE_WARN_MIN = 0.25
const RATE_WARN_MAX = 8

// One fixed framing for every segment, derived once from the 2–98th percentile
// bounding boxes of a sample of sign-mt ASL poses (512×512 coordinate space):
// union bbox x[67.7, 371.6] y[72.2, 540.0] → figure w=0.594 h=0.914 center (0.429, 0.598).
// Scaled to fill 92% of the panel and recentered; identical for all segments.
const FIXED_FIT = { txPct: 6.8, tyPct: -10.2, scale: 1.007 }

function SignAvatar({ src, durationMs, startAtMs = 0, loop = false, playing = false, className = 'block aspect-square h-full', ref }: SignAvatarProps) {
  const elementRef = useRef<PoseViewerElement>(null)
  const targetMsRef = useRef(durationMs)
  targetMsRef.current = durationMs
  const startAtMsRef = useRef(startAtMs)
  startAtMsRef.current = startAtMs
  const playingRef = useRef(playing)
  playingRef.current = playing

  useImperativeHandle(
    ref,
    () => ({
      play() {
        void elementRef.current?.play()
      },
      pause() {
        void elementRef.current?.pause()
      },
    }),
    []
  )

  useEffect(() => {
    let cancelled = false
    const el = elementRef.current
    if (!el || !src) return

    ensurePoseViewerDefined().then(() => {
      if (cancelled) return
      el.autoplay = false
      el.loop = loop
      el.width = '100%'
      el.height = '100%'
      el.padding = '0%'
      el.style.transformOrigin = '0 0'
      el.style.transform = `translate(${FIXED_FIT.txPct}%, ${FIXED_FIT.tyPct}%) scale(${FIXED_FIT.scale})`

      const applyRateAndPlay = () => {
        if (cancelled) return
        const nativeDurationSec = el.duration
        const targetMs = targetMsRef.current
        let rate = 1
        const hasTiming =
          Number.isFinite(nativeDurationSec) && nativeDurationSec > 0 && !!targetMs && targetMs > 0
        if (hasTiming) {
          rate = nativeDurationSec / (targetMs / 1000)
          if (rate < RATE_WARN_MIN || rate > RATE_WARN_MAX) {
            console.warn(
              `[SignAvatar] rate ${rate.toFixed(3)}x is outside the pleasant ${RATE_WARN_MIN}-${RATE_WARN_MAX}x range (native ${(nativeDurationSec).toFixed(2)}s vs segment ${(targetMs / 1000).toFixed(2)}s) — playback stays exact but may look fast/slow`
            )
          }
          const startMs = Math.min(Math.max(startAtMsRef.current, 0), targetMs)
          el.playbackRate = rate
          el.currentTime = nativeDurationSec * (startMs / targetMs)
          console.info(
            `[SignAvatar] native=${nativeDurationSec.toFixed(3)}s target=${(targetMs / 1000).toFixed(3)}s rate=${rate.toFixed(4)} start@${(startMs / 1000).toFixed(3)}s → fills segment in ${((nativeDurationSec - nativeDurationSec * (startMs / targetMs)) / rate).toFixed(3)}s`
          )
        } else {
          el.playbackRate = rate
        }
        if (playingRef.current) {
          void el.play()
        }
      }

      el.addEventListener('loadedmetadata$', applyRateAndPlay, { once: true })
      el.src = src
      if (Number.isFinite(el.duration) && el.duration > 0) {
        applyRateAndPlay()
      }

      return () => undefined
    })

    return () => {
      cancelled = true
    }
  }, [src, loop])

  useEffect(() => {
    const el = elementRef.current
    if (!el || !src || !durationMs || durationMs <= 0) return
    if (!Number.isFinite(el.duration) || el.duration <= 0) return
    el.playbackRate = el.duration / (durationMs / 1000)
  }, [durationMs, src])

  useEffect(() => {
    const el = elementRef.current
    if (!el || !src || !Number.isFinite(el.duration) || el.duration <= 0) return
    if (playing) {
      void el.play()
    } else {
      void el.pause()
    }
  }, [playing, src])

  if (!src) {
    return (
      <div className="flex aspect-video w-full items-center justify-center rounded-lg border border-dashed border-slate-700 bg-slate-800/50 text-sm text-slate-500">
        Sign avatar appears here
      </div>
    )
  }

  return (
    <pose-viewer
      ref={elementRef}
      renderer="canvas"
      className={className}
    />
  )
}

export default SignAvatar
