'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useDropzone } from 'react-dropzone'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Upload, FileText, CheckCircle, AlertCircle, XCircle, Dna, Shield, Pill, Heart } from 'lucide-react'
import { useAuth } from '@/lib/auth/AuthContext'
import { Analytics } from '@/lib/analytics'
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
  
  // Progress animation state
  const [isProcessingComplete, setIsProcessingComplete] = useState(false)
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef<number>(0)

  // Gradual progress animation over 20 seconds to 99%
  useEffect(() => {
    let progressInterval: NodeJS.Timeout

    if (uploading && !isProcessingComplete) {
      const startTime = Date.now()
      const duration = 120000 // 20 seconds
      
      // Start the animation immediately
      progressInterval = setInterval(() => {
        const elapsed = Date.now() - startTime
        
        if (elapsed < duration) {
          // Gradual progress from 1% to 99% over 20 seconds using easeOut curve
          const linearProgress = elapsed / duration // 0 to 1
          const easedProgress = 1 - Math.pow(1 - linearProgress, 3) // Cubic ease-out
          const finalProgress = Math.floor(1 + easedProgress * 98) // 1% to 99%
          
          setUploadProgress(finalProgress)
        } else {
          // Stay at 99% until processing is complete
          setUploadProgress(99)
        }
      }, 100) // Update every 100ms for smooth animation
      
      // Store the interval ref for cleanup
      progressIntervalRef.current = progressInterval
    }

    return () => {
      if (progressInterval) {
        clearInterval(progressInterval)
      }
    }
  }, [uploading, isProcessingComplete])

  // Clean up interval when component unmounts
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
      }
    }
  }, [])

  // Upload genetic data in chunks to handle large files
  const uploadGeneticDataInChunks = async (rawGenetic: any) => {
    const CHUNK_SIZE = 78000 // Reduce to 50k RSIDs per batch to prevent timeouts
    const variants = rawGenetic.variants || []
    const totalVariants = variants.length
    
    if (totalVariants === 0) {
      throw new Error('No genetic variants found in the uploaded data')
    }
    
    // Split variants into chunks
    const chunks = []
    for (let i = 0; i < totalVariants; i += CHUNK_SIZE) {
      chunks.push(variants.slice(i, i + CHUNK_SIZE))
    }
    
    console.log(`Uploading ${totalVariants} variants in ${chunks.length} chunks of max ${CHUNK_SIZE} each`)
    
    // Upload each chunk and accumulate results
    let accumulatedResult = {
      success: true,
      totalVariants: 0,
      variantsSaved: 0,
      clinicalVariantsFound: 0,
      reportGenerated: false
    }
    
    for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
      const chunk = chunks[chunkIndex]
      const chunkData = {
        variants: chunk,
        metadata: {
          ...rawGenetic.metadata,
          totalVariants: chunk.length,
          chunkIndex: chunkIndex + 1,
          totalChunks: chunks.length,
          isLastChunk: chunkIndex === chunks.length - 1
        }
      }
      
      console.log(`Uploading chunk ${chunkIndex + 1}/${chunks.length} with ${chunk.length} variants`)
      
      try {
        const response = await fetch('/api/upload/genetic', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            data: chunkData
          })
        })
        
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(`Chunk ${chunkIndex + 1} upload failed: ${errorData.error || 'Upload failed'}`)
        }
        
        const chunkResult = await response.json()
        
        // Accumulate results from each chunk
        accumulatedResult.totalVariants += chunkResult.totalVariants || 0
        accumulatedResult.variantsSaved += chunkResult.variantsSaved || 0
        accumulatedResult.clinicalVariantsFound += chunkResult.clinicalVariantsFound || 0
        
        // Mark report as generated if any chunk generated it
        if (chunkResult.reportGenerated) {
          accumulatedResult.reportGenerated = true
        }
        
        console.log(`Chunk ${chunkIndex + 1} complete:`, chunkResult)
        
      } catch (error) {
        console.error(`Error uploading chunk ${chunkIndex + 1}:`, error)
        
        // If this is not the first chunk, we should clean up any previously uploaded chunks
        if (chunkIndex > 0) {
          console.warn('Partial upload detected. Some chunks may have been uploaded successfully.')
          console.warn('You may need to re-upload the entire file to ensure data consistency.')
        }
        
        throw error
      }
    }

    console.log('All chunks uploaded successfully:', accumulatedResult)
    return accumulatedResult
  }

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    setError(null)
    setSuccess(false)
    setIsProcessingComplete(false)
    setUploading(true)
    setUploadProgress(1) // Start at 1% so progress bar appears immediately

    // Small delay to ensure React processes state updates and triggers useEffect
    await new Promise(resolve => setTimeout(resolve, 50))

    try {
      // Validate file (let progress animation run in background)
      const content = await validateGeneticFile(file)

      // Parse data for display
      const parsedGenetic = parseGeneticData(content, '23andme')
      setParsedData(parsedGenetic)

      // Parse raw data for upload (without annotations)
      const rawGenetic = parseRawGeneticData(content, '23andme')

      // Perform risk assessment for display
      const assessment = getClinicalRiskAssessment(parsedGenetic.variants)
      setRiskAssessment(assessment)

      // Upload to server with pagination - send data in chunks
      await uploadGeneticDataInChunks(rawGenetic)

      // Mark processing as complete and immediately set to 100%
      setIsProcessingComplete(true)
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
      }
      setUploadProgress(100)
      setSuccess(true)
      
      // Track successful genetic data upload
      Analytics.dataUpload('genetic')
      
      onUploadComplete?.(parsedGenetic)
    } catch (err) {
      // Clear the progress animation on error
      setIsProcessingComplete(true)
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
      }
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
