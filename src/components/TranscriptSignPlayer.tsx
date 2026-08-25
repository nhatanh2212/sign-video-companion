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
        <h2 className="text-lg font-medium">Transcript player</h2>
        <button
          type="button"
          onClick={onBack}
          className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm font-medium text-slate-300 hover:bg-slate-800"
        >
          Back to upload
        </button>
      </div>

      <div className="grid items-stretch gap-6 md:grid-cols-5">
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-3 md:col-span-3">
          <VideoPlayer
            ref={playerRef}
            src={videoUrl}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          />
        </div>

        <div className="flex items-center justify-center overflow-hidden rounded-xl border border-slate-800 bg-white p-3 md:col-span-2">
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
            <div className="flex aspect-video w-full items-center justify-center rounded-lg border border-dashed border-red-900 bg-red-950/30 px-4 text-center text-sm text-red-400">
              Translation failed for this segment — see the transcript list for details.
            </div>
          ) : (
            <div className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-slate-700 bg-slate-800/50 px-4 text-center text-sm text-slate-500">
              <span>{isPlaying ? 'No segment at this position' : 'Press play on the video to start the sign avatar'}</span>
              <span className="text-xs">{isPlaying ? '' : 'Avatar plays at segment-matched speed once the video starts'}</span>
            </div>
          )}
        </div>
      </div>

      <p className="-mt-3 truncate text-center text-xs text-slate-500">
        {activeSegment ? `${formatTime(activeSegment.offsetMs)} – ${formatTime(activeSegment.endMs)}` : '—'}
      </p>

      {failedCount > 0 && onRetryFailed && (
        <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-2 rounded-xl border border-amber-900/60 bg-amber-950/20 px-4 py-3 sm:flex-row sm:justify-between">
          <p className="text-sm text-amber-300">
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
            className="shrink-0 rounded-lg bg-amber-600 px-3 py-1.5 text-sm font-medium text-white enabled:cursor-pointer enabled:hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {manualRetryInProgress ? 'Retrying…' : `Retry failed segments (${failedCount})`}
          </button>
        </div>
      )}

      <div className="mx-auto w-full max-w-3xl rounded-xl border border-slate-800 bg-slate-900">
        <ul className="max-h-80 divide-y divide-slate-800 overflow-y-auto">
          {segments.map((segment, index) => {
            const isActive = index === activeIndex
            return (
              <li key={`${segment.offsetMs}-${index}`}>
                <button
                  type="button"
                  onClick={() => playSegment(segment)}
                  className={`flex w-full items-start gap-3 px-4 py-2.5 text-left text-sm transition-colors ${
                    isActive ? 'bg-indigo-950/60' : 'hover:bg-slate-800/60'
                  }`}
                >
                  <span className={`mt-0.5 shrink-0 font-mono text-xs ${isActive ? 'text-indigo-300' : 'text-slate-500'}`}>
                    {formatTime(segment.offsetMs)}
                  </span>
                  <span className={`flex-1 ${isActive ? 'text-white' : 'text-slate-300'}`}>{segment.text}</span>
                  {segment.status === 'done' && (
                    <span className="shrink-0 text-xs text-emerald-500" title="Translation ready">
                      ✓
                    </span>
                  )}
                  {segment.status === 'failed' && (
                    <span className="shrink-0 text-xs font-medium text-red-400" title={segment.errorMessage}>
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
