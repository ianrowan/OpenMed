import { z } from 'zod'

// Validation schema for bloodwork data
export const BloodworkRowSchema = z.object({
  Biomarker: z.string().min(1, 'Biomarker name is required'),
  Value: z.string().transform((val) => {
    const num = parseFloat(val)
    if (isNaN(num)) throw new Error(`Invalid numeric value: ${val}`)
    return num
  }),
  Unit: z.string().min(1, 'Unit is required'),
  Reference_Min: z.string().transform((val) => {
    const num = parseFloat(val)
    return isNaN(num) ? null : num
  }),
  Reference_Max: z.string().transform((val) => {
    const num = parseFloat(val)
    return isNaN(num) ? null : num
  }),
  Status: z.enum(['high', 'low', 'normal', 'critical']).optional(),
  Date: z.string().min(1, 'Date is required'),
  Lab: z.string().min(1, 'Lab name is required'),
})

export type BloodworkRow = z.infer<typeof BloodworkRowSchema>

export interface ParsedBloodwork {
  biomarkers: ProcessedBiomarker[]
  metadata: {
    totalCount: number
    abnormalCount: number
    criticalCount: number
    testDate: string
    labName: string
  }
}

export interface ProcessedBiomarker {
  biomarker: string
  value: number
  unit: string
  referenceMin: number | null
  referenceMax: number | null
  status: 'high' | 'low' | 'normal' | 'critical'
  percentileFromNormal?: number
  interpretation?: string
}

// Calculate biomarker status based on reference ranges
export function calculateBiomarkerStatus(
  value: number,
  referenceMin: number | null,
  referenceMax: number | null,
  biomarkerName: string
): { status: 'high' | 'low' | 'normal' | 'critical', interpretation?: string } {
  // If no reference range, assume normal
  if (referenceMin === null && referenceMax === null) {
    return { status: 'normal' }
  }

  // Check for critical values (these need medical attention)
  const criticalRanges = getCriticalRanges(biomarkerName)
  if (criticalRanges) {
    if (value <= criticalRanges.criticalLow || value >= criticalRanges.criticalHigh) {
      return { 
        status: 'critical',
        interpretation: `Critical ${biomarkerName} level requires immediate medical attention`
      }
    }
  }

  // Standard range checking
  if (referenceMin !== null && value < referenceMin) {
    const percentBelow = ((referenceMin - value) / referenceMin) * 100
    return { 
      status: 'low',
      interpretation: `${percentBelow.toFixed(1)}% below normal range`
    }
  }

  if (referenceMax !== null && value > referenceMax) {
    const percentAbove = ((value - referenceMax) / referenceMax) * 100
    return { 
      status: 'high',
      interpretation: `${percentAbove.toFixed(1)}% above normal range`
    }
  }

  return { status: 'normal' }
}

// Critical ranges for common biomarkers
function getCriticalRanges(biomarkerName: string): { criticalLow: number, criticalHigh: number } | null {
  const criticalRanges: Record<string, { criticalLow: number, criticalHigh: number }> = {
    'Glucose': { criticalLow: 40, criticalHigh: 400 },
    'Potassium': { criticalLow: 2.5, criticalHigh: 6.0 },
    'Sodium': { criticalLow: 120, criticalHigh: 160 },
    'Creatinine': { criticalLow: 0.2, criticalHigh: 10.0 },
    'Total Cholesterol': { criticalLow: 0, criticalHigh: 500 },
    'Hemoglobin': { criticalLow: 6.0, criticalHigh: 20.0 },
    'White Blood Cells': { criticalLow: 1.0, criticalHigh: 50.0 },
    'Platelets': { criticalLow: 20, criticalHigh: 1000 },
  }

  return criticalRanges[biomarkerName] || null
}

// Parse CSV content into bloodwork data
export function parseBloodworkCSV(csvContent: string): ParsedBloodwork {
  const lines = csvContent.trim().split('\n')
  const headers = lines[0].split(',').map(h => h.trim())
  
  // Validate headers
  const requiredHeaders = ['Biomarker', 'Value', 'Unit', 'Reference_Min', 'Reference_Max', 'Date', 'Lab']
  const missingHeaders = requiredHeaders.filter(h => !headers.includes(h))
  if (missingHeaders.length > 0) {
    throw new Error(`Missing required headers: ${missingHeaders.join(', ')}`)
  }

  const biomarkers: ProcessedBiomarker[] = []
  let abnormalCount = 0
  let criticalCount = 0
  let testDate = ''
  let labName = ''

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim())
    if (values.length < headers.length) continue

    const rowData: Record<string, string> = {}
    headers.forEach((header, index) => {
      rowData[header] = values[index]
    })

    try {
      const validatedRow = BloodworkRowSchema.parse(rowData)
      
      // Calculate status if not provided
      const statusResult = validatedRow.Status 
        ? { status: validatedRow.Status, interpretation: undefined }
        : calculateBiomarkerStatus(
            validatedRow.Value,
            validatedRow.Reference_Min,
            validatedRow.Reference_Max,
            validatedRow.Biomarker
          )

      const processedBiomarker: ProcessedBiomarker = {
        biomarker: validatedRow.Biomarker,
        value: validatedRow.Value,
        unit: validatedRow.Unit,
        referenceMin: validatedRow.Reference_Min,
        referenceMax: validatedRow.Reference_Max,
        status: statusResult.status,
        interpretation: statusResult.interpretation,
      }

      biomarkers.push(processedBiomarker)

      if (statusResult.status !== 'normal') abnormalCount++
      if (statusResult.status === 'critical') criticalCount++

      // Store metadata from first row
      if (i === 1) {
        testDate = validatedRow.Date
        labName = validatedRow.Lab
      }
    } catch (error) {
      throw new Error(`Error parsing row ${i}: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  return {
    biomarkers,
    metadata: {
      totalCount: biomarkers.length,
      abnormalCount,
      criticalCount,
      testDate,
      labName,
    }
  }
}

// Validate file format and content
export function validateBloodworkFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      reject(new Error('File must be a CSV file'))
      return
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      reject(new Error('File size must be less than 5MB'))
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      if (!content) {
        reject(new Error('File is empty'))
        return
      }

      try {
        // Quick validation - just check if it looks like valid CSV
        const lines = content.trim().split('\n')
        if (lines.length < 2) {
          reject(new Error('File must contain at least a header and one data row'))
          return
        }

        resolve(content)
      } catch (error) {
        reject(new Error('Invalid CSV format'))
      }
    }

    reader.onerror = () => reject(new Error('Error reading file'))
    reader.readAsText(file)
  })
}
