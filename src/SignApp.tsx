import { useEffect, useRef, useState } from 'react'
import FileUpload from './components/FileUpload'
import VideoPlayer from './components/VideoPlayer'
import TranscriptSignPlayer from './components/TranscriptSignPlayer'
import type { TranscriptSegment } from './components/TranscriptSignPlayer'
import { parseTranscript } from './lib/transcript'
import { translateToSign } from './lib/signTranslate'
import { processPoseBlob } from './lib/poseProcess'

type Phase = 'upload' | 'generating' | 'player'

const SEGMENT_DELAY_MS = 300
const MAX_ATTEMPTS = 3
const RETRY_DELAYS_MS = [500, 1000]

function sleep(ms: number) {
  return new Promise<void>(resolve => setTimeout(resolve, ms))
}

interface TranslateSuccess {
  ok: true
  blob: Blob
}

interface TranslateFailure {
  ok: false
  error: unknown
}

async function translateSegmentWithRetry(
  text: string,
  onRetryStart?: (attempt: number) => void
): Promise<TranslateSuccess | TranslateFailure> {
  let lastError: unknown
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    if (attempt > 0) {
      onRetryStart?.(attempt)
      await sleep(RETRY_DELAYS_MS[attempt - 1])
    }
    try {
      const result = await translateToSign(text)
      if (!(result?.data instanceof Blob)) {
        throw new Error(`Unexpected response shape (${result?.contentType ?? typeof result?.data})`)
      }
      return { ok: true, blob: result.data }
    } catch (error) {
      lastError = error
      console.warn(`[App] "${text}" attempt ${attempt + 1}/${MAX_ATTEMPTS} failed:`, error)
    }
  }
  return { ok: false, error: lastError }
}

function SignApp() {
  const [phase, setPhase] = useState<Phase>('upload')
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [videoDurationMs, setVideoDurationMs] = useState<number | null>(null)
  const [transcriptText, setTranscriptText] = useState('')
  const [segments, setSegments] = useState<TranscriptSegment[]>([])
  const [completedCount, setCompletedCount] = useState(0)
  const [failedCount, setFailedCount] = useState(0)
  const [isRetrying, setIsRetrying] = useState(false)
  const [isManualRetry, setIsManualRetry] = useState(false)
  const [manualRetryDone, setManualRetryDone] = useState(0)
  const [manualRetryTotal, setManualRetryTotal] = useState(0)

  const segmentsRef = useRef<TranscriptSegment[]>([])
  segmentsRef.current = segments

  useEffect(() => {
    return () => {
      if (videoUrl) URL.revokeObjectURL(videoUrl)
      for (const segment of segmentsRef.current) {
        if (segment.poseUrl) URL.revokeObjectURL(segment.poseUrl)
      }
    }
  }, [videoUrl])

  const canGenerate = Boolean(videoUrl && videoDurationMs !== null && transcriptText.trim())

  async function handleGenerate() {
    if (!canGenerate || !videoDurationMs) return

    const parsed = parseTranscript(transcriptText, videoDurationMs) as {
      text: string
      offsetMs: number
      endMs: number
    }[]

    if (parsed.length === 0) {
      console.error('[App] Transcript produced zero segments — check the file format.')
      return
    }

    console.log(`[App] Parsed ${parsed.length} transcript segments:`, parsed)

    const enriched: TranscriptSegment[] = parsed.map(segment => ({
      ...segment,
      status: 'pending',
      poseUrl: null,
    }))
    setSegments(enriched)
    setCompletedCount(0)
    setFailedCount(0)
    setPhase('generating')

    let failures = 0
    for (let i = 0; i < enriched.length; i++) {
      setIsRetrying(false)
      const outcome = await translateSegmentWithRetry(enriched[i].text, () => setIsRetrying(true))
      setIsRetrying(false)
      if (outcome.ok) {
        enriched[i].poseUrl = URL.createObjectURL(await processPoseBlob(outcome.blob))
        enriched[i].status = 'done'
      } else {
        enriched[i].status = 'failed'
        enriched[i].errorMessage =
          outcome.error instanceof Error ? outcome.error.message : String(outcome.error)
        failures++
        console.error(`[App] Segment ${i + 1} failed after ${MAX_ATTEMPTS} attempts:`, outcome.error)
      }
      setSegments([...enriched])
      setCompletedCount(i + 1)
      setFailedCount(failures)
      if (i < enriched.length - 1) {
        await sleep(SEGMENT_DELAY_MS)
      }
    }

    if (failures > 0) {
      console.warn(
        `[App] ${failures}/${enriched.length} segments failed to translate:`,
        enriched.filter(s => s.status === 'failed').map(s => ({ text: s.text, offsetMs: s.offsetMs }))
      )
    }

    setPhase('player')
  }

  async function handleRetryFailed() {
    if (isManualRetry) return
    const failedIndexes = segmentsRef.current
      .map((segment, index) => (segment.status === 'failed' ? index : -1))
      .filter(index => index !== -1)
    if (failedIndexes.length === 0) return

    setIsManualRetry(true)
    setManualRetryDone(0)
    setManualRetryTotal(failedIndexes.length)

    let stillFailed = 0
    for (const [done, index] of failedIndexes.entries()) {
      const segment = segmentsRef.current[index]
      segment.status = 'pending'
      segment.errorMessage = undefined
      setSegments([...segmentsRef.current])

      const outcome = await translateSegmentWithRetry(segment.text, () => setIsRetrying(true))
      setIsRetrying(false)
      if (outcome.ok) {
        segment.poseUrl = URL.createObjectURL(await processPoseBlob(outcome.blob))
        segment.status = 'done'
      } else {
        segment.status = 'failed'
        segment.errorMessage =
          outcome.error instanceof Error ? outcome.error.message : String(outcome.error)
        stillFailed++
        console.error(`[App] Manual retry failed for "${segment.text}":`, outcome.error)
      }
      setSegments([...segmentsRef.current])
      setFailedCount(segmentsRef.current.filter(s => s.status === 'failed').length)
      setManualRetryDone(done + 1)
      if (done < failedIndexes.length - 1) {
        await sleep(SEGMENT_DELAY_MS)
      }
    }

    console.log(`[App] Manual retry finished: ${failedIndexes.length - stillFailed}/${failedIndexes.length} recovered`)
    setIsManualRetry(false)
  }

  function handleBackToUpload() {
    for (const segment of segmentsRef.current) {
      if (segment.poseUrl) URL.revokeObjectURL(segment.poseUrl)
    }
    setSegments([])
    setPhase('upload')
  }

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-[#0A121C] text-slate-100">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 80% 10%, rgba(59,125,216,0.28) 0%, rgba(6,11,18,0) 60%)',
        }}
        aria-hidden="true"
      />
      <a
        href="/"
        className="absolute left-5 top-5 z-10 inline-flex items-center gap-2 text-[13px] font-medium text-[#C7DCEC] transition-colors hover:text-white"
      >
        <span aria-hidden="true">‹</span> Sign Video Companion
      </a>

      <main className="relative flex flex-1 flex-col px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex w-full flex-1 justify-center">
          <div className="mt-16 w-full max-w-7xl space-y-8">
            {phase === 'upload' && (
              <div className="space-y-6">
                <div className="mx-auto w-full max-w-xl space-y-8">
                  <div className="space-y-2">
                    <h1 className="font-serif text-[27px] font-medium italic leading-snug text-slate-50">
                      Bring your video to life.
                    </h1>
                    <p className="text-[13px] text-[#7C93A8]">
                      Upload a video and its transcript to get started.
                    </p>
                  </div>

                  <FileUpload onVideoSelect={setVideoUrl} onTranscriptSelect={setTranscriptText} />

                  <button
                    type="button"
                    disabled={!canGenerate}
                    onClick={handleGenerate}
                    className="w-full rounded-full bg-[#EAF3FA] px-4 py-2.5 text-sm font-medium text-[#0B1F30] enabled:cursor-pointer enabled:hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Generate translations
                  </button>
                  <p className="text-center text-xs text-[#7C93A8]">
                    {canGenerate
                      ? `Ready: ${transcriptText.trim().split(/\r?\n/).filter(Boolean).length} transcript lines detected.`
                      : 'Select both files to continue.'}
                  </p>
                </div>

                <div className="mx-auto w-full max-w-3xl rounded-xl border border-[#22374A] bg-[#111E2C] p-3">
                  <VideoPlayer src={videoUrl} onLoadedMetadata={s => setVideoDurationMs(s * 1000)} />
                </div>
              </div>
            )}

            {phase === 'generating' && (
              <div className="mx-auto w-full max-w-xl space-y-4">
                <p className="text-sm font-medium text-slate-200">
                  Translating {Math.min(completedCount + 1, segments.length)} / {segments.length} segments
                  {isRetrying && <span className="text-amber-400"> (retrying)…</span>}
                  {!isRetrying && '…'}
                </p>
                <div className="h-2 w-full overflow-hidden rounded-full bg-[#111E2C]">
                  <div
                    className="h-full rounded-full bg-[#3E7FC4] transition-all duration-300"
                    style={{ width: `${segments.length ? (completedCount / segments.length) * 100 : 0}%` }}
                  />
                </div>
                <p className="text-xs text-[#7C93A8]">
                  {completedCount} / {segments.length} segments
                  {failedCount > 0 && (
                    <>
                      {' '}
                      · <span className="text-[#E08A8A]">{failedCount} failed</span>
                    </>
                  )}
                  {isRetrying && <span className="text-[#E0C08A]"> · retrying</span>}
                </p>
              </div>
            )}

            {phase === 'player' && videoUrl && (
              <TranscriptSignPlayer
                videoUrl={videoUrl}
                segments={segments}
                onBack={handleBackToUpload}
                onRetryFailed={handleRetryFailed}
                manualRetryInProgress={isManualRetry}
                manualRetryDone={manualRetryDone}
                manualRetryTotal={manualRetryTotal}
              />
            )}
          </div>
        </div>

        <footer className="relative mt-10 text-center text-xs text-slate-600">
          Sign language translation powered by{' '}
          <a
            href="https://rylo.com/sign/translate/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-slate-700 underline-offset-2 transition-colors hover:text-slate-400"
          >
            Rylo Translate
          </a>{' '}
          (sign.mt) — CC BY-NC-SA 4.0
        </footer>
      </main>
    </div>
  )
}

export default SignApp
