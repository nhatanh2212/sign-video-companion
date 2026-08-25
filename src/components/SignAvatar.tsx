import { useEffect, useImperativeHandle, useRef, useState } from 'react'
import type { Ref } from 'react'
import { defineCustomElements } from 'pose-viewer/loader'

export interface PoseViewerElement extends HTMLElement {
  src: string
  width: string
  height: string
  padding: string
  background: string
  playbackRate: number
  currentTime: number
  duration: number
  paused: boolean
  ended: boolean
  loop: boolean
  autoplay: boolean
  error: unknown
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

type AvatarFailure = { kind: 'parse' | 'timeout'; message: string }

const RATE_WARN_MIN = 0.25
const RATE_WARN_MAX = 8

// Framing is handled in pose data (src/lib/poseProcess.js normalizes every pose
// into a centered 80%-height box), so no transform is needed here — the canvas
// fills the panel exactly and the figure can never overflow it.
const FIXED_FIT = { txPct: 0, tyPct: 0, scale: 1 }

function SignAvatar({ src, durationMs, startAtMs = 0, loop = false, playing = false, className = 'block aspect-square w-full', ref }: SignAvatarProps) {
  const elementRef = useRef<PoseViewerElement>(null)
  const targetMsRef = useRef(durationMs)
  targetMsRef.current = durationMs
  const startAtMsRef = useRef(startAtMs)
  startAtMsRef.current = startAtMs
  const playingRef = useRef(playing)
  playingRef.current = playing
  const [failure, setFailure] = useState<AvatarFailure | null>(null)

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

    setFailure(null)

    ensurePoseViewerDefined().then(() => {
      if (cancelled) return
      el.autoplay = false
      el.loop = loop
      el.width = '100%'
      el.height = '100%'
      el.padding = '0%'
      el.background = '#ffffff'
      el.style.transformOrigin = '0 0'
      el.style.transform = `translate(${FIXED_FIT.txPct}%, ${FIXED_FIT.tyPct}%) scale(${FIXED_FIT.scale})`

      // pose-viewer emits loadedmetadata$ BEFORE assigning `duration` internally,
      // so listeners always read NaN there — poll until the duration is real instead.
      let attempts = 0
      const waitForMetadata = () => {
        if (cancelled) return
        if (el.error) {
          const message = el.error instanceof Error ? el.error.message : String(el.error)
          console.error(`[SignAvatar] pose failed to load: ${message}`)
          setFailure({ kind: 'parse', message })
          return
        }
        if (Number.isFinite(el.duration) && el.duration > 0) {
          applyRateAndPlay()
          return
        }
        if (++attempts > 100) {
          setFailure({ kind: 'timeout', message: 'pose metadata never became available' })
          return
        }
        setTimeout(waitForMetadata, 50)
      }

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

      el.src = src
      waitForMetadata()
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

  if (failure) {
    return (
      <div className="flex aspect-video w-full flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-red-900 bg-red-950/30 px-4 text-center text-sm text-red-400">
        <span>Sign avatar could not be displayed for this segment.</span>
        <span className="text-xs text-red-500">{failure.message}</span>
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
