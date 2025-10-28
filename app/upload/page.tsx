'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/AuthContext'
import { ConsentDialog, useConsent } from '@/components/ConsentDialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { ArrowLeft, Upload, Activity, Dna, Shield, Info, Github } from 'lucide-react'
import Link from 'next/link'
import BloodworkUploader from '@/components/uploads/BloodworkUploader'
import GeneticUploader from '@/components/uploads/GeneticUploader'
import { BloodworkDialog } from '@/components/dialogs/bloodwork-dialog'
import type { ParsedBloodwork } from '@/lib/parsers/bloodwork-parser'
import type { ParsedGeneticData } from '@/lib/parsers/genetic-parser'

export default function UploadPage() {
  const { user, loading } = useAuth()
  const { hasConsented, giveConsent } = useConsent('upload-consent')
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

  // Show consent dialog if user hasn't consented
  if (hasConsented === false) {
    return (
      <>
        <ConsentDialog
          open={true}
          onAccept={giveConsent}
          storageKey="upload-consent"
          title="Data Upload - Terms & Privacy"
          description="Before uploading your health data, please review and accept our terms"
        />
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
          <div className="text-center">
            <Upload className="h-16 w-16 mx-auto mb-4 text-primary" />
            <h1 className="text-2xl font-bold mb-2">Upload Medical Data</h1>
            <p className="text-muted-foreground">Please accept the terms to continue</p>
          </div>
        </div>
      </>
    )
  }

  // Loading consent state
  if (hasConsented === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto pt-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
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

        {/* Privacy Dialog */}
        <div className="mb-8 flex gap-3">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <Info className="h-4 w-4" />
                Privacy Concerned?
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Host Locally for Complete Privacy</DialogTitle>
                <DialogDescription className="space-y-3">
                  Don't want to upload your medical data to the cloud? You can run OpenMed entirely on your own machine for complete data privacy.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="text-sm text-blue-800 font-medium mb-2">Self-hosting benefits:</div>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Complete data privacy - never leaves your device</li>
                    <li>• No usage limits or restrictions</li>
                    <li>• Full control over your medical data</li>
                    <li>• Works offline after initial setup</li>
                  </ul>
                </div>
                <Button asChild className="w-full">
                  <Link 
                    href="https://github.com/ianrowan/OpenMed" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2"
                  >
                    <Github className="h-4 w-4" />
                    View Setup Instructions on GitHub
                  </Link>
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          
          <BloodworkDialog />
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
