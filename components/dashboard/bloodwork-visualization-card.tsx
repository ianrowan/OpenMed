'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Activity, 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  AlertCircle, 
  ChevronLeft, 
  ChevronRight,
  Upload,
  FileText
} from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'

interface Biomarker {
  biomarker: string
  value: number
  unit: string
  status: 'normal' | 'high' | 'low' | 'critical'
  referenceRange?: string
  referenceMin?: number | null
  referenceMax?: number | null
}

interface BloodTestResult {
  id: string
  test_date: string
  lab_name: string
  biomarkers: Biomarker[]
  uploaded_at: string
}

export default function BloodworkVisualizationCard() {
  const [bloodTests, setBloodTests] = useState<BloodTestResult[]>([])
  const [currentTestIndex, setCurrentTestIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchBloodTests()
  }, [])

  const fetchBloodTests = async () => {
    try {
      const response = await fetch('/api/blood-test-results')
      if (response.ok) {
        const data = await response.json()
        setBloodTests(data.bloodTests || [])
      } else {
        setError('Failed to fetch blood test results')
      }
    } catch (err) {
      setError('Error loading blood test results')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

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

  const currentTest = bloodTests[currentTestIndex]
  const hasPrevious = currentTestIndex > 0
  const hasNext = currentTestIndex < bloodTests.length - 1

  const navigatePrevious = () => {
    if (hasPrevious) {
      setCurrentTestIndex(currentTestIndex - 1)
    }
  }

  const navigateNext = () => {
    if (hasNext) {
      setCurrentTestIndex(currentTestIndex + 1)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5" />
            <span>Blood Work Results</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-gray-500">Loading results...</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5" />
            <span>Blood Work Results</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  if (bloodTests.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5" />
            <span>Blood Work Results</span>
          </CardTitle>
          <CardDescription>
            View and analyze your uploaded blood work results
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No blood work results uploaded yet</p>
            <Button asChild>
              <Link href="/upload" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Upload Blood Work
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const abnormalBiomarkers = currentTest?.biomarkers?.filter(b => b.status !== 'normal') || []
  const criticalBiomarkers = currentTest?.biomarkers?.filter(b => b.status === 'critical') || []

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Activity className="h-5 w-5" />
          <span>Blood Work Results</span>
        </CardTitle>
        <CardDescription>
          Analyze your lab results and track biomarker trends
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Navigation Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={navigatePrevious}
              disabled={!hasPrevious}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-gray-600">
              {currentTestIndex + 1} of {bloodTests.length}
            </span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={navigateNext}
              disabled={!hasNext}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/upload">
              <Upload className="h-4 w-4 mr-2" />
              Upload More
            </Link>
          </Button>
        </div>

        {currentTest && (
          <>
            {/* Test Info */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">
                    {format(new Date(currentTest.test_date), 'MMM d, yyyy')}
                  </span>
                </div>
                {currentTest.lab_name && (
                  <span className="text-sm text-gray-600">{currentTest.lab_name}</span>
                )}
              </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {currentTest.biomarkers?.length || 0}
                </div>
                <div className="text-sm text-gray-600">Total Tests</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {abnormalBiomarkers.length}
                </div>
                <div className="text-sm text-gray-600">Outside Range</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {criticalBiomarkers.length}
                </div>
                <div className="text-sm text-gray-600">Critical</div>
              </div>
            </div>

            {/* Critical Alert */}
            {criticalBiomarkers.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {criticalBiomarkers.length} biomarker(s) show critical values that may require medical attention.
                </AlertDescription>
              </Alert>
            )}

            {/* Biomarker List */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm">All Biomarkers ({currentTest.biomarkers?.length || 0})</h4>
              <div className="space-y-2 max-h-64 overflow-y-auto border rounded-md p-2">
                {(currentTest.biomarkers || [])
                  .sort((a, b) => {
                    // Sort abnormal values to the top
                    if (a.status !== 'normal' && b.status === 'normal') return -1
                    if (a.status === 'normal' && b.status !== 'normal') return 1
                    // Within abnormal, sort critical first
                    if (a.status === 'critical' && b.status !== 'critical') return -1
                    if (a.status !== 'critical' && b.status === 'critical') return 1
                    // Otherwise maintain original order
                    return 0
                  })
                  .map((biomarker, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 border rounded text-sm hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-2">
                        {getStatusIcon(biomarker.status)}
                        <span className="font-medium">{biomarker.biomarker}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>
                          {biomarker.value} {biomarker.unit}
                        </span>
                        <Badge className={getStatusColor(biomarker.status)}>
                          {biomarker.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                
                {(currentTest.biomarkers || []).length === 0 && (
                  <div className="text-center py-4 text-gray-500">
                    <FileText className="h-8 w-8 mx-auto mb-2" />
                    <p className="text-sm">No biomarkers available</p>
                  </div>
                )}
              </div>
            </div>

            {/* Action Button */}
            <Button className="w-full" asChild>
              <Link href="/chat">
                Discuss Results with AI
              </Link>
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  )
}
