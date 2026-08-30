import { useEffect, useRef, useState } from 'react'
import VideoPlayer from './VideoPlayer'
import type { VideoPlayerHandle } from './VideoPlayer'
import SignAvatar from './SignAvatar'
import type { SignAvatarHandle } from './SignAvatar'

export interface TranscriptSegment {
  text: string
  offsetMs: number
  endMs: number
  status: 'pending' | 'done' | 'failed'
  poseUrl: string | null
  errorMessage?: string
}

interface TranscriptSignPlayerProps {
  videoUrl: string
  segments: TranscriptSegment[]
  onBack: () => void
  onRetryFailed?: () => void
  manualRetryInProgress?: boolean
  manualRetryDone?: number
  manualRetryTotal?: number
}

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

function TranscriptSignPlayer({
  videoUrl,
  segments,
  onBack,
  onRetryFailed,
  manualRetryInProgress = false,
  manualRetryDone = 0,
  manualRetryTotal = 0,
}: TranscriptSignPlayerProps) {
  const playerRef = useRef<VideoPlayerHandle>(null)
  const avatarRef = useRef<SignAvatarHandle>(null)
  const latestVideoTimeMsRef = useRef(0)
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const failedCount = segments.filter(segment => segment.status === 'failed').length

  useEffect(() => {
    const unsubscribe = playerRef.current?.subscribe(seconds => {
      latestVideoTimeMsRef.current = seconds * 1000
      const timeMs = seconds * 1000
      const index = segments.findIndex(segment => timeMs >= segment.offsetMs && timeMs < segment.endMs)
      setActiveIndex(index === -1 ? null : index)
    })
    return unsubscribe
  }, [segments])

  const activeSegment = activeIndex !== null ? segments[activeIndex] : null

  function playSegment(segment: TranscriptSegment) {
    playerRef.current?.seekTo(segment.offsetMs / 1000)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-xl font-medium italic text-slate-50">Transcript player</h2>
        <button
          type="button"
          onClick={onBack}
          className="rounded-lg border border-[#22374A] bg-[#111E2C] px-3 py-1.5 text-sm font-medium text-[#C7DCEC] hover:bg-[#1C3348]"
        >
          Back to upload
        </button>
      </div>

      <div className="grid items-stretch gap-6 md:grid-cols-5">
        <div className="rounded-xl border border-[#22374A] bg-[#111E2C] p-3 md:col-span-3">
          <VideoPlayer
            ref={playerRef}
            src={videoUrl}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          />
        </div>

        <div className="flex items-center justify-center overflow-hidden rounded-xl border border-[#22374A] bg-[#111E2C] p-3 md:col-span-2">
          {activeSegment?.status === 'done' && activeSegment.poseUrl ? (
            <SignAvatar
              key={`${activeSegment.offsetMs}-${activeSegment.poseUrl}`}
              ref={avatarRef}
              src={activeSegment.poseUrl}
              durationMs={activeSegment.endMs - activeSegment.offsetMs}
              startAtMs={Math.min(
                Math.max(latestVideoTimeMsRef.current - activeSegment.offsetMs, 0),
                activeSegment.endMs - activeSegment.offsetMs
              )}
              loop
              playing={isPlaying}
              className="block aspect-square w-full"
            />
          ) : activeSegment?.status === 'failed' ? (
            <div className="flex aspect-video w-full items-center justify-center rounded-lg border border-dashed border-[#7A2E2E] bg-[#2A1216]/60 px-4 text-center text-sm text-[#E08A8A]">
              Translation failed for this segment — see the transcript list for details.
            </div>
          ) : (
            <div className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-[#22374A] bg-[#0A121C]/40 px-4 text-center text-sm text-[#7C93A8]">
              <span>{isPlaying ? 'No segment at this position' : 'Press play on the video to start the sign avatar'}</span>
              <span className="text-xs">{isPlaying ? '' : 'Avatar plays at segment-matched speed once the video starts'}</span>
            </div>
          )}
        </div>
      </div>

      <p className="-mt-3 truncate text-center text-xs text-[#7C93A8]">
        {activeSegment ? `${formatTime(activeSegment.offsetMs)} – ${formatTime(activeSegment.endMs)}` : '—'}
      </p>

      {failedCount > 0 && onRetryFailed && (
        <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-2 rounded-xl border border-[#5A4A24]/60 bg-[#241F14]/40 px-4 py-3 sm:flex-row sm:justify-between">
          <p className="text-sm text-[#E0C08A]">
            {manualRetryInProgress ? (
              <>
                Retrying failed segments… {manualRetryDone}/{manualRetryTotal} attempted
              </>
            ) : (
              <>
                {failedCount} segment{failedCount === 1 ? '' : 's'} failed to translate — you can retry just those
                without re-translating the rest.
              </>
            )}
          </p>
          <button
            type="button"
            onClick={onRetryFailed}
            disabled={manualRetryInProgress}
            className="shrink-0 rounded-lg bg-[#5A4A24] px-3 py-1.5 text-sm font-medium text-white enabled:cursor-pointer enabled:hover:bg-[#6B5930] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {manualRetryInProgress ? 'Retrying…' : `Retry failed segments (${failedCount})`}
          </button>
        </div>
      )}

      <div className="mx-auto w-full max-w-3xl space-y-2">
        <ul className="space-y-2">
          {segments.map((segment, index) => {
            const isActive = index === activeIndex
            return (
              <li key={`${segment.offsetMs}-${index}`}>
                <button
                  type="button"
                  onClick={() => playSegment(segment)}
                  className={`flex w-full items-start gap-3 rounded-lg border border-[#22374A] px-4 py-2.5 text-left text-[13px] transition-colors ${
                    isActive ? 'bg-[#1C3348]' : 'bg-[#111E2C] hover:bg-[#16283A]'
                  }`}
                >
                  <span className={`mt-0.5 shrink-0 font-mono text-[11px] ${isActive ? 'text-[#9FC1DE]' : 'text-[#7C93A8]'}`}>
                    {formatTime(segment.offsetMs)}
                  </span>
                  <span className={`flex-1 ${isActive ? 'font-medium text-white' : 'text-[#D6E1EB]'}`}>{segment.text}</span>
                  {segment.status === 'done' && (
                    <span className="shrink-0 text-xs text-[#4C8C6B]" title="Translation ready">
                      ✓
                    </span>
                  )}
                  {segment.status === 'failed' && (
                    <span className="shrink-0 text-xs font-medium text-[#E08A8A]" title={segment.errorMessage}>
                      failed
                    </span>
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}

export default TranscriptSignPlayer
