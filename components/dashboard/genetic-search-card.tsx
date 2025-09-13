'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Dna, 
  Search, 
  AlertTriangle, 
  Shield, 
  Info, 
  Upload,
  Loader2,
  FileText
} from 'lucide-react'
import Link from 'next/link'

interface GeneticVariant {
  rsid: string
  genotype: string
  source: string | null
  hasData: boolean
  annotation: {
    geneName?: string
    phenotype?: string
    clinical_significance?: string
    drugResponse?: string
    frequency?: number
    riskAllele?: string
    interpretation?: string
  }
}

export default function GeneticSearchCard() {
  const [searchQuery, setSearchQuery] = useState('')
  const [variants, setVariants] = useState<GeneticVariant[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searched, setSearched] = useState(false)

  const debounceSearch = useCallback(
    debounce(async (query: string) => {
      if (query.length < 2) {
        setVariants([])
        setSearched(false)
        return
      }

      setLoading(true)
      setError(null)
      
      try {
        const response = await fetch(`/api/genetic-search?query=${encodeURIComponent(query)}`)
        if (response.ok) {
          const data = await response.json()
          setVariants(data.variants || [])
          setSearched(true)
        } else {
          setError('Failed to search genetic variants')
        }
      } catch (err) {
        setError('Error searching genetic variants')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }, 300),
    []
  )

  useEffect(() => {
    debounceSearch(searchQuery)
  }, [searchQuery, debounceSearch])

  const getSignificanceIcon = (significance?: string) => {
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

  const getSignificanceColor = (significance?: string) => {
    switch (significance) {
      case 'pathogenic':
      case 'likely_pathogenic':
        return 'bg-red-100 text-red-800'
      case 'benign':
      case 'likely_benign':
        return 'bg-green-100 text-green-800'
      case 'uncertain_significance':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getGenotypeColor = (hasData: boolean, genotype: string) => {
    if (!hasData) return 'bg-gray-100 text-gray-600'
    if (genotype === 'Not available') return 'bg-gray-100 text-gray-600'
    return 'bg-blue-100 text-blue-800'
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Dna className="h-5 w-5" />
          <span>Genetic Variant Search</span>
        </CardTitle>
        <CardDescription>
          Search your genetic data by rsID or gene name
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search rsID (e.g., rs1065852) or gene name (e.g., CYP2D6)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            <span className="ml-2 text-sm text-gray-600">Searching...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* No Results */}
        {searched && !loading && variants.length === 0 && !error && (
          <div className="text-center py-6">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">No variants found for "{searchQuery}"</p>
            <p className="text-sm text-gray-400">
              Try searching for rsIDs like "rs1065852" or gene names like "CYP2D6"
            </p>
          </div>
        )}

        {/* Results */}
        {variants.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm">
              Found {variants.length} variant{variants.length !== 1 ? 's' : ''}
            </h4>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {variants.map((variant, index) => (
                <div
                  key={index}
                  className={`border rounded-lg p-4 space-y-3 ${
                    variant.hasData ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  {/* Header with rsID and gene */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-medium text-blue-600">
                        {variant.rsid}
                      </span>
                      {variant.annotation.geneName && (
                        <Badge variant="secondary">
                          {variant.annotation.geneName}
                        </Badge>
                      )}
                    </div>
                    <Badge className={getGenotypeColor(variant.hasData, variant.genotype)}>
                      {variant.genotype}
                    </Badge>
                  </div>

                  {/* Clinical significance and phenotype */}
                  <div className="space-y-2">
                    {variant.annotation.clinical_significance && (
                      <div className="flex items-center gap-2">
                        {getSignificanceIcon(variant.annotation.clinical_significance)}
                        <Badge className={getSignificanceColor(variant.annotation.clinical_significance)}>
                          {variant.annotation.clinical_significance.replace('_', ' ')}
                        </Badge>
                      </div>
                    )}
                    
                    {variant.annotation.phenotype && (
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Association:</span> {variant.annotation.phenotype}
                      </p>
                    )}
                    
                    {variant.annotation.drugResponse && (
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Drug Response:</span> {variant.annotation.drugResponse}
                      </p>
                    )}
                    
                    {variant.annotation.interpretation && (
                      <p className="text-sm text-gray-600 italic">
                        {variant.annotation.interpretation}
                      </p>
                    )}

                    {/* Show when no clinical annotation is available */}
                    {variant.annotation.geneName === 'Unknown' && (
                      <div className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
                        <Info className="h-4 w-4 inline mr-2" />
                        This variant is in your genetic data but not in our clinical annotation database.
                      </div>
                    )}
                  </div>

                  {/* Data availability indicator */}
                  {!variant.hasData && (
                    <div className="text-xs text-gray-500 bg-gray-100 rounded px-2 py-1">
                      No genetic data available for this variant
                    </div>
                  )}
                  
                  {variant.hasData && variant.source && (
                    <div className="text-xs text-blue-600 bg-blue-100 rounded px-2 py-1">
                      Data from: {variant.source}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No search performed yet */}
        {!searched && !loading && searchQuery.length < 2 && (
          <div className="text-center py-8">
            <Dna className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">Search your genetic variants</p>
            <p className="text-sm text-gray-400 mb-4">
              Enter an rsID or gene name to explore your genetic data
            </p>
            <Button variant="outline" size="sm" asChild>
              <Link href="/upload" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Upload Genetic Data
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Debounce utility function
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | undefined
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}
