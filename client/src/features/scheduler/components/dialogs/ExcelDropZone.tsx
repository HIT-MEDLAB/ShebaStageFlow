import { useCallback, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FileSpreadsheet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ExcelDropZoneProps {
  onFileSelected: (file: File) => void
  accept?: string
}

const ACCEPTED_EXTENSIONS = ['.xlsx', '.xls']

function isValidExcelFile(file: File): boolean {
  const name = file.name.toLowerCase()
  return ACCEPTED_EXTENSIONS.some((ext) => name.endsWith(ext))
}

export function ExcelDropZone({
  onFileSelected,
  accept = '.xlsx,.xls',
}: ExcelDropZoneProps) {
  const { t } = useTranslation('scheduler')
  const [isDragOver, setIsDragOver] = useState(false)
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragOver(false)

      const file = e.dataTransfer.files[0]
      if (file && isValidExcelFile(file)) {
        setSelectedFileName(file.name)
        onFileSelected(file)
      }
    },
    [onFileSelected],
  )

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file && isValidExcelFile(file)) {
        setSelectedFileName(file.name)
        onFileSelected(file)
      }
      // Reset so the same file can be re-selected
      e.target.value = ''
    },
    [onFileSelected],
  )

  const handleBrowseClick = useCallback(() => {
    inputRef.current?.click()
  }, [])

  return (
    <div
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-8 transition-colors',
        isDragOver
          ? 'border-primary bg-primary/5'
          : 'border-muted-foreground/30 hover:border-muted-foreground/50',
        selectedFileName && 'border-green-500 bg-green-50 dark:bg-green-950/20',
      )}
    >
      <FileSpreadsheet
        className={cn(
          'size-10',
          selectedFileName
            ? 'text-green-600 dark:text-green-400'
            : 'text-muted-foreground',
        )}
      />

      {selectedFileName ? (
        <p className="text-sm font-medium text-green-700 dark:text-green-300">
          {selectedFileName}
        </p>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            {t('dialogs.import.dragDrop')}
          </p>
          <p className="text-xs text-muted-foreground">
            {t('dialogs.import.or')}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleBrowseClick}
          >
            {t('dialogs.import.browse')}
          </Button>
          <p className="text-xs text-muted-foreground">
            {t('dialogs.import.fileTypes')}
          </p>
        </>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleInputChange}
        className="hidden"
      />
    </div>
  )
}
