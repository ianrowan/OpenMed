'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Upload, FileText, CheckCircle, AlertCircle, XCircle, Dna, Shield, Pill, Heart } from 'lucide-react'
import { useAuth } from '@/lib/auth/AuthContext'
import { 
  parseGeneticData, 
  parseRawGeneticData,
  validateGeneticFile, 
  getClinicalRiskAssessment,
  type ParsedGeneticData, 
  type AnnotatedVariant 
} from '@/lib/parsers/genetic-parser'

interface GeneticUploaderProps {
  onUploadComplete?: (data: ParsedGeneticData) => void
}

export default function GeneticUploader({ onUploadComplete }: GeneticUploaderProps) {
  const { user } = useAuth()
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [parsedData, setParsedData] = useState<ParsedGeneticData | null>(null)
  const [riskAssessment, setRiskAssessment] = useState<ReturnType<typeof getClinicalRiskAssessment> | null>(null)

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    setError(null)
    setUploading(true)
    setUploadProgress(0)

    try {
      // Validate file
      setUploadProgress(20)
      const content = await validateGeneticFile(file)

      // Parse data for display
      setUploadProgress(50)
      const parsedGenetic = parseGeneticData(content, '23andme')
      setParsedData(parsedGenetic)

      // Parse raw data for upload (without annotations)
      const rawGenetic = parseRawGeneticData(content, '23andme')

      // Perform risk assessment for display
      const assessment = getClinicalRiskAssessment(parsedGenetic.variants)
      setRiskAssessment(assessment)

      // Upload to server - send only raw data for storage
      setUploadProgress(75)
      const response = await fetch('/api/upload/genetic', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: rawGenetic, // Only raw data for storage
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Upload failed')
      }

      setUploadProgress(100)
      setSuccess(true)
      onUploadComplete?.(parsedGenetic)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }, [onUploadComplete])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/plain': ['.txt'],
      'text/tab-separated-values': ['.tsv'],
      'application/octet-stream': ['.raw'],
    },
    maxFiles: 1,
    disabled: uploading,
  })

  if (!user) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Please sign in to upload genetic data.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Dna className="h-5 w-5" />
            Upload Genetic Data
          </CardTitle>
          <CardDescription>
            Upload your 23andMe, AncestryDNA, or other genetic raw data file for personalized analysis.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!success && (
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragActive
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-300 hover:border-gray-400'
              } ${uploading ? 'pointer-events-none opacity-50' : ''}`}
            >
              <input {...getInputProps()} />
              <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              {isDragActive ? (
                <p className="text-purple-600">Drop your genetic data file here...</p>
              ) : (
                <div>
                  <p className="text-gray-600 mb-2">
                    Drag & drop your genetic raw data file here, or click to select
                  </p>
                  <p className="text-sm text-gray-500">
                    Supports .txt, .tsv, and .raw files up to 100MB
                  </p>
                </div>
              )}
            </div>
          )}

          {uploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Processing genetic data...</span>
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
                Genetic data uploaded and analyzed successfully!
              </AlertDescription>
            </Alert>
          )}

          {parsedData && riskAssessment && (
            <div className="space-y-6 border-t pt-4">
              <h3 className="font-semibold text-lg">Genetic Analysis Summary</h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {parsedData.metadata.totalVariants.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">Total Variants</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {parsedData.metadata.annotatedVariants}
                  </div>
                  <div className="text-sm text-gray-600">Annotated</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {riskAssessment.highRiskVariants.length}
                  </div>
                  <div className="text-sm text-gray-600">High Risk</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {riskAssessment.drugResponseVariants.length}
                  </div>
                  <div className="text-sm text-gray-600">Drug Response</div>
                </div>
              </div>

              {riskAssessment.highRiskVariants.length > 0 && (
                <Alert variant="destructive">
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    {riskAssessment.highRiskVariants.length} high-risk variant(s) detected. Please consult with a genetic counselor.
                  </AlertDescription>
                </Alert>
              )}

              {riskAssessment.recommendations.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium flex items-center gap-2">
                    <Heart className="h-4 w-4" />
                    Recommendations
                  </h4>
                  <div className="space-y-2">
                    {riskAssessment.recommendations.map((recommendation, index) => (
                      <Alert key={index} className="border-blue-200 bg-blue-50">
                        <AlertDescription className="text-blue-800">
                          {recommendation}
                        </AlertDescription>
                      </Alert>
                    ))}
                  </div>
                </div>
              )}

              {riskAssessment.highRiskVariants.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    High Risk Variants
                  </h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {riskAssessment.highRiskVariants.map((variant, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 border border-red-200 rounded bg-red-50"
                      >
                        <div>
                          <div className="font-medium text-red-900">{variant.rsid}</div>
                          <div className="text-sm text-red-700">
                            {variant.annotation?.geneName} - {variant.annotation?.phenotype}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-mono text-sm bg-white px-2 py-1 rounded">
                            {variant.genotype}
                          </div>
                          <Badge className="bg-red-100 text-red-800 mt-1">
                            {variant.annotation?.clinicalSignificance}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {riskAssessment.drugResponseVariants.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium flex items-center gap-2">
                    <Pill className="h-4 w-4 text-blue-500" />
                    Drug Response Variants
                  </h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {riskAssessment.drugResponseVariants.map((variant, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 border border-blue-200 rounded bg-blue-50"
                      >
                        <div>
                          <div className="font-medium text-blue-900">{variant.rsid}</div>
                          <div className="text-sm text-blue-700">
                            {variant.annotation?.geneName} - {variant.annotation?.drugResponse}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-mono text-sm bg-white px-2 py-1 rounded">
                            {variant.genotype}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="text-xs text-gray-500 p-3 bg-gray-50 rounded">
                <p><strong>Disclaimer:</strong> This analysis is for informational purposes only and should not be used as a substitute for professional medical advice. Please consult with a healthcare provider or genetic counselor to discuss these results.</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
