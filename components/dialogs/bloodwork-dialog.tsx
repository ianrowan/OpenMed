"use client"

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { TestTube, ExternalLink, Heart } from 'lucide-react'
import Link from 'next/link'

interface BloodworkDialogProps {
  triggerText?: string
  triggerVariant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  triggerSize?: "default" | "sm" | "lg" | "icon"
  className?: string
}

export function BloodworkDialog({ 
  triggerText = "Need Bloodwork?", 
  triggerVariant = "outline",
  triggerSize = "sm",
  className 
}: BloodworkDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button 
          variant={triggerVariant} 
          size={triggerSize} 
          className={`flex items-center gap-2 ${className || ''}`}
        >
          <TestTube className="h-4 w-4" />
          {triggerText}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-red-500" />
            Get Comprehensive Bloodwork
          </DialogTitle>
          <DialogDescription>
            Need comprehensive lab testing to analyze your health data? We recommend Function Health for detailed biomarker analysis.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="bg-green-50 p-3 rounded-lg">
            <div className="text-sm text-green-800 font-medium mb-2">Function Health offers:</div>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• 100+ biomarkers in one comprehensive test</li>
              <li>• Quarterly testing to track trends over time</li>
              <li>• Doctor-reviewed results and insights</li>
              <li>• Perfect data format for OpenMed analysis</li>
              <li>• Membership includes multiple tests per year</li>
            </ul>
          </div>
          <div className="text-xs text-muted-foreground bg-blue-50 p-2 rounded">
            💡 <strong>Tip:</strong> Function Health's comprehensive data exports work perfectly with OpenMed for detailed health insights and trend analysis.
          </div>
          <Button asChild className="w-full">
            <Link 
              href="https://my.functionhealth.com/signup?code=IROWAN11&_saasquatch=IROWAN11" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Get Bloodwork with Function Health
            </Link>
          </Button>
          <div className="text-xs text-center text-muted-foreground">
            Using referral code IROWAN11 supports OpenMed development
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
