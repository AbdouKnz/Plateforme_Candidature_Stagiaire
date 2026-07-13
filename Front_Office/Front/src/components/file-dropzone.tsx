

import * as React from "react"
import { FileTextIcon, UploadIcon, XIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface FileDropzoneProps {
  id: string
  value?: File | null
  onChange: (file: File | null) => void
  onBlur?: () => void
  invalid?: boolean
  describedBy?: string
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function FileDropzone({
  id,
  value,
  onChange,
  onBlur,
  invalid,
  describedBy,
}: FileDropzoneProps) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = React.useState(false)

  const openPicker = () => inputRef.current?.click()

  const handleFiles = (files: FileList | null) => {
    const file = files?.[0]
    if (file) onChange(file)
    onBlur?.()
  }

  if (value) {
    return (
      <div
        className={cn(
          "flex items-center gap-4 rounded-xl border bg-card p-3.5 shadow-xs transition-all",
          invalid ? "border-destructive/60" : "border-border",
        )}
      >
        <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/[0.08] text-primary">
          <FileTextIcon className="size-5" />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="truncate text-sm font-medium text-foreground">
            {value.name}
          </span>
          <span className="text-xs text-muted-foreground">
            {formatBytes(value.size)} &middot; PDF
          </span>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Remove file"
          onClick={() => {
            onChange(null)
            if (inputRef.current) inputRef.current.value = ""
            onBlur?.()
          }}
          className="size-8 shrink-0 text-muted-foreground hover:text-destructive"
        >
          <XIcon className="size-4" />
        </Button>
        <input
          ref={inputRef}
          id={id}
          type="file"
          accept="application/pdf"
          className="sr-only"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>
    )
  }

  return (
    <div
      role="button"
      tabIndex={0}
      aria-describedby={describedBy}
      onClick={openPicker}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          openPicker()
        }
      }}
      onDragOver={(e) => {
        e.preventDefault()
        setIsDragging(true)
      }}
      onDragLeave={(e) => {
        e.preventDefault()
        setIsDragging(false)
      }}
      onDrop={(e) => {
        e.preventDefault()
        setIsDragging(false)
        handleFiles(e.dataTransfer.files)
      }}
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-4 py-9 text-center outline-none transition-all duration-200",
        "hover:border-primary/50 hover:bg-primary/[0.02]",
        "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30",
        isDragging && "border-primary bg-primary/[0.04]",
        invalid ? "border-destructive/60" : "border-border",
      )}
    >
      <div className="flex size-12 items-center justify-center rounded-full bg-primary/[0.08] text-primary transition-colors group-hover:bg-primary/[0.12]">
        <UploadIcon className="size-5" />
      </div>
      <div className="flex flex-col gap-0.5">
        <p className="text-sm font-medium text-foreground">
          {isDragging ? "Drop your file here" : "Click to upload or drag & drop"}
        </p>
        <p className="text-xs text-muted-foreground">PDF only &middot; up to 8MB</p>
      </div>
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept="application/pdf"
        className="sr-only"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  )
}
