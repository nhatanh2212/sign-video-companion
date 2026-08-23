import type { ChangeEvent } from 'react'

interface FileUploadProps {
  onVideoSelect: (url: string) => void
  onTranscriptSelect: (text: string) => void
}

function FileUpload({ onVideoSelect, onTranscriptSelect }: FileUploadProps) {
  function handleVideoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    onVideoSelect(URL.createObjectURL(file))
  }

  async function handleTranscriptChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    onTranscriptSelect(await file.text())
  }

  return (
    <div className="space-y-6">
      <div>
        <label htmlFor="video-upload" className="mb-2 block text-sm font-medium text-slate-200">
          Video file <span className="text-slate-500">(mp4/webm)</span>
        </label>
        <input
          id="video-upload"
          type="file"
          accept="video/mp4,video/webm,.mp4,.webm"
          onChange={handleVideoChange}
          className="block w-full cursor-pointer rounded-lg border border-slate-700 bg-slate-800 text-sm text-slate-300 file:mr-4 file:cursor-pointer file:rounded-l-lg file:border-0 file:bg-slate-700 file:px-4 file:py-2 file:text-sm file:font-medium file:text-slate-100 hover:file:bg-slate-600"
        />
      </div>

      <div>
        <label htmlFor="transcript-upload" className="mb-2 block text-sm font-medium text-slate-200">
          Transcript file <span className="text-slate-500">(.txt)</span>
        </label>
        <input
          id="transcript-upload"
          type="file"
          accept=".txt,text/plain"
          onChange={handleTranscriptChange}
          className="block w-full cursor-pointer rounded-lg border border-slate-700 bg-slate-800 text-sm text-slate-300 file:mr-4 file:cursor-pointer file:rounded-l-lg file:border-0 file:bg-slate-700 file:px-4 file:py-2 file:text-sm file:font-medium file:text-slate-100 hover:file:bg-slate-600"
        />
      </div>
    </div>
  )
}

export default FileUpload
