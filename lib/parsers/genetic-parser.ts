import { z } from 'zod'
import { CLINICAL_SNPS } from './config/SNPs'

// Validation schema for genetic variants (SNPs)
export const GeneticVariantSchema = z.object({
  rsid: z.string().regex(/^rs\d+$/, 'RSID must start with "rs" followed by numbers'),
  chromosome: z.string().refine((val) => {
    return ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', 'X', 'Y', 'MT'].includes(val)
  }, 'Invalid chromosome'),
  position: z.string().transform((val) => {
    const num = parseInt(val)
    if (isNaN(num) || num < 1) throw new Error(`Invalid position: ${val}`)
    return num
  }),
  genotype: z.string().regex(/^[ATCG-]{1,2}$/, 'Genotype must contain valid DNA bases (A, T, C, G) or dashes'),
})

export type GeneticVariant = z.infer<typeof GeneticVariantSchema>

export interface ParsedGeneticData {
  variants: AnnotatedVariant[]
  metadata: {
    totalVariants: number
    annotatedVariants: number
    clinicallyRelevantVariants: number
    dataSource: string
    chromosomes: string[]
  }
}

export interface RawGeneticData {
  variants: RawVariant[]
  metadata: {
    totalVariants: number
    dataSource: string
  }
}

export interface RawVariant {
  rsid: string;
  genotype: string;
}

export interface AnnotatedVariant {
  rsid: string
  chromosome: string
  position: number
  genotype: string
  annotation?: GeneAnnotation
}

export interface GeneAnnotation {
  geneName?: string
  clinicalSignificance?: 'pathogenic' | 'likely_pathogenic' | 'uncertain' | 'likely_benign' | 'benign'
  phenotype?: string
  drugResponse?: string
  frequency?: number
  consequence?: string
  riskAllele?: string
  interpretation?: string
}

// Clinically relevant SNPs database (in-memory for now)


// Parse 23andMe format genetic data - returns annotated data for visualization
export function parseGeneticData(content: string, source: string = '23andme'): ParsedGeneticData {
  // Parse the content manually to get position data for visualization
  const lines = content.trim().split('\n')
  const variants: AnnotatedVariant[] = []
  const chromosomes = new Set<string>()

  for (const line of lines) {
    // Skip comments and empty lines
    if (line.startsWith('#') || line.trim() === '') continue

    const parts = line.split('\t').map(p => p.trim())
    if (parts.length < 4) continue

    try {
      const [rsid, chromosome, position, genotype] = parts
      
      const validatedVariant = GeneticVariantSchema.parse({
        rsid,
        chromosome,
        position,
        genotype
      })

      chromosomes.add(validatedVariant.chromosome)

      const annotation = CLINICAL_SNPS[validatedVariant.rsid]
      const annotatedVariant: AnnotatedVariant = {
        rsid: validatedVariant.rsid,
        chromosome: validatedVariant.chromosome,
        position: validatedVariant.position,
        genotype: validatedVariant.genotype,
        annotation
      }

      variants.push(annotatedVariant)
    } catch (error) {
      console.warn(`Skipping invalid line: ${line}`, error)
      continue
    }
  }

  // Count annotations
  const annotatedCount = variants.filter(v => v.annotation).length
  const clinicallyRelevantCount = variants.filter(v => 
    v.annotation?.clinicalSignificance === 'pathogenic' || 
    v.annotation?.clinicalSignificance === 'likely_pathogenic'
  ).length

  return {
    variants,
    metadata: {
      totalVariants: variants.length,
      annotatedVariants: annotatedCount,
      clinicallyRelevantVariants: clinicallyRelevantCount,
      dataSource: source,
      chromosomes: Array.from(chromosomes).sort()
    }
  }
}

// Parse raw genetic data without annotations - for database storage
// Parse raw genetic data without annotations - for database storage
export function parseRawGeneticData(content: string, source: string = '23andme'): RawGeneticData {
  const lines = content.trim().split('\n')
  const variants: RawVariant[] = []
  const chromosomes = new Set<string>()

  for (const line of lines) {
    // Skip comments and empty lines
    if (line.startsWith('#') || line.trim() === '') continue

    const parts = line.split('\t').map(p => p.trim())
    if (parts.length < 4) continue

    try {
      const [rsid, chromosome, position, genotype] = parts
      
      const validatedVariant = GeneticVariantSchema.parse({
        rsid,
        chromosome,
        position,
        genotype
      })

      const rawVariant: RawVariant = {
        rsid: validatedVariant.rsid,
        genotype: validatedVariant.genotype
      }

      variants.push(rawVariant)
    } catch (error) {
      console.warn(`Skipping invalid line: ${line}`, error)
      continue
    }
  }

  return {
    variants,
    metadata: {
      totalVariants: variants.length,
      dataSource: source,
    }
  }
}

// Get clinical risk assessment from genetic data
export function getClinicalRiskAssessment(variants: AnnotatedVariant[]): {
  highRiskVariants: AnnotatedVariant[]
  drugResponseVariants: AnnotatedVariant[]
  carrierStatus: AnnotatedVariant[]
  recommendations: string[]
} {
  const highRiskVariants: AnnotatedVariant[] = []
  const drugResponseVariants: AnnotatedVariant[] = []
  const carrierStatus: AnnotatedVariant[] = []
  const recommendations: string[] = []

  for (const variant of variants) {
    if (!variant.annotation) continue

    const { annotation } = variant

    // High risk pathogenic variants
    if (annotation.clinicalSignificance === 'pathogenic' || 
        annotation.clinicalSignificance === 'likely_pathogenic') {
      highRiskVariants.push(variant)
      
      // Specific recommendations
      if (variant.rsid === 'rs334' && variant.genotype.includes('T')) {
        recommendations.push('Sickle cell trait detected - genetic counseling recommended')
      }
      if (variant.rsid === 'rs6025' && variant.genotype.includes('T')) {
        recommendations.push('Factor V Leiden detected - discuss with doctor before surgery or taking hormones')
      }
      if (variant.rsid === 'rs7903146' && variant.genotype.includes('T')) {
        recommendations.push('Increased diabetes risk - maintain healthy diet and exercise')
      }
    }

    // Drug response variants
    if (annotation.drugResponse) {
      drugResponseVariants.push(variant)
      
      if (variant.rsid === 'rs4149056' && variant.genotype.includes('T')) {
        recommendations.push('Increased statin sensitivity - discuss with doctor if prescribed statins')
      }
      if (variant.rsid === 'rs1799853') {
        recommendations.push('Altered warfarin metabolism - inform doctor if anticoagulants are prescribed')
      }
    }

    // Carrier status for recessive conditions
    if (annotation.phenotype && (
        annotation.phenotype.includes('anemia') || 
        annotation.phenotype.includes('deficiency')
    )) {
      carrierStatus.push(variant)
    }
  }

  // General recommendations
  if (highRiskVariants.length > 0) {
    recommendations.push('Consult with a genetic counselor to discuss your results')
  }
  if (drugResponseVariants.length > 0) {
    recommendations.push('Share these results with your healthcare provider before starting new medications')
  }

  return {
    highRiskVariants,
    drugResponseVariants,
    carrierStatus,
    recommendations
  }
}

// Validate genetic data file
export function validateGeneticFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const validExtensions = ['.txt', '.tsv', '.raw']
    const hasValidExtension = validExtensions.some(ext => 
      file.name.toLowerCase().endsWith(ext)
    )

    if (!hasValidExtension) {
      reject(new Error('File must be a .txt, .tsv, or .raw file'))
      return
    }

    if (file.size > 100 * 1024 * 1024) { // 100MB limit for genetic files
      reject(new Error('File size must be less than 100MB'))
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      if (!content) {
        reject(new Error('File is empty'))
        return
      }

      // Check if it looks like 23andMe format
      const lines = content.trim().split('\n')
      const dataLines = lines.filter(line => !line.startsWith('#') && line.trim() !== '')
      
      if (dataLines.length < 10) {
        reject(new Error('File must contain at least 10 genetic variants'))
        return
      }

      // Check format of first data line
      const firstDataLine = dataLines[0]
      const parts = firstDataLine.split('\t')
      if (parts.length < 4) {
        reject(new Error('Invalid format - expected tab-separated values with at least 4 columns'))
        return
      }

      const [rsid, chromosome, position, genotype] = parts
      if (!rsid.startsWith('rs')) {
        reject(new Error('Invalid format - first column should contain rsIDs starting with "rs"'))
        return
      }

      resolve(content)
    }

    reader.onerror = () => reject(new Error('Error reading file'))
    reader.readAsText(file)
  })
}
