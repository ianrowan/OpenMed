'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { AlertCircle, User, Calendar, Ruler, Weight, Heart, Pill } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface MedicalProfileForm {
  birth_date: string
  sex: 'male' | 'female' | 'other' | ''
  height: string // cm
  weight: string // kg
  allergies: string
  medications: string
  medical_conditions: string
}

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { user, updateProfile } = useAuth()
  const router = useRouter()

  const [formData, setFormData] = useState<MedicalProfileForm>({
    birth_date: '',
    sex: '',
    height: '',
    weight: '',
    allergies: '',
    medications: '',
    medical_conditions: '',
  })

  const totalSteps = 3

  const handleInputChange = (field: keyof MedicalProfileForm, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return formData.birth_date !== '' && formData.sex !== ''
      case 2:
        return formData.height !== '' && formData.weight !== ''
      case 3:
        return true // No required fields in step 3 now
      default:
        return true
    }
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps))
      setError(null)
    } else {
      setError('Please fill in all required fields')
    }
  }

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
    setError(null)
  }

  const handleSubmit = async () => {
    if (!user) {
      setError('You must be logged in to complete your profile')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const profileData = {
        birth_date: formData.birth_date,
        sex: formData.sex as 'male' | 'female' | 'other',
        height: formData.height ? parseInt(formData.height) : undefined,
        weight: formData.weight ? parseInt(formData.weight) : undefined,
        allergies: formData.allergies ? formData.allergies.split(',').map(s => s.trim()) : [],
        medications: formData.medications ? formData.medications.split(',').map(s => s.trim()) : [],
        conditions: formData.medical_conditions ? formData.medical_conditions.split(',').map(s => s.trim()) : [],
      }

      const { error } = await updateProfile(profileData)

      if (error) {
        setError(error.message)
      } else {
        router.push('/chat')
      }
    } catch (err) {
      setError('Failed to save profile. Please try again.')
    }

    setLoading(false)
  }

  const handleSkip = () => {
    router.push('/chat')
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="birth_date">Date of Birth *</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="birth_date"
                  type="date"
                  value={formData.birth_date}
                  onChange={(e) => handleInputChange('birth_date', e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sex">Sex *</Label>
              <Select 
                value={formData.sex} 
                onValueChange={(value) => handleInputChange('sex', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select your sex" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="height">Height (cm) *</Label>
              <div className="relative">
                <Ruler className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="height"
                  type="number"
                  placeholder="e.g., 175"
                  value={formData.height}
                  onChange={(e) => handleInputChange('height', e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="weight">Weight (kg) *</Label>
              <div className="relative">
                <Weight className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="weight"
                  type="number"
                  placeholder="e.g., 70"
                  value={formData.weight}
                  onChange={(e) => handleInputChange('weight', e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="allergies">Allergies (optional)</Label>
              <Textarea
                id="allergies"
                placeholder="List any allergies, separated by commas"
                value={formData.allergies}
                onChange={(e) => handleInputChange('allergies', e.target.value)}
                rows={3}
              />
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="medications">Current Medications (optional)</Label>
              <div className="relative">
                <Pill className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Textarea
                  id="medications"
                  placeholder="List current medications, separated by commas"
                  value={formData.medications}
                  onChange={(e) => handleInputChange('medications', e.target.value)}
                  className="pl-10"
                  rows={3}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="medical_conditions">Medical Conditions (optional)</Label>
              <div className="relative">
                <Heart className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Textarea
                  id="medical_conditions"
                  placeholder="List any medical conditions, separated by commas"
                  value={formData.medical_conditions}
                  onChange={(e) => handleInputChange('medical_conditions', e.target.value)}
                  className="pl-10"
                  rows={3}
                />
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl mx-auto pt-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Complete Your Profile</h1>
          <p className="mt-2 text-sm text-gray-600">
            Help us personalize your OpenMed experience
          </p>
        </div>

        {/* Progress indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                    step <= currentStep
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {step}
                </div>
                {step < totalSteps && (
                  <div
                    className={`w-16 h-1 mx-2 ${
                      step < currentStep ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              Step {currentStep} of {totalSteps}
            </CardTitle>
            <CardDescription>
              {currentStep === 1 && "Let's start with your basic information"}
              {currentStep === 2 && "Physical measurements and allergies"}
              {currentStep === 3 && "Medical history and current medications"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {renderStep()}

            <div className="flex justify-between pt-6">
              <div>
                {currentStep > 1 && (
                  <Button variant="outline" onClick={handlePrevious}>
                    Previous
                  </Button>
                )}
              </div>

              <div className="space-x-2">
                <Button variant="ghost" onClick={handleSkip}>
                  Skip for now
                </Button>
                {currentStep < totalSteps ? (
                  <Button onClick={handleNext}>
                    Next
                  </Button>
                ) : (
                  <Button onClick={handleSubmit} disabled={loading}>
                    {loading ? 'Saving...' : 'Complete Profile'}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
