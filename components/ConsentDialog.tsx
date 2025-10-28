'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { AlertCircle } from 'lucide-react'
import Link from 'next/link'

interface ConsentDialogProps {
  open: boolean
  onAccept: () => void
  storageKey: string
  title?: string
  description?: string
}

export function ConsentDialog({
  open,
  onAccept,
  storageKey,
  title = 'Terms of Service & Privacy Policy',
  description = 'Please review and accept our terms to continue',
}: ConsentDialogProps) {
  const [accepted, setAccepted] = useState(false)
  const [medicalDisclaimer, setMedicalDisclaimer] = useState(false)

  const handleAccept = () => {
    if (accepted && medicalDisclaimer) {
      localStorage.setItem(storageKey, 'true')
      localStorage.setItem(`${storageKey}_timestamp`, new Date().toISOString())
      onAccept()
    }
  }

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <AlertCircle className="h-6 w-6 text-yellow-600" />
            {title}
          </DialogTitle>
          <DialogDescription className="text-base pt-2">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Medical Disclaimer Box */}
          <div className="border-2 border-red-500 bg-red-50 dark:bg-red-950/20 rounded-lg p-4">
            <h3 className="font-bold text-red-700 dark:text-red-400 text-lg mb-2 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Important Medical Disclaimer
            </h3>
            <div className="text-sm text-red-900 dark:text-red-200 space-y-2">
              <p className="font-semibold">
                OpenMed is NOT a medical device and does NOT provide medical advice.
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>This service is for informational purposes only</li>
                <li>AI-generated content may contain errors or inaccuracies</li>
                <li>No doctor-patient relationship is created</li>
                <li>Always consult qualified healthcare professionals</li>
                <li>Never disregard medical advice because of information from this service</li>
                <li>In medical emergencies, call emergency services immediately</li>
              </ul>
            </div>
          </div>

          {/* Key Points */}
          <div className="space-y-3">
            <h3 className="font-semibold text-base">By using OpenMed, you understand that:</h3>
            <div className="space-y-2 text-sm">
              <div className="flex gap-2">
                <span className="text-muted-foreground">•</span>
                <p>
                  Your health data (genetic and bloodwork) will be stored securely and processed 
                  using AI technology (OpenAI) to provide personalized insights
                </p>
              </div>
              <div className="flex gap-2">
                <span className="text-muted-foreground">•</span>
                <p>
                  We use third-party services (OpenAI for AI analysis, Supabase for data storage) 
                  subject to their own privacy policies
                </p>
              </div>
              <div className="flex gap-2">
                <span className="text-muted-foreground">•</span>
                <p>
                  You are responsible for the accuracy of uploaded data and all medical decisions 
                  you make
                </p>
              </div>
              <div className="flex gap-2">
                <span className="text-muted-foreground">•</span>
                <p>
                  You can delete your data at any time from your profile settings
                </p>
              </div>
              <div className="flex gap-2">
                <span className="text-muted-foreground">•</span>
                <p>
                  We do not sell your personal health information to third parties
                </p>
              </div>
              <div className="flex gap-2">
                <span className="text-muted-foreground">•</span>
                <p>
                  You must be at least 18 years old to use this service
                </p>
              </div>
            </div>
          </div>

          {/* Legal Documents Links */}
          <div className="space-y-2 p-4 bg-muted rounded-lg">
            <p className="text-sm font-medium">Please review our legal documents:</p>
            <div className="flex flex-col gap-2">
              <Link
                href="/legal/terms-of-service"
                target="_blank"
                className="text-sm text-primary hover:underline flex items-center gap-1"
              >
                📄 Terms of Service (Full Document)
              </Link>
              <Link
                href="/legal/privacy-policy"
                target="_blank"
                className="text-sm text-primary hover:underline flex items-center gap-1"
              >
                🔒 Privacy Policy (Full Document)
              </Link>
            </div>
          </div>

          {/* Consent Checkboxes */}
          <div className="space-y-4 border-t pt-4">
            <div className="flex items-start space-x-3">
              <Checkbox
                id="medical-disclaimer"
                checked={medicalDisclaimer}
                onCheckedChange={(checked) => setMedicalDisclaimer(checked as boolean)}
              />
              <label
                htmlFor="medical-disclaimer"
                className="text-sm font-medium leading-relaxed cursor-pointer"
              >
                I understand that OpenMed is <span className="font-bold">NOT</span> a medical 
                device, does <span className="font-bold">NOT</span> provide medical advice, and 
                I will consult healthcare professionals for medical decisions.
              </label>
            </div>

            <div className="flex items-start space-x-3">
              <Checkbox
                id="terms-accept"
                checked={accepted}
                onCheckedChange={(checked) => setAccepted(checked as boolean)}
              />
              <label
                htmlFor="terms-accept"
                className="text-sm font-medium leading-relaxed cursor-pointer"
              >
                I have read and agree to the{' '}
                <Link href="/legal/terms-of-service" target="_blank" className="text-primary hover:underline">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link href="/legal/privacy-policy" target="_blank" className="text-primary hover:underline">
                  Privacy Policy
                </Link>
                , including the collection and processing of my health data.
              </label>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={handleAccept}
            disabled={!accepted || !medicalDisclaimer}
            className="w-full sm:w-auto"
          >
            Accept and Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Hook to check if user has consented
export function useConsent(storageKey: string) {
  const [hasConsented, setHasConsented] = useState<boolean | null>(null)

  useEffect(() => {
    const consent = localStorage.getItem(storageKey)
    setHasConsented(consent === 'true')
  }, [storageKey])

  const giveConsent = () => {
    setHasConsented(true)
  }

  return { hasConsented, giveConsent }
}
