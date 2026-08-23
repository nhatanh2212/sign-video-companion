import { useEffect, useImperativeHandle, useRef } from 'react'
import type { Ref } from 'react'

export interface VideoPlayerHandle {
  seekTo: (seconds: number) => void
  play: () => void
  pause: () => void
  subscribe: (listener: (seconds: number) => void) => () => void
}

interface VideoPlayerProps {
  src: string | null
  ref?: Ref<VideoPlayerHandle>
  onTimeUpdate?: (seconds: number) => void
  onLoadedMetadata?: (durationSeconds: number) => void
  onPlay?: () => void
  onPause?: () => void
}

function VideoPlayer({ src, ref, onTimeUpdate, onLoadedMetadata, onPlay, onPause }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const listenersRef = useRef(new Set<(seconds: number) => void>())
  const onTimeUpdateRef = useRef(onTimeUpdate)
  const onLoadedMetadataRef = useRef(onLoadedMetadata)
  const onPlayRef = useRef(onPlay)
  const onPauseRef = useRef(onPause)

  onTimeUpdateRef.current = onTimeUpdate
  onLoadedMetadataRef.current = onLoadedMetadata
  onPlayRef.current = onPlay
  onPauseRef.current = onPause

  useImperativeHandle(
    ref,
    () => ({
      seekTo(seconds: number) {
        const video = videoRef.current
        if (!video) return
        video.currentTime = seconds
      },
      play() {
        void videoRef.current?.play()
      },
      pause() {
        videoRef.current?.pause()
      },
      subscribe(listener: (seconds: number) => void) {
        listenersRef.current.add(listener)
        return () => {
          listenersRef.current.delete(listener)
        }
      },
    }),
    []
  )

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleTimeUpdate = () => {
      for (const listener of listenersRef.current) {
        listener(video.currentTime)
      }
      onTimeUpdateRef.current?.(video.currentTime)
    }
    const handleLoadedMetadata = () => {
      if (Number.isFinite(video.duration)) {
        onLoadedMetadataRef.current?.(video.duration)
      }
    }
    const handlePlay = () => {
      onPlayRef.current?.()
    }
    const handlePause = () => {
      onPauseRef.current?.()
    }

    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('loadedmetadata', handleLoadedMetadata)
    video.addEventListener('play', handlePlay)
    video.addEventListener('pause', handlePause)
    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('loadedmetadata', handleLoadedMetadata)
      video.removeEventListener('play', handlePlay)
      video.removeEventListener('pause', handlePause)
    }
  }, [src])

  if (!src) {
    return (
      <div className="flex aspect-video w-full items-center justify-center rounded-lg border border-dashed border-slate-700 bg-slate-800/50 text-sm text-slate-500">
        Upload a video to preview it here
      </div>
    )
  }

  return (
    <video
      ref={videoRef}
      src={src}
      controls
      preload="metadata"
      className="aspect-video w-full rounded-lg bg-black"
    />
  )
}

export default VideoPlayer
