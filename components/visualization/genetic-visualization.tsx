'use client'

import { useState } from 'react'
import { GeneticData, SNP } from '@/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dna, AlertTriangle, Shield, Info, ChevronDown, ChevronRight } from 'lucide-react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'

interface GeneticVisualizationProps {
  data: GeneticData
}

export function GeneticVisualization({ data }: GeneticVisualizationProps) {
  const [isOpen, setIsOpen] = useState(false)
  
  const getClinicalSignificance = (snp: SNP) => {
    if (!snp.annotation?.clinical_significance) return 'unknown'
    return snp.annotation.clinical_significance
  }

  const getSignificanceIcon = (significance: string) => {
    switch (significance) {
      case 'pathogenic':
      case 'likely_pathogenic':
        return <AlertTriangle className="w-4 h-4 text-red-500" />
      case 'benign':
      case 'likely_benign':
        return <Shield className="w-4 h-4 text-green-500" />
      case 'uncertain_significance':
        return <Info className="w-4 h-4 text-yellow-500" />
      default:
        return <Info className="w-4 h-4 text-gray-500" />
    }
  }

  const getSignificanceColor = (significance: string) => {
    switch (significance) {
      case 'pathogenic':
      case 'likely_pathogenic':
        return 'destructive'
      case 'benign':
      case 'likely_benign':
        return 'default'
      case 'uncertain_significance':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  const formatGenotype = (snp: SNP) => {
    return snp.genotype || 'Unknown'
  }

  const clinicallySignificantSNPs = data.snps.filter(snp => 
    snp.annotation?.clinical_significance && 
    ['pathogenic', 'likely_pathogenic', 'uncertain_significance'].includes(snp.annotation.clinical_significance)
  )

  const pharmacogenomicSNPs = data.snps.filter(snp => 
    snp.annotation?.drug_response
  )

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Dna className="w-5 h-5" />
                Genetic Analysis
                <Badge variant="outline">{data.source}</Badge>
              </CardTitle>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </Button>
            </div>
            <CardDescription>
              {data.snps.length} SNPs analyzed • Uploaded {new Date(data.uploaded_at).toLocaleDateString()}
              {!isOpen && clinicallySignificantSNPs.length > 0 && (
                <span className="text-red-600 font-medium"> • {clinicallySignificantSNPs.length} significant variants</span>
              )}
            </CardDescription>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="space-y-6">
            {/* Summary */}
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {data.snps.length}
                </div>
                <div className="text-sm text-muted-foreground">Total SNPs</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {data.snps.filter(snp => 
                    snp.annotation?.clinical_significance === 'pathogenic' || 
                    snp.annotation?.clinical_significance === 'likely_pathogenic'
                  ).length}
                </div>
                <div className="text-sm text-muted-foreground">High Risk</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {data.snps.filter(snp => 
                    snp.annotation?.clinical_significance === 'uncertain_significance'
                  ).length}
                </div>
                <div className="text-sm text-muted-foreground">Uncertain</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {pharmacogenomicSNPs.length}
                </div>
                <div className="text-sm text-muted-foreground">Drug Response</div>
              </div>
            </div>

            {/* Clinically Significant SNPs */}
            {clinicallySignificantSNPs.length > 0 && (
              <div>
                <h4 className="font-medium text-red-600 mb-3">🧬 Clinically Significant Variants</h4>
                <div className="space-y-2">
                  {clinicallySignificantSNPs.slice(0, 5).map((snp) => {
                    const significance = getClinicalSignificance(snp)
                    return (
                      <div key={snp.rsid} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-2">
                          {getSignificanceIcon(significance)}
                          <div>
                            <span className="font-medium">{snp.rsid}</span>
                            {snp.gene && <span className="text-sm text-muted-foreground ml-2">({snp.gene})</span>}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">{formatGenotype(snp)}</div>
                          <Badge variant={getSignificanceColor(significance) as any} className="text-xs">
                            {significance?.replace('_', ' ')}
                          </Badge>
                        </div>
                      </div>
                    )
                  })}
                  {clinicallySignificantSNPs.length > 5 && (
                    <p className="text-sm text-muted-foreground text-center">
                      +{clinicallySignificantSNPs.length - 5} more variants
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Pharmacogenomics */}
            {pharmacogenomicSNPs.length > 0 && (
              <div>
                <h4 className="font-medium text-purple-600 mb-3">💊 Drug Response Variants</h4>
                <div className="space-y-2">
                  {pharmacogenomicSNPs.slice(0, 5).map((snp) => (
                    <div key={snp.rsid} className="flex items-center justify-between p-3 border rounded-lg bg-purple-50">
                      <div className="flex items-center gap-2">
                        <Dna className="w-4 h-4 text-purple-500" />
                        <div>
                          <span className="font-medium">{snp.rsid}</span>
                          {snp.gene && <span className="text-sm text-muted-foreground ml-2">({snp.gene})</span>}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{formatGenotype(snp)}</div>
                        <div className="text-xs text-muted-foreground">
                          {snp.annotation?.drug_response && `Drug: ${snp.annotation.drug_response}`}
                        </div>
                      </div>
                    </div>
                  ))}
                  {pharmacogenomicSNPs.length > 5 && (
                    <p className="text-sm text-muted-foreground text-center">
                      +{pharmacogenomicSNPs.length - 5} more drug response variants
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Sample SNPs (showing a few common ones) */}
            <div>
              <h4 className="font-medium mb-3">Sample Variants</h4>
              <div className="space-y-2">
                {data.snps.slice(0, 8).map((snp) => {
                  const significance = getClinicalSignificance(snp)
                  return (
                    <div key={snp.rsid} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex items-center gap-2">
                        {getSignificanceIcon(significance)}
                        <span>{snp.rsid}</span>
                        {snp.gene && (
                          <Badge variant="outline" className="text-xs">
                            {snp.gene}
                          </Badge>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{formatGenotype(snp)}</div>
                        {snp.chromosome && (
                          <div className="text-xs text-muted-foreground">
                            Chr {snp.chromosome}:{snp.position}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
                {data.snps.length > 8 && (
                  <p className="text-sm text-muted-foreground text-center">
                    +{data.snps.length - 8} more variants (showing first 8)
                  </p>
                )}
              </div>
            </div>

            {/* Disclaimer */}
            <div className="p-3 border border-yellow-200 rounded bg-yellow-50">
              <p className="text-xs text-yellow-800">
                <strong>Disclaimer:</strong> This genetic analysis is for informational purposes only. 
                Results should be interpreted by a healthcare professional or genetic counselor. 
                Do not make medical decisions based solely on this information.
              </p>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
}
