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
    <div className="space-y-5">
      <div>
        <label htmlFor="video-upload" className="mb-2 block text-xs font-medium uppercase tracking-wider text-[#9FC1DE]">
          Video file <span className="normal-case tracking-normal text-[#7C93A8]">(mp4/webm)</span>
        </label>
        <input
          id="video-upload"
          type="file"
          accept="video/mp4,video/webm,.mp4,.webm"
          onChange={handleVideoChange}
          className="block w-full cursor-pointer overflow-hidden rounded-xl border border-[#22374A] bg-[#111E2C] text-sm text-[#7C93A8] file:mr-3 file:cursor-pointer file:border-0 file:bg-[#1C3348] file:py-2.5 file:pl-4 file:pr-3 file:text-sm file:font-medium file:text-slate-100 file:transition-colors hover:file:bg-[#244059]"
        />
      </div>

      <div>
        <label htmlFor="transcript-upload" className="mb-2 block text-xs font-medium uppercase tracking-wider text-[#9FC1DE]">
          Transcript file <span className="normal-case tracking-normal text-[#7C93A8]">(.txt)</span>
        </label>
        <input
          id="transcript-upload"
          type="file"
          accept=".txt,text/plain"
          onChange={handleTranscriptChange}
          className="block w-full cursor-pointer overflow-hidden rounded-xl border border-[#22374A] bg-[#111E2C] text-sm text-[#7C93A8] file:mr-3 file:cursor-pointer file:border-0 file:bg-[#1C3348] file:py-2.5 file:pl-4 file:pr-3 file:text-sm file:font-medium file:text-slate-100 file:transition-colors hover:file:bg-[#244059]"
        />
      </div>
    </div>
  )
}

export default FileUpload
