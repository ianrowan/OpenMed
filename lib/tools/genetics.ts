import { GeneticData, SNP, ToolResult } from '@/types'
import { GeneticQuerySchema } from '@/types'
import { z } from 'zod'
import type { SupabaseClient } from '@/lib/supabase'

export class GeneticTool {
  private supabase: SupabaseClient | null

  constructor(supabaseClient?: SupabaseClient | null) {
    this.supabase = supabaseClient || null
  }

  async execute(params: z.infer<typeof GeneticQuerySchema>): Promise<ToolResult> {
    console.log('Executing GeneticTool with params:', params)
    try {
      // If Supabase is not configured, return mock data for demo
      if (!this.supabase) {
        return this.getMockGeneticData(params)
      }

      const userId = await this.getCurrentUserId()
      
      console.log(`Querying genetic data for user ${userId}...`)
      const { data: geneticResults, error } = await this.supabase
        .from('genetic_data')
        .select('*')
        .eq('user_id', userId)
        .order('uploaded_at', { ascending: false })
        .limit(1)
      console.log(geneticResults)
      if (error) throw error
      if (!geneticResults || geneticResults.length === 0) {
        return {
          data: null,
          summary: "No genetic data found. Please upload your 23andMe or similar genetic test results.",
          references: []
        }
      }

      // Access the data from the genetic_data table and properly type it
      type RawGeneticRecord = {
        id: string;
        user_id: string;
        source: string;
        snps: {
          variants: any[];
          metadata: any;
          riskAssessment: any;
          uploadInfo: any;
        };
        uploaded_at: string;
        created_at: string;
        updated_at: string;
      };
      
      const rawData = geneticResults[0] as unknown as RawGeneticRecord;
      console.log('Raw genetic data structure:', JSON.stringify(rawData, null, 2));
      
      // Extract the variants from the nested structure that matches the upload route format
      const uploadVariants = rawData.snps?.variants || [];
      console.log(`Found ${uploadVariants.length} variants in upload data`);
      
      // Transform variants from upload format to our internal SNP format
      const variants = uploadVariants.map((variant: any) => ({
        rsid: variant.rsid,
        chromosome: variant.chromosome,
        position: variant.position,
        genotype: variant.genotype,
        gene: variant.annotation?.geneName, // Transform geneName to gene
        annotation: variant.annotation ? {
          phenotype: variant.annotation.phenotype,
          clinical_significance: variant.annotation.clinicalSignificance, // Transform to snake_case
          disease_association: variant.annotation.phenotype, // Use phenotype as disease association for now
          drug_response: variant.annotation.drugResponse,
          risk_level: this.mapRiskLevel(variant.annotation.clinicalSignificance)
        } : undefined
      }));
      
      const geneticData: GeneticData = {
        id: rawData.id,
        user_id: rawData.user_id,
        source: rawData.source as '23andme' | 'ancestry' | 'other',
        snps: variants,
        uploaded_at: rawData.uploaded_at
      }
      let filteredSNPs = geneticData.snps
      console.log(`Initial SNPs count: ${filteredSNPs.length}`);

      // Apply filters (now using transformed SNP format)
      if (params.rsids) {
        filteredSNPs = filteredSNPs.filter(snp => 
          params.rsids!.includes(snp.rsid)
        )
        console.log(`After rsids filter: ${filteredSNPs.length}`);
      }

      if (params.genes) {
        filteredSNPs = filteredSNPs.filter(snp => 
          snp.gene && params.genes!.some(gene => 
            snp.gene!.toLowerCase().includes(gene.toLowerCase())
          )
        )
        console.log(`After genes filter: ${filteredSNPs.length}`);
      }

      if (params.phenotype && params.phenotype.toLowerCase() !== 'all') {
        filteredSNPs = filteredSNPs.filter(snp => 
          snp.annotation?.phenotype?.toLowerCase().includes(params.phenotype!.toLowerCase())
        )
        console.log(`After phenotype filter: ${filteredSNPs.length}`);
      }

      if (params.clinical_significance) {
        filteredSNPs = filteredSNPs.filter(snp => 
          snp.annotation?.clinical_significance && 
          params.clinical_significance!.includes(snp.annotation.clinical_significance)
        )
        console.log(`After clinical_significance filter: ${filteredSNPs.length}`);
      }

      console.log(`Final filtered SNPs count: ${filteredSNPs.length}`);
      const summary = this.generateGeneticSummary(filteredSNPs, params)
      const visualization = this.createGeneticVisualization(filteredSNPs)
      console.log(summary)
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

  private mapRiskLevel(clinicalSignificance?: string): 'low' | 'moderate' | 'high' {
    if (!clinicalSignificance) return 'low';
    
    switch (clinicalSignificance.toLowerCase()) {
      case 'pathogenic':
      case 'likely_pathogenic':
        return 'high';
      case 'uncertain':
      case 'uncertain_significance':
        return 'moderate';
      case 'likely_benign':
      case 'benign':
      default:
        return 'low';
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
    if (!this.supabase) {
      return 'demo-user'
    }
    
    try {
      console.log('Getting user authentication...')
      
      // Add a timeout to prevent hanging
      const authPromise = this.supabase.auth.getUser()
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Auth timeout')), 5000)
      )
      
      const { data: { user }, error } = await Promise.race([authPromise, timeoutPromise]) as any
      
      if (error) {
        console.log('Auth error, using demo user:', error)
        return 'demo-user'
      }
      
      if (!user) {
        console.log('No user found, using demo user')
        return 'demo-user'
      }
      
      console.log('User authenticated:', user.id)
      return user.id
    } catch (error) {
      console.log('Auth failed, using demo user:', error)
      return 'demo-user'
    }
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
