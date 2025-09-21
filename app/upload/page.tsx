'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ArrowLeft, Upload, Activity, Dna, Shield } from 'lucide-react'
import Link from 'next/link'
import BloodworkUploader from '@/components/uploads/BloodworkUploader'
import GeneticUploader from '@/components/uploads/GeneticUploader'
import type { ParsedBloodwork } from '@/lib/parsers/bloodwork-parser'
import type { ParsedGeneticData } from '@/lib/parsers/genetic-parser'

export default function UploadPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [uploadCount, setUploadCount] = useState(0)

  const handleBloodworkUpload = (data: ParsedBloodwork) => {
    setUploadCount(prev => prev + 1)
    console.log('Bloodwork uploaded:', data.metadata)
  }

  const handleGeneticUpload = (data: ParsedGeneticData) => {
    setUploadCount(prev => prev + 1)
    console.log('Genetic data uploaded:', data.metadata)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Loading...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-4xl mx-auto pt-8">
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              Please sign in to upload your medical data.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto pt-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Upload Medical Data</h1>
            <p className="mt-2 text-gray-600">
              Upload your bloodwork results and genetic data for personalized analysis
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/chat" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Chat
            </Link>
          </Button>
        </div>

        {/* Success message */}
        {uploadCount > 0 && (
          <Alert className="mb-6 border-green-500 text-green-700">
            <Upload className="h-4 w-4" />
            <AlertDescription>
              {uploadCount} file(s) uploaded successfully! Your data is now available for analysis.
            </AlertDescription>
          </Alert>
        )}

        {/* Upload tabs */}
        <Tabs defaultValue="bloodwork" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="bloodwork" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Bloodwork Results
            </TabsTrigger>
            <TabsTrigger value="genetic" className="flex items-center gap-2">
              <Dna className="h-4 w-4" />
              Genetic Data
            </TabsTrigger>
          </TabsList>

          <TabsContent value="bloodwork" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Bloodwork & Lab Results</CardTitle>
                <CardDescription>
                  Upload your laboratory test results in CSV format. We support standard lab report formats 
                  and will automatically analyze your biomarkers for trends and abnormalities.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">Supported Format:</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• CSV files with headers: Biomarker, Value, Unit, Reference_Min, Reference_Max, Date, Lab</li>
                      <li>• Common lab formats from Quest, LabCorp, and other major laboratories</li>
                      <li>• Automatic status calculation (high/low/normal/critical)</li>
                      <li>• File size limit: 5MB</li>
                    </ul>
                  </div>
                  <BloodworkUploader onUploadComplete={handleBloodworkUpload} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="genetic" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Genetic Data</CardTitle>
                <CardDescription>
                  Upload your raw genetic data from 23andMe, AncestryDNA, or other genetic testing services. 
                  We'll analyze your variants for health insights and drug responses.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h4 className="font-medium text-purple-900 mb-2">Supported Sources:</h4>
                    <ul className="text-sm text-purple-800 space-y-1">
                      <li>• 23andMe raw data files (.txt)</li>
                      <li>• AncestryDNA raw data files (.txt)</li>
                      <li>• Other genetic testing services (.tsv, .raw)</li>
                      <li>• Automatic annotation with clinical significance</li>
                      <li>• File size limit: 100MB</li>
                    </ul>
                  </div>
                  
                  <Alert className="border-amber-200 bg-amber-50">
                    <Shield className="h-4 w-4 text-amber-600" />
                    <AlertDescription className="text-amber-800">
                      <strong>Privacy Notice:</strong> Your genetic data is encrypted and stored securely. 
                      We never share your genetic information with third parties. You can delete your data at any time.
                    </AlertDescription>
                  </Alert>

                  <GeneticUploader onUploadComplete={handleGeneticUpload} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Next steps */}
        {uploadCount > 0 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>What's Next?</CardTitle>
              <CardDescription>
                Your data has been uploaded successfully. Here's what you can do now:
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button asChild className="h-auto p-4 flex-col gap-2">
                  <Link href="/dashboard">
                    <Activity className="h-6 w-6" />
                    <div className="text-center">
                      <div className="font-medium">View Dashboard</div>
                      <div className="text-sm opacity-90">See your data overview</div>
                    </div>
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-auto p-4 flex-col gap-2">
                  <Link href="/chat">
                    <Dna className="h-6 w-6" />
                    <div className="text-center">
                      <div className="font-medium">Chat with AI</div>
                      <div className="text-sm opacity-90">Ask questions about your results</div>
                    </div>
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-auto p-4 flex-col gap-2">
                  <Link href="/profile">
                    <Shield className="h-6 w-6" />
                    <div className="text-center">
                      <div className="font-medium">Update Profile</div>
                      <div className="text-sm opacity-90">Add medical history</div>
                    </div>
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
