import { useEffect, useRef, useState } from 'react'

interface Props {
  onLoad: (raw: string | ArrayBuffer) => void
  loading: boolean
  error: string | null
}

export function DropZone({ onLoad, loading, error }: Props) {
  const [isDragging, setIsDragging] = useState(false)
  const dragCounter = useRef(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Paste anywhere on the page
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const text = e.clipboardData?.getData('text/plain') ?? ''
      if (text.trim()) onLoad(text)
    }
    window.addEventListener('paste', onPaste)
    return () => window.removeEventListener('paste', onPaste)
  }, [onLoad])

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    dragCounter.current++
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    dragCounter.current--
    if (dragCounter.current === 0) setIsDragging(false)
  }

  const handleDragOver = (e: React.DragEvent) => e.preventDefault()

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    dragCounter.current = 0
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) file.arrayBuffer().then(onLoad)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) file.arrayBuffer().then(onLoad)
    e.target.value = ''
  }

  return (
    <div className="dropzone-page">
      <div
        className={`dropzone ${isDragging ? 'dropzone--over' : ''} ${loading ? 'dropzone--loading' : ''}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => !loading && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".eml"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />

        {loading ? (
          <p className="dropzone__hint">Parsing…</p>
        ) : (
          <>
            <div className="dropzone__icon">✉</div>
            <p className="dropzone__primary">Drop a .eml file or click to browse</p>
            <p className="dropzone__hint">You can also paste raw email source anywhere on this page</p>
            {error && <p className="dropzone__error">{error}</p>}
          </>
        )}
      </div>
    </div>
  )
}
