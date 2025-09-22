'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Upload, FileText, CheckCircle, AlertCircle, XCircle, Activity, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { useAuth } from '@/lib/auth/AuthContext'
import { parseBloodworkCSV, validateBloodworkFile, type ParsedBloodwork, type ProcessedBiomarker } from '@/lib/parsers/bloodwork-parser'
import { Analytics } from '@/lib/analytics'

interface BloodworkUploaderProps {
  onUploadComplete?: (data: ParsedBloodwork) => void
}

export default function BloodworkUploader({ onUploadComplete }: BloodworkUploaderProps) {
  const { user } = useAuth()
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [parsedData, setParsedData] = useState<ParsedBloodwork | null>(null)

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    setError(null)
    setUploading(true)
    setUploadProgress(0)

    try {
      // Validate file
      setUploadProgress(20)
      const content = await validateBloodworkFile(file)

      // Parse data
      setUploadProgress(50)
      const parsedBloodwork = parseBloodworkCSV(content)
      setParsedData(parsedBloodwork)

      // Upload to server
      setUploadProgress(75)
      const response = await fetch('/api/upload/bloodwork', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: parsedBloodwork,
          fileName: file.name,
          fileSize: file.size,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Upload failed')
      }

      setUploadProgress(100)
      setSuccess(true)
      
      // Track successful bloodwork upload
      Analytics.dataUpload('bloodwork')
      
      onUploadComplete?.(parsedBloodwork)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }, [onUploadComplete])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
    },
    maxFiles: 1,
    disabled: uploading,
  })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'high':
        return <TrendingUp className="h-4 w-4 text-red-500" />
      case 'low':
        return <TrendingDown className="h-4 w-4 text-blue-500" />
      case 'critical':
        return <AlertCircle className="h-4 w-4 text-red-600" />
      default:
        return <Minus className="h-4 w-4 text-green-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'high':
        return 'bg-red-100 text-red-800'
      case 'low':
        return 'bg-blue-100 text-blue-800'
      case 'critical':
        return 'bg-red-100 text-red-900'
      default:
        return 'bg-green-100 text-green-800'
    }
  }

  if (!user) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Please sign in to upload bloodwork data.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Upload Bloodwork Results
          </CardTitle>
          <CardDescription>
            Upload your lab results in CSV format. We'll analyze your biomarkers and provide insights.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!success && (
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragActive
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              } ${uploading ? 'pointer-events-none opacity-50' : ''}`}
            >
              <input {...getInputProps()} />
              <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              {isDragActive ? (
                <p className="text-blue-600">Drop your CSV file here...</p>
              ) : (
                <div>
                  <p className="text-gray-600 mb-2">
                    Drag & drop your bloodwork CSV file here, or click to select
                  </p>
                  <p className="text-sm text-gray-500">
                    Supports CSV files up to 5MB
                  </p>
                </div>
              )}
            </div>
          )}

          {uploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} />
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-500 text-green-700">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Bloodwork data uploaded successfully!
              </AlertDescription>
            </Alert>
          )}

          {parsedData && (
            <div className="space-y-4 border-t pt-4">
              <h3 className="font-semibold text-lg">Analysis Summary</h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {parsedData.metadata.totalCount}
                  </div>
                  <div className="text-sm text-gray-600">Total Biomarkers</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {parsedData.metadata.abnormalCount}
                  </div>
                  <div className="text-sm text-gray-600">Outside Range</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {parsedData.metadata.criticalCount}
                  </div>
                  <div className="text-sm text-gray-600">Critical Values</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-medium text-gray-700">
                    {parsedData.metadata.testDate}
                  </div>
                  <div className="text-sm text-gray-600">Test Date</div>
                </div>
              </div>

              {parsedData.metadata.criticalCount > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {parsedData.metadata.criticalCount} biomarker(s) show critical values that may require immediate medical attention.
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <h4 className="font-medium">Biomarker Summary</h4>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {parsedData.biomarkers.map((biomarker, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 border rounded"
                    >
                      <div className="flex items-center gap-2">
                        {getStatusIcon(biomarker.status)}
                        <span className="font-medium">{biomarker.biomarker}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">
                          {biomarker.value} {biomarker.unit}
                        </span>
                        <Badge className={getStatusColor(biomarker.status)}>
                          {biomarker.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
