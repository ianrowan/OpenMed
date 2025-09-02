import { supabase } from '@/lib/supabase'
import { GeneticData, SNP, ToolResult } from '@/types'
import { GeneticQuerySchema } from '@/types'
import { z } from 'zod'

export class GeneticTool {
  async execute(params: z.infer<typeof GeneticQuerySchema>): Promise<ToolResult> {
    try {
      // If Supabase is not configured, return mock data for demo
      if (!supabase) {
        return this.getMockGeneticData(params)
      }

      const userId = await this.getCurrentUserId()
      
      const { data, error } = await supabase
        .from('medical_data')
        .select('*')
        .eq('user_id', userId)
        .eq('data_type', 'genetics')
        .order('uploaded_at', { ascending: false })
        .limit(1)

      if (error) throw error
      if (!data || data.length === 0) {
        return {
          data: null,
          summary: "No genetic data found. Please upload your 23andMe or similar genetic test results.",
          references: []
        }
      }

      const geneticData: GeneticData = data[0].data
      let filteredSNPs = geneticData.snps

      // Apply filters
      if (params.rsids) {
        filteredSNPs = filteredSNPs.filter(snp => 
          params.rsids!.includes(snp.rsid)
        )
      }

      if (params.genes) {
        filteredSNPs = filteredSNPs.filter(snp => 
          snp.gene && params.genes!.some(gene => 
            snp.gene!.toLowerCase().includes(gene.toLowerCase())
          )
        )
      }

      if (params.phenotype) {
        filteredSNPs = filteredSNPs.filter(snp => 
          snp.annotation?.phenotype?.toLowerCase().includes(params.phenotype!.toLowerCase())
        )
      }

      if (params.clinical_significance) {
        filteredSNPs = filteredSNPs.filter(snp => 
          snp.annotation?.clinical_significance && 
          params.clinical_significance!.includes(snp.annotation.clinical_significance)
        )
      }

      const summary = this.generateGeneticSummary(filteredSNPs, params)
      const visualization = this.createGeneticVisualization(filteredSNPs)

      return {
        data: {
          ...geneticData,
          snps: filteredSNPs
        },
        visualization,
        summary,
        references: this.getGeneticReferences(filteredSNPs)
      }
    } catch (error) {
      throw new Error(`Genetic data query failed: ${error}`)
    }
  }

  private getMockGeneticData(params: z.infer<typeof GeneticQuerySchema>): ToolResult {
    const mockGeneticData: GeneticData = {
      id: 'mock-genetic-1',
      user_id: 'demo-user',
      source: '23andme',
      snps: [
        {
          rsid: 'rs4988235',
          chromosome: '2',
          position: 136608646,
          genotype: 'CT',
          gene: 'LCT',
          annotation: {
            phenotype: 'Lactose tolerance',
            clinical_significance: 'benign',
            disease_association: 'Lactose intolerance',
            risk_level: 'low'
          }
        },
        {
          rsid: 'rs1801133',
          chromosome: '1',
          position: 11796321,
          genotype: 'TT',
          gene: 'MTHFR',
          annotation: {
            phenotype: 'Folate metabolism',
            clinical_significance: 'uncertain_significance',
            disease_association: 'Cardiovascular disease risk',
            risk_level: 'moderate'
          }
        }
      ],
      uploaded_at: '2024-01-15T10:00:00Z'
    }

    return {
      data: {
        genetic_data: mockGeneticData
      },
      summary: this.generateGeneticSummary(mockGeneticData.snps, params)
    }
  }

  private async getCurrentUserId(): Promise<string> {
    if (!supabase) {
      return 'demo-user'
    }
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')
    return user.id
  }

  private generateGeneticSummary(snps: SNP[], params: z.infer<typeof GeneticQuerySchema>): string {
    if (snps.length === 0) {
      return "No genetic variants found matching the specified criteria."
    }

    let summary = `Found ${snps.length} genetic variant(s).`
    
    const significantVariants = snps.filter(snp => 
      snp.annotation?.clinical_significance && 
      ['pathogenic', 'likely_pathogenic', 'risk_factor'].includes(snp.annotation.clinical_significance)
    )

    if (significantVariants.length > 0) {
      summary += ` ${significantVariants.length} variant(s) have clinical significance:`
      significantVariants.forEach(snp => {
        summary += `\n- ${snp.rsid} (${snp.gene || 'Unknown gene'}): ${snp.genotype} - ${snp.annotation?.clinical_significance}`
        if (snp.annotation?.phenotype) {
          summary += ` (${snp.annotation.phenotype})`
        }
      })
    }

    const drugResponseVariants = snps.filter(snp => snp.annotation?.drug_response)
    if (drugResponseVariants.length > 0) {
      summary += `\n\nFound ${drugResponseVariants.length} pharmacogenomic variant(s) that may affect drug response.`
    }

    return summary
  }

  private createGeneticVisualization(snps: SNP[]) {
    if (snps.length === 0) return undefined

    return {
      type: 'genetic_report' as const,
      config: {
        title: 'Genetic Variants Report',
        description: `Analysis of ${snps.length} genetic variants`,
        data_keys: ['rsid', 'gene', 'genotype', 'clinical_significance', 'phenotype']
      }
    }
  }

  private getGeneticReferences(snps: SNP[]) {
    const references = []
    
    // Add ClinVar references for variants with clinical significance
    const clinicalVariants = snps.filter(snp => snp.annotation?.clinical_significance)
    if (clinicalVariants.length > 0) {
      references.push({
        title: 'ClinVar - Clinical Significance of Human Variants',
        url: 'https://www.ncbi.nlm.nih.gov/clinvar/',
        source: 'NCBI',
        type: 'database' as const
      })
    }

    // Add PharmGKB reference for drug response variants
    const drugVariants = snps.filter(snp => snp.annotation?.drug_response)
    if (drugVariants.length > 0) {
      references.push({
        title: 'PharmGKB - Pharmacogenomics Knowledgebase',
        url: 'https://www.pharmgkb.org/',
        source: 'PharmGKB',
        type: 'database' as const
      })
    }

    return references
  }
}

// Common genetic variants database with annotations
export const COMMON_VARIANTS: Record<string, {
  gene: string
  phenotype: string
  clinical_significance?: string
  drug_response?: string
  risk_level?: 'low' | 'moderate' | 'high'
}> = {
  'rs334': {
    gene: 'HBB',
    phenotype: 'Sickle cell disease',
    clinical_significance: 'pathogenic',
    risk_level: 'high'
  },
  'rs1801133': {
    gene: 'MTHFR',
    phenotype: 'Folate metabolism',
    clinical_significance: 'risk_factor',
    risk_level: 'moderate'
  },
  'rs1805007': {
    gene: 'MC1R',
    phenotype: 'Red hair, fair skin',
    risk_level: 'low'
  },
  'rs4988235': {
    gene: 'LCT',
    phenotype: 'Lactose intolerance',
    risk_level: 'low'
  },
  'rs1229984': {
    gene: 'ADH1B',
    phenotype: 'Alcohol metabolism',
    risk_level: 'low'
  },
  'rs12913832': {
    gene: 'HERC2',
    phenotype: 'Eye color',
    risk_level: 'low'
  },
  'rs1801282': {
    gene: 'PPARG',
    phenotype: 'Type 2 diabetes risk',
    clinical_significance: 'risk_factor',
    risk_level: 'moderate'
  },
  'rs7903146': {
    gene: 'TCF7L2',
    phenotype: 'Type 2 diabetes risk',
    clinical_significance: 'risk_factor',
    risk_level: 'moderate'
  },
  'rs1333049': {
    gene: 'CDKN2A/CDKN2B',
    phenotype: 'Coronary artery disease risk',
    clinical_significance: 'risk_factor',
    risk_level: 'moderate'
  },
  'rs4977574': {
    gene: 'CDKN2A/CDKN2B',
    phenotype: 'Coronary artery disease risk',
    clinical_significance: 'risk_factor',
    risk_level: 'moderate'
  },
  // Pharmacogenomic variants
  'rs1065852': {
    gene: 'CYP2D6',
    phenotype: 'Drug metabolism',
    drug_response: 'Affects metabolism of many medications including antidepressants',
    risk_level: 'moderate'
  },
  'rs4149056': {
    gene: 'SLCO1B1',
    phenotype: 'Statin-induced myopathy',
    drug_response: 'Increased risk of muscle problems with statins',
    clinical_significance: 'risk_factor',
    risk_level: 'moderate'
  },
  'rs1051740': {
    gene: 'CYP2A6',
    phenotype: 'Nicotine metabolism',
    drug_response: 'Affects nicotine metabolism and smoking cessation treatment',
    risk_level: 'low'
  }
}

export function annotateVariant(rsid: string): SNP['annotation'] | undefined {
  const variant = COMMON_VARIANTS[rsid]
  if (!variant) return undefined

  return {
    phenotype: variant.phenotype,
    clinical_significance: variant.clinical_significance,
    drug_response: variant.drug_response,
    risk_level: variant.risk_level
  }
}
