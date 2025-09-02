'use client'

import { useState, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Upload, File, Check, X, AlertCircle } from 'lucide-react'

interface FileUploadProps {
  onUploadComplete: () => void
}

export function FileUpload({ onUploadComplete }: FileUploadProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<Record<string, 'pending' | 'uploading' | 'success' | 'error'>>({})

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files) {
      const newFiles = Array.from(files)
      setSelectedFiles(prev => [...prev, ...newFiles])
      
      // Initialize status for new files
      const newStatus: Record<string, 'pending'> = {}
      newFiles.forEach(file => {
        newStatus[file.name] = 'pending'
      })
      setUploadStatus(prev => ({ ...prev, ...newStatus }))
    }
  }, [])

  const removeFile = useCallback((fileName: string) => {
    setSelectedFiles(prev => prev.filter(file => file.name !== fileName))
    setUploadStatus(prev => {
      const { [fileName]: removed, ...rest } = prev
      return rest
    })
  }, [])

  const uploadFiles = async () => {
    if (selectedFiles.length === 0) return

    setUploading(true)

    for (const file of selectedFiles) {
      try {
        setUploadStatus(prev => ({ ...prev, [file.name]: 'uploading' }))

        // Simulate file upload and processing
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        // Mock successful upload
        setUploadStatus(prev => ({ ...prev, [file.name]: 'success' }))
        
      } catch (error) {
        setUploadStatus(prev => ({ ...prev, [file.name]: 'error' }))
      }
    }

    setUploading(false)
    
    // Auto-close after successful uploads
    const allSuccess = Object.values(uploadStatus).every(status => status === 'success')
    if (allSuccess) {
      setTimeout(() => {
        onUploadComplete()
      }, 1000)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <File className="w-4 h-4 text-muted-foreground" />
      case 'uploading':
        return <Upload className="w-4 h-4 text-blue-500 animate-spin" />
      case 'success':
        return <Check className="w-4 h-4 text-green-500" />
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />
      default:
        return <File className="w-4 h-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'secondary'
      case 'uploading':
        return 'default'
      case 'success':
        return 'default'
      case 'error':
        return 'destructive'
      default:
        return 'secondary'
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Medical Data</CardTitle>
        <CardDescription>
          Upload blood work results, genetic test data (23andMe raw data), or other medical reports.
          Supported formats: PDF, CSV, TXT
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
          <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Drag and drop files here, or click to browse
            </p>
            <Input
              type="file"
              multiple
              accept=".pdf,.csv,.txt,.tsv"
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
            />
            <Button variant="outline" asChild>
              <label htmlFor="file-upload" className="cursor-pointer">
                Browse Files
              </label>
            </Button>
          </div>
        </div>

        {selectedFiles.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Selected Files:</h4>
            {selectedFiles.map((file) => (
              <div key={file.name} className="flex items-center justify-between p-2 border rounded">
                <div className="flex items-center gap-2">
                  {getStatusIcon(uploadStatus[file.name] || 'pending')}
                  <span className="text-sm">{file.name}</span>
                  <Badge variant={getStatusColor(uploadStatus[file.name] || 'pending') as any}>
                    {uploadStatus[file.name] || 'pending'}
                  </Badge>
                </div>
                {!uploading && uploadStatus[file.name] !== 'success' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(file.name)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}

            <div className="flex gap-2 pt-2">
              <Button onClick={uploadFiles} disabled={uploading}>
                {uploading ? 'Uploading...' : 'Upload Files'}
              </Button>
              <Button variant="outline" onClick={() => setSelectedFiles([])}>
                Clear All
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
