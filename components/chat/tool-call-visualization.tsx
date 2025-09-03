'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BloodWorkVisualization } from '@/components/visualization/blood-work-visualization'
import { GeneticVisualization } from '@/components/visualization/genetic-visualization'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CheckCircle, AlertCircle, Clock, ChevronDown, ChevronRight } from 'lucide-react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'

interface ToolCallVisualizationProps {
  toolCall: {
    toolCallId: string
    toolName: string
    args: any
    result?: any
    state: 'partial-call' | 'call' | 'result'
  }
}

export function ToolCallVisualization({ toolCall }: ToolCallVisualizationProps) {
  const [isOpen, setIsOpen] = useState(false)
  
  const getToolIcon = (toolName: string) => {
    switch (toolName) {
      case 'queryBloodWork':
        return '🩸'
      case 'queryGenetics':
        return '🧬'
      case 'searchMedicalLiterature':
        return '📚'
      default:
        return '🔧'
    }
  }

  const getToolTitle = (toolName: string) => {
    switch (toolName) {
      case 'queryBloodWork':
        return 'Blood Work Analysis'
      case 'queryGenetics':
        return 'Genetic Data Query'
      case 'searchMedicalLiterature':
        return 'Medical Literature Search'
      default:
        return 'Tool Execution'
    }
  }

  const getStatusIcon = () => {
    switch (toolCall.state) {
      case 'partial-call':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'call':
        return <Clock className="h-4 w-4 text-blue-500" />
      case 'result':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-red-500" />
    }
  }

  const getStatusText = () => {
    switch (toolCall.state) {
      case 'partial-call':
        return 'Preparing...'
      case 'call':
        return 'Executing...'
      case 'result':
        return 'Complete'
      default:
        return 'Error'
    }
  }

  return (
    <div className="tool-execution my-4">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="pb-3 cursor-pointer hover:bg-accent/50 transition-colors">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <span>{getToolIcon(toolCall.toolName)}</span>
                  {getToolTitle(toolCall.toolName)}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant={toolCall.state === 'result' ? 'default' : 'secondary'} className="flex items-center gap-1">
                    {getStatusIcon()}
                    {getStatusText()}
                  </Badge>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              {toolCall.args && !isOpen && (
                <CardDescription>
                  Query: {JSON.stringify(toolCall.args, null, 2).substring(0, 100)}
                  {JSON.stringify(toolCall.args).length > 100 && '...'}
                </CardDescription>
              )}
            </CardHeader>
          </CollapsibleTrigger>
          
          <CollapsibleContent>
            {toolCall.args && (
              <div className="px-6 pb-3 border-t">
                <details className="text-sm text-muted-foreground">
                  <summary className="cursor-pointer text-xs font-medium hover:text-foreground transition-colors">
                    Query Parameters
                  </summary>
                  <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-x-auto border">
                    {JSON.stringify(toolCall.args, null, 2)}
                  </pre>
                </details>
              </div>
            )}
            
            {toolCall.result && toolCall.state === 'result' && (
              <CardContent>
                {toolCall.toolName === 'queryBloodWork' && (
                  toolCall.result.data?.blood_test_results && toolCall.result.data.blood_test_results.length > 0 ? (
                    <BloodWorkVisualization data={toolCall.result.data.blood_test_results[0]} />
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      {toolCall.result.summary || 'No blood work data available'}
                    </div>
                  )
                )}
                {toolCall.toolName === 'queryGenetics' && (
                  toolCall.result.data && !toolCall.result.data.genetic_data ? (
                    <GeneticVisualization data={toolCall.result.data} />
                  ) : toolCall.result.data?.genetic_data ? (
                    <GeneticVisualization data={toolCall.result.data.genetic_data} />
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      {toolCall.result.summary || 'No genetic data available'}
                    </div>
                  )
                )}
                {toolCall.toolName === 'searchMedicalLiterature' && (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      {toolCall.result.summary}
                    </p>
                    {toolCall.result.references && toolCall.result.references.length > 0 && (
                      <div className="space-y-1">
                        <h4 className="text-sm font-medium">References:</h4>
                        {toolCall.result.references.slice(0, 3).map((ref: any, index: number) => (
                          <div key={index} className="text-xs text-muted-foreground">
                            • {ref.title} ({ref.source})
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            )}
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </div>
  )
}
