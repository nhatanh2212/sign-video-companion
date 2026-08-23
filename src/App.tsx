import { useEffect, useRef, useState } from 'react'
import FileUpload from './components/FileUpload'
import VideoPlayer from './components/VideoPlayer'
import TranscriptSignPlayer from './components/TranscriptSignPlayer'
import type { TranscriptSegment } from './components/TranscriptSignPlayer'
import { parseTranscript } from './lib/transcript'
import { translateToSign } from './lib/signTranslate'

type Phase = 'upload' | 'generating' | 'player'

const SEGMENT_DELAY_MS = 300

function App() {
  const [phase, setPhase] = useState<Phase>('upload')
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [videoDurationMs, setVideoDurationMs] = useState<number | null>(null)
  const [transcriptText, setTranscriptText] = useState('')
  const [segments, setSegments] = useState<TranscriptSegment[]>([])
  const [completedCount, setCompletedCount] = useState(0)
  const [failedCount, setFailedCount] = useState(0)

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
      try {
        const result = await translateToSign(enriched[i].text)
        if (!(result?.data instanceof Blob)) {
          throw new Error(`Unexpected response shape (${result?.contentType ?? typeof result?.data})`)
        }
        enriched[i].poseUrl = URL.createObjectURL(result.data)
        enriched[i].status = 'done'
      } catch (error) {
        enriched[i].status = 'failed'
        enriched[i].errorMessage = error instanceof Error ? error.message : String(error)
        failures++
        console.error(`[App] Segment ${i + 1} failed:`, error)
      }
      setSegments([...enriched])
      setCompletedCount(i + 1)
      setFailedCount(failures)
      if (i < enriched.length - 1) {
        await new Promise(resolve => setTimeout(resolve, SEGMENT_DELAY_MS))
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

  function handleBackToUpload() {
    for (const segment of segmentsRef.current) {
      if (segment.poseUrl) URL.revokeObjectURL(segment.poseUrl)
    }
    setSegments([])
    setPhase('upload')
  }

  return (
    <main className="flex min-h-screen flex-col bg-slate-950 px-4 py-10 text-slate-100 sm:px-6 lg:px-8">
      <div className="flex w-full flex-1 justify-center">
        <div className="w-full max-w-7xl space-y-8">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl sm:p-8">
          <h1 className="mb-2 text-2xl font-semibold tracking-tight">Sign Video Companion</h1>
          <p className="mb-8 text-sm text-slate-400">
            Upload a video and a plain-text transcript to play a synced sign-language avatar alongside it.
          </p>

          {phase === 'upload' && (
            <div className="space-y-6">
              <div className="mx-auto w-full max-w-xl space-y-6">
                <FileUpload onVideoSelect={setVideoUrl} onTranscriptSelect={setTranscriptText} />
                <button
                  type="button"
                  disabled={!canGenerate}
                  onClick={handleGenerate}
                  className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white enabled:cursor-pointer enabled:hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Generate translations
                </button>
                <p className="text-xs text-slate-500">
                  {canGenerate
                    ? `Ready: ${transcriptText.trim().split(/\r?\n/).filter(Boolean).length} transcript lines detected.`
                    : 'Select both a video and a transcript to continue. Waiting for video metadata…'}
                </p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900 p-3">
                <VideoPlayer src={videoUrl} onLoadedMetadata={s => setVideoDurationMs(s * 1000)} />
              </div>
            </div>
          )}

          {phase === 'generating' && (
            <div className="space-y-4">
              <p className="text-sm font-medium text-slate-200">
                Translating {Math.min(completedCount + 1, segments.length)} / {segments.length} segments…
              </p>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-indigo-500 transition-all duration-300"
                  style={{ width: `${segments.length ? (completedCount / segments.length) * 100 : 0}%` }}
                />
              </div>
              <p className="text-xs text-slate-500">
                {completedCount} done
                {failedCount > 0 && <span className="text-red-400"> · {failedCount} failed</span>} · one at a time with
                a {SEGMENT_DELAY_MS}ms pause between calls
              </p>
            </div>
          )}

          {phase === 'player' && videoUrl && (
            <TranscriptSignPlayer videoUrl={videoUrl} segments={segments} onBack={handleBackToUpload} />
          )}
        </div>
      </div>
      </div>

      <footer className="mt-10 text-center text-xs text-slate-600">
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
  )
}

export default App
