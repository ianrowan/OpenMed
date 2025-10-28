/**
 * Parser for Quest Diagnostics JSON format
 * Converts Quest JSON data to the same format as CSV bloodwork uploads
 */

import { ProcessedBiomarker, ParsedBloodwork } from './bloodwork-parser'

interface QuestBiomarkerResult {
  questBiomarkerId?: string
  biomarker?: {
    name: string
  }
  currentResult?: {
    calculatedResult?: string | number
    displayResult?: string | number
    inRange?: boolean
    dateOfService?: string
    requisitionId?: string
  }
  units?: string
  rangeMin?: string | number
  rangeMax?: string | number
  outOfRangeType?: string
}

interface QuestJsonData {
  data: {
    biomarkerResultsRecord: QuestBiomarkerResult[]
  }
}

/**
 * Clean unit names for consistency
 */
function cleanUnit(unit?: string): string {
  if (!unit) return 'units'
  
  const unitMap: Record<string, string> = {
    'Thousand/uL': '10³/μL',
    'Million/uL': '10⁶/μL',
    'cells/uL': 'cells/μL',
    'g/dL': 'g/dL',
    '%': '%',
    'fL': 'fL',
    'pg': 'pg',
    'mg/dL': 'mg/dL',
    'ng/mL': 'ng/mL',
    'pg/mL': 'pg/mL',
    'μg/dL': 'μg/dL',
    'U/L': 'U/L',
    'mg/L': 'mg/L',
    'mIU/L': 'mIU/L',
    'IU/L': 'IU/L',
    'mmol/L': 'mmol/L',
    'μmol/L': 'μmol/L'
  }
  
  return unitMap[unit] || unit
}

/**
 * Get safe reference ranges
 */
function getSafeReferenceRange(
  rangeMin?: string | number, 
  rangeMax?: string | number
): { min: number; max: number } {
  const min = rangeMin && rangeMin !== '' ? parseFloat(String(rangeMin)) : -999999
  const max = rangeMax && rangeMax !== '' ? parseFloat(String(rangeMax)) : 999999
  
  return {
    min: isNaN(min) ? -999999 : min,
    max: isNaN(max) ? 999999 : max
  }
}

/**
 * Determine biomarker status from values and ranges
 */
function determineStatus(
  value: string | number,
  rangeMin?: string | number,
  rangeMax?: string | number,
  outOfRangeType?: string,
  inRange?: boolean
): 'normal' | 'high' | 'low' {
  const numericValue = parseFloat(String(value))
  const numericMin = rangeMin ? parseFloat(String(rangeMin)) : NaN
  const numericMax = rangeMax ? parseFloat(String(rangeMax)) : NaN
  
  // If we have valid numeric ranges, calculate status from actual values
  if (!isNaN(numericValue) && !isNaN(numericMin) && !isNaN(numericMax)) {
    if (numericValue < numericMin) {
      return 'low'
    }
    if (numericValue > numericMax) {
      return 'high'
    }
    return 'normal'
  }
  
  // Fallback to Quest's flags if ranges are missing/invalid
  if (inRange === true || outOfRangeType === 'in_range') {
    return 'normal'
  } else if (outOfRangeType === 'high' || outOfRangeType === 'above_range') {
    return 'high'
  } else if (outOfRangeType === 'low' || outOfRangeType === 'below_range') {
    return 'low'
  }
  
  return 'normal'
}

/**
 * Check if a value is numeric
 */
function isNumericValue(value: any): boolean {
  if (value === null || value === undefined || value === '') {
    return false
  }
  
  const stringValue = String(value).trim()
  
  if (stringValue === '') {
    return false
  }
  
  // Skip obviously non-numeric values
  const nonNumericKeywords = [
    'positive', 'negative', 'detected', 'not detected',
    'yellow', 'clear', 'normal', 'abnormal'
  ]
  
  if (nonNumericKeywords.some(keyword => stringValue.toLowerCase().includes(keyword))) {
    return false
  }
  
  // Check if it's a valid number
  const numericValue = parseFloat(stringValue)
  return !isNaN(numericValue) && isFinite(numericValue)
}

/**
 * Parse Quest Diagnostics JSON format
 */
export function parseQuestJson(jsonData: QuestJsonData): ParsedBloodwork {
  const results: ProcessedBiomarker[] = []
  
  if (!jsonData.data || !jsonData.data.biomarkerResultsRecord) {
    throw new Error('Invalid JSON structure: missing biomarkerResultsRecord')
  }
  
  let testDate: string | null = null
  
  jsonData.data.biomarkerResultsRecord.forEach(record => {
    // Skip records without current results or biomarker names
    if (!record.currentResult || !record.biomarker || !record.biomarker.name) {
      console.warn(`Skipping record: missing result or biomarker info`)
      return
    }
    
    const currentResult = record.currentResult
    
    // Capture the test date from the first record
    if (!testDate && currentResult.dateOfService) {
      testDate = currentResult.dateOfService
    }
    
    // Skip if no calculated result
    if (!currentResult.calculatedResult && !currentResult.displayResult) {
      console.warn(`Skipping ${record.biomarker.name}: no result value`)
      return
    }
    
    const rawValue = currentResult.calculatedResult || currentResult.displayResult
    
    // Skip non-numeric values
    if (!isNumericValue(rawValue)) {
      console.warn(`Skipping ${record.biomarker.name}: non-numeric value "${rawValue}"`)
      return
    }
    
    const biomarkerName = record.biomarker.name.replace(/,/g, '') // Remove commas
    const value = parseFloat(String(rawValue))
    const unit = cleanUnit(record.units)
    const referenceRange = getSafeReferenceRange(record.rangeMin, record.rangeMax)
    const status = determineStatus(
      String(rawValue), 
      record.rangeMin, 
      record.rangeMax, 
      record.outOfRangeType, 
      currentResult.inRange
    )
    
    results.push({
      biomarker: biomarkerName,
      value: value,
      unit: unit,
      referenceMin: referenceRange.min === -999999 ? null : referenceRange.min,
      referenceMax: referenceRange.max === 999999 ? null : referenceRange.max,
      status: status
    })
  })
  
  if (results.length === 0) {
    throw new Error('No valid biomarkers found in JSON data')
  }
  
  // Calculate metadata
  const abnormalCount = results.filter(b => b.status !== 'normal').length
  
  return {
    biomarkers: results,
    metadata: {
      totalCount: results.length,
      abnormalCount,
      criticalCount: 0, // No longer tracking critical values
      testDate: testDate || new Date().toISOString().split('T')[0],
      labName: 'Quest Diagnostics'
    }
  }
}

/**
 * Validate Quest JSON format
 */
export function validateQuestJson(jsonString: string): QuestJsonData {
  try {
    const parsed = JSON.parse(jsonString)
    
    if (!parsed.data || !parsed.data.biomarkerResultsRecord) {
      throw new Error('Invalid Quest JSON format: missing required fields')
    }
    
    if (!Array.isArray(parsed.data.biomarkerResultsRecord)) {
      throw new Error('Invalid Quest JSON format: biomarkerResultsRecord must be an array')
    }
    
    return parsed as QuestJsonData
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error('Invalid JSON format: ' + error.message)
    }
    throw error
  }
}
