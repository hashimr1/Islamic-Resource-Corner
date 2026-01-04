'use client'

import { useState, useTransition } from 'react'
import { Download, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { incrementDownload } from './actions'
import { formatFileSize } from '@/lib/utils'

type DownloadButtonProps = {
  resourceId: string
  attachment: {
    name?: string
    url: string
    size?: string | number
    type?: string
  }
}

export function DownloadButton({ resourceId, attachment }: DownloadButtonProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const sizeValue =
    typeof attachment.size === 'number'
      ? attachment.size
      : attachment.size
      ? Number(attachment.size)
      : undefined

  const fileInfo =
    attachment.type || sizeValue
      ? [attachment.type?.toUpperCase(), sizeValue ? formatFileSize(sizeValue) : null]
          .filter(Boolean)
          .join(' • ')
      : null

  const handleClick = () => {
    setError(null)

    startTransition(async () => {
      try {
        if (!attachment.url) {
          setError('Download link is unavailable.')
          return
        }

        const result = await incrementDownload(resourceId)

        if (result?.error) {
          setError(result.error)
          return
        }

        window.open(attachment.url, '_blank', 'noopener,noreferrer')
      } catch (err) {
        console.error('Download failed', err)
        setError('Unable to start download. Please try again.')
      }
    })
  }

  return (
    <div className="space-y-2">
      <Button
        onClick={handleClick}
        disabled={isPending}
        size="lg"
        className="w-full gap-2"
      >
        {isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Download className="h-5 w-5" />}
        Download {attachment.name || 'Resource'}
      </Button>
      {fileInfo && <p className="text-xs text-muted-foreground">File: {fileInfo}</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

