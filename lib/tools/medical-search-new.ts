import { ToolResult } from '@/types'
import { MedicalSearchSchema } from '@/types'
import { z } from 'zod'

export class MedicalSearchTool {
  async execute(params: z.infer<typeof MedicalSearchSchema>): Promise<ToolResult> {
    try {
      const results = await Promise.all([
        this.searchPubMed(params.query, params.max_results),
        this.searchGuidelines(params.query),
        params.include_user_data ? this.searchUserData(params.query) : null
      ])

      const [pubmedResults, guidelines, userData] = results
      
      const allResults = [
        ...pubmedResults,
        ...guidelines,
        ...(userData || [])
      ].slice(0, params.max_results)

      const summary = this.generateSearchSummary(allResults, params.query)

      return {
        data: allResults,
        summary,
        references: allResults.map(result => ({
          title: result.title,
          url: result.url,
          source: result.source,
          type: result.type
        }))
      }
    } catch (error) {
      throw new Error(`Medical search failed: ${error}`)
    }
  }

  private async searchPubMed(query: string, maxResults: number) {
    // In a real implementation, this would use the PubMed API
    // For now, we'll return contextual mock data based on the query
    
    const queryLower = query.toLowerCase()
    const domains = identifyMedicalDomain(query)
    
    // Generate contextual mock results based on query
    const mockResultsMap: Record<string, any[]> = {
      cardiology: [
        {
          title: "LDL Cholesterol Targets and Cardiovascular Outcomes: Meta-Analysis of Randomized Trials",
          abstract: "Meta-analysis of 26 randomized trials (n=169,138) examining LDL cholesterol reduction and cardiovascular events. Lower LDL levels (<70 mg/dL) associated with 22% reduction in major adverse cardiovascular events (MACE).",
          authors: ["Williams, R.", "Chen, L.", "Martinez, S."],
          journal: "Journal of American College of Cardiology",
          year: 2024,
          pmid: "38756421",
          url: "https://pubmed.ncbi.nlm.nih.gov/38756421",
          source: "PubMed",
          type: "research_paper" as const
        },
        {
          title: "HDL Cholesterol Function vs. Concentration in Cardiovascular Risk Assessment",
          abstract: "Recent evidence suggests HDL functionality may be more important than absolute levels. HDL particle quality and reverse cholesterol transport capacity better predict cardiovascular outcomes than HDL-C levels alone.",
          authors: ["Thompson, K.", "Lee, M.", "Anderson, P."],
          journal: "Circulation Research",
          year: 2024,
          pmid: "38745832",
          url: "https://pubmed.ncbi.nlm.nih.gov/38745832",
          source: "PubMed",
          type: "research_paper" as const
        }
      ],
      endocrinology: [
        {
          title: "Thyroid Function and Metabolic Health: Current Understanding and Clinical Implications",
          abstract: "Comprehensive review of thyroid hormone effects on metabolism. Even subclinical thyroid dysfunction can affect lipid profiles, glucose metabolism, and cardiovascular risk.",
          authors: ["Kumar, A.", "Patel, S.", "Zhang, W."],
          journal: "Endocrine Reviews",
          year: 2024,
          pmid: "38734567",
          url: "https://pubmed.ncbi.nlm.nih.gov/38734567",
          source: "PubMed",
          type: "research_paper" as const
        }
      ],
      genetics: [
        {
          title: "Polygenic Risk Scores for Common Diseases: Clinical Implementation and Ethical Considerations",
          abstract: "Analysis of polygenic risk scores (PRS) for cardiovascular disease, diabetes, and cancer. PRS shows promise for risk stratification but requires careful interpretation in diverse populations.",
          authors: ["Rodriguez, M.", "Smith, J.", "Kim, H."],
          journal: "Nature Genetics",
          year: 2024,
          pmid: "38723456",
          url: "https://pubmed.ncbi.nlm.nih.gov/38723456",
          source: "PubMed",
          type: "research_paper" as const
        }
      ],
      general: [
        {
          title: "Biomarker Integration for Personalized Health Assessment: A Systems Medicine Approach",
          abstract: "Multi-omics approach combining blood biomarkers, genetic variants, and lifestyle factors for comprehensive health assessment. Machine learning models show improved prediction of health outcomes.",
          authors: ["Davis, L.", "Brown, R.", "Wilson, T."],
          journal: "Nature Medicine",
          year: 2024,
          pmid: "38712345",
          url: "https://pubmed.ncbi.nlm.nih.gov/38712345",
          source: "PubMed",
          type: "research_paper" as const
        }
      ]
    }
    
    // Select relevant results based on query domains
    let relevantResults: any[] = []
    domains.forEach(domain => {
      if (mockResultsMap[domain]) {
        relevantResults.push(...mockResultsMap[domain])
      }
    })
    
    // If no domain-specific results, use general results
    if (relevantResults.length === 0) {
      relevantResults = mockResultsMap.general
    }
    
    // Add query-specific results for common biomarkers
    if (queryLower.includes('cholesterol')) {
      relevantResults.unshift(...mockResultsMap.cardiology)
    }
    
    if (queryLower.includes('thyroid') || queryLower.includes('tsh')) {
      relevantResults.unshift(...mockResultsMap.endocrinology)
    }
    
    if (queryLower.includes('genetic') || queryLower.includes('dna')) {
      relevantResults.unshift(...mockResultsMap.genetics)
    }
    
    return relevantResults.slice(0, maxResults)
  }

  private async searchGuidelines(query: string) {
    // Mock clinical guidelines data
    const guidelines = [
      {
        title: "2023 AHA/ACC Guideline for the Management of Blood Cholesterol",
        abstract: "Updated clinical practice guidelines for cholesterol management, including recommendations for LDL targets, lifestyle interventions, and statin therapy.",
        organization: "American Heart Association / American College of Cardiology",
        year: 2023,
        url: "https://www.ahajournals.org/cholesterol-guidelines",
        source: "AHA/ACC",
        type: "clinical_guideline" as const
      }
    ]

    return guidelines.filter(guideline => 
      guideline.title.toLowerCase().includes(query.toLowerCase()) ||
      guideline.abstract.toLowerCase().includes(query.toLowerCase())
    )
  }

  private async searchUserData(query: string) {
    // This would search through user's uploaded medical data for relevant information
    // For demo purposes, return empty array
    return []
  }

  private generateSearchSummary(results: any[], query: string): string {
    if (results.length === 0) {
      return `No medical literature found for "${query}". Try using different search terms or check spelling.`
    }

    const researchPapers = results.filter(r => r.type === 'research_paper').length
    const guidelines = results.filter(r => r.type === 'clinical_guideline').length
    
    let summary = `Found ${results.length} relevant medical sources for "${query}".`
    
    if (researchPapers > 0) {
      summary += ` ${researchPapers} research paper(s)`
    }
    
    if (guidelines > 0) {
      if (researchPapers > 0) summary += ' and'
      summary += ` ${guidelines} clinical guideline(s)`
    }
    
    summary += ' were identified.'

    // Highlight key findings from top results
    if (results.length > 0) {
      const topResult = results[0]
      summary += `\n\nKey finding: ${topResult.title}`
      if (topResult.abstract) {
        const shortAbstract = topResult.abstract.length > 200 
          ? topResult.abstract.substring(0, 200) + '...'
          : topResult.abstract
        summary += `\n${shortAbstract}`
      }
    }

    return summary
  }
}

// Medical knowledge domains for enhanced search
export const MEDICAL_DOMAINS = {
  cardiology: ['heart', 'cardiac', 'cardiovascular', 'cholesterol', 'blood pressure', 'coronary'],
  endocrinology: ['thyroid', 'diabetes', 'hormone', 'insulin', 'glucose', 'tsh', 'metabolism'],
  hematology: ['blood', 'hemoglobin', 'anemia', 'iron', 'ferritin', 'b12', 'folate'],
  immunology: ['immune', 'inflammation', 'autoimmune', 'antibody', 'crp', 'white blood cells'],
  nephrology: ['kidney', 'renal', 'creatinine', 'bun', 'electrolytes', 'urine'],
  hepatology: ['liver', 'hepatic', 'alt', 'ast', 'bilirubin', 'alkaline phosphatase'],
  genetics: ['genetic', 'dna', 'variant', 'mutation', 'hereditary', 'familial'],
  nutrition: ['vitamin', 'mineral', 'deficiency', 'diet', 'nutrition', 'supplement'],
  psychiatry: ['mental health', 'anxiety', 'depression', 'stress', 'mood', 'cognitive'],
  general: ['fatigue', 'energy', 'wellness', 'health', 'symptoms', 'prevention']
} as const

export function identifyMedicalDomain(query: string): string[] {
  const queryLower = query.toLowerCase()
  const domains: string[] = []
  
  Object.entries(MEDICAL_DOMAINS).forEach(([domain, keywords]) => {
    if (keywords.some(keyword => queryLower.includes(keyword))) {
      domains.push(domain)
    }
  })
  
  return domains.length > 0 ? domains : ['general']
}
