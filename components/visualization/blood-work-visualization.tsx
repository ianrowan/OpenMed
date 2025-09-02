'use client'

import { useState } from 'react'
import { BloodTestResult, Biomarker } from '@/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { TrendingUp, TrendingDown, Minus, AlertTriangle, ChevronDown, ChevronRight } from 'lucide-react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'

interface BloodWorkVisualizationProps {
  data: BloodTestResult
}

export function BloodWorkVisualization({ data }: BloodWorkVisualizationProps) {
  const [isOpen, setIsOpen] = useState(false)
  
  const getRangeStatus = (biomarker: Biomarker) => {
    if (!biomarker.reference_range) return 'unknown'
    
    const { min, max } = biomarker.reference_range
    if (biomarker.value < min) return 'low'
    if (biomarker.value > max) return 'high'
    return 'normal'
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'high':
        return <TrendingUp className="w-4 h-4 text-red-500" />
      case 'low':
        return <TrendingDown className="w-4 h-4 text-blue-500" />
      case 'normal':
        return <Minus className="w-4 h-4 text-green-500" />
      default:
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'high':
        return 'destructive'
      case 'low':
        return 'secondary'
      case 'normal':
        return 'default'
      default:
        return 'secondary'
    }
  }

  const formatValue = (biomarker: Biomarker) => {
    return `${biomarker.value} ${biomarker.unit}`
  }

  const formatReferenceRange = (biomarker: Biomarker) => {
    if (!biomarker.reference_range) return 'No reference range'
    const { min, max } = biomarker.reference_range
    return `${min} - ${max} ${biomarker.unit}`
  }

  // Safe check for biomarkers array
  const biomarkers = data.biomarkers || []
  
  const outOfRangeBiomarkers = biomarkers.filter(b => {
    const status = getRangeStatus(b)
    return status === 'high' || status === 'low'
  })

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                Blood Work Analysis
                <Badge variant="outline">{data.test_date}</Badge>
              </CardTitle>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </Button>
            </div>
            <CardDescription>
              {data.lab_name && `Lab: ${data.lab_name}`} • {biomarkers.length} biomarkers
              {!isOpen && outOfRangeBiomarkers.length > 0 && (
                <span className="text-red-600 font-medium"> • {outOfRangeBiomarkers.length} out of range</span>
              )}
            </CardDescription>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="space-y-6">
            {/* Summary */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {biomarkers.filter(b => getRangeStatus(b) === 'normal').length}
                </div>
                <div className="text-sm text-muted-foreground">Normal</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {biomarkers.filter(b => getRangeStatus(b) === 'high').length}
                </div>
                <div className="text-sm text-muted-foreground">High</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {biomarkers.filter(b => getRangeStatus(b) === 'low').length}
                </div>
                <div className="text-sm text-muted-foreground">Low</div>
              </div>
            </div>

            {/* Out of Range Alerts */}
            {outOfRangeBiomarkers.length > 0 && (
              <div>
                <h4 className="font-medium text-red-600 mb-3">⚠️ Values Outside Normal Range</h4>
                <div className="space-y-2">
                  {outOfRangeBiomarkers.map((biomarker) => {
                    const status = getRangeStatus(biomarker)
                    return (
                      <div key={biomarker.name} className="flex items-center justify-between p-3 border border-red-200 rounded-lg bg-red-50">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(status)}
                          <span className="font-medium">{biomarker.name}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">{formatValue(biomarker)}</div>
                          <div className="text-xs text-muted-foreground">
                            Normal: {formatReferenceRange(biomarker)}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* All Biomarkers */}
            <div>
              <h4 className="font-medium mb-3">All Results</h4>
              {biomarkers.length === 0 ? (
                <p className="text-sm text-muted-foreground">No biomarker data available.</p>
              ) : (
                <div className="space-y-2">
                  {biomarkers.map((biomarker) => {
                  const status = getRangeStatus(biomarker)
                  return (
                    <div key={biomarker.name} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(status)}
                        <span>{biomarker.name}</span>
                        <Badge variant={getStatusColor(status) as any} className="text-xs">
                          {status}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{formatValue(biomarker)}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatReferenceRange(biomarker)}
                        </div>
                      </div>
                    </div>
                  )
                })}
                </div>
              )}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
}
