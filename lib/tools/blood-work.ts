import { supabase } from '@/lib/supabase'
import { BloodTestResult, Biomarker, ToolResult } from '@/types'
import { BloodWorkQuerySchema } from '@/types'
import { z } from 'zod'

export class BloodWorkTool {
  async execute(params: z.infer<typeof BloodWorkQuerySchema>): Promise<ToolResult> {
    try {
      // If Supabase is not configured, return mock data for demo
      if (!supabase) {
        return this.getMockBloodWorkData(params)
      }

      const userId = await this.getCurrentUserId()
      
      let query = supabase
        .from('medical_data')
        .select('*')
        .eq('user_id', userId)
        .eq('data_type', 'blood_work')
        .order('uploaded_at', { ascending: false })

      // Apply filters
      if (params.date_range) {
        query = query
          .gte('uploaded_at', params.date_range.start)
          .lte('uploaded_at', params.date_range.end)
      }

      if (params.test_id) {
        query = query.eq('id', params.test_id)
      }

      const { data, error } = await query

      if (error) throw error

      const bloodTests: BloodTestResult[] = data.map(row => row.data)
      
      // Filter biomarkers if specified
      let filteredTests = bloodTests
      if (params.markers) {
        filteredTests = bloodTests.map(test => ({
          ...test,
          biomarkers: test.biomarkers.filter(marker => 
            params.markers!.some(m => 
              marker.name.toLowerCase().includes(m.toLowerCase())
            )
          )
        })).filter(test => test.biomarkers.length > 0)
      }

      // Filter out-of-range only
      if (params.out_of_range_only) {
        filteredTests = filteredTests.map(test => ({
          ...test,
          biomarkers: test.biomarkers.filter(marker => 
            marker.status !== 'normal'
          )
        })).filter(test => test.biomarkers.length > 0)
      }

      const summary = this.generateBloodWorkSummary(filteredTests)
      const visualization = this.createBloodWorkVisualization(filteredTests)

      return {
        data: {
          blood_test_results: filteredTests
        },
        visualization,
        summary,
        references: []
      }
    } catch (error) {
      throw new Error(`Blood work query failed: ${error}`)
    }
  }

  private getMockBloodWorkData(params: z.infer<typeof BloodWorkQuerySchema>): ToolResult {
    const mockBloodTest: BloodTestResult = {
      id: 'mock-1',
      user_id: 'demo-user',
      test_date: '2024-01-15',
      lab_name: 'Demo Medical Lab',
      biomarkers: [
        {
          name: 'Total Cholesterol',
          value: 245,
          unit: 'mg/dL',
          reference_range: { min: 0, max: 200 },
          status: 'high'
        },
        {
          name: 'HDL Cholesterol',
          value: 38,
          unit: 'mg/dL',
          reference_range: { min: 40, max: 100 },
          status: 'low'
        },
        {
          name: 'LDL Cholesterol',
          value: 165,
          unit: 'mg/dL',
          reference_range: { min: 0, max: 100 },
          status: 'high'
        },
        {
          name: 'Triglycerides',
          value: 210,
          unit: 'mg/dL',
          reference_range: { min: 0, max: 150 },
          status: 'high'
        },
        {
          name: 'Glucose',
          value: 95,
          unit: 'mg/dL',
          reference_range: { min: 70, max: 99 },
          status: 'normal'
        },
        {
          name: 'Hemoglobin A1C',
          value: 5.4,
          unit: '%',
          reference_range: { min: 4.0, max: 5.6 },
          status: 'normal'
        }
      ],
      uploaded_at: '2024-01-15T10:00:00Z'
    }

    // Apply filters to mock data if specified
    let filteredTest = { ...mockBloodTest }
    
    if (params.markers) {
      filteredTest.biomarkers = mockBloodTest.biomarkers.filter(marker => 
        params.markers!.some(m => 
          marker.name.toLowerCase().includes(m.toLowerCase())
        )
      )
    }

    if (params.out_of_range_only) {
      filteredTest.biomarkers = filteredTest.biomarkers.filter(marker => 
        marker.status !== 'normal'
      )
    }

    return {
      data: {
        blood_test_results: [filteredTest]
      },
      summary: this.generateBloodWorkSummary([filteredTest])
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

  private generateBloodWorkSummary(tests: BloodTestResult[]): string {
    if (tests.length === 0) {
      return "No blood test results found matching the specified criteria."
    }

    const latestTest = tests[0]
    const totalBiomarkers = latestTest.biomarkers.length
    const abnormalMarkers = latestTest.biomarkers.filter(m => m.status !== 'normal')
    
    let summary = `Found ${tests.length} blood test(s) with ${totalBiomarkers} biomarker(s) analyzed.`
    
    if (abnormalMarkers.length > 0) {
      summary += ` ${abnormalMarkers.length} biomarker(s) are outside normal ranges:`
      abnormalMarkers.forEach(marker => {
        summary += `\n- ${marker.name}: ${marker.value} ${marker.unit} (${marker.status})`
      })
    } else {
      summary += " All biomarkers are within normal ranges."
    }

    return summary
  }

  private createBloodWorkVisualization(tests: BloodTestResult[]) {
    if (tests.length === 0) return undefined

    const latestTest = tests[0]
    
    // Create visualization for biomarker values
    return {
      type: 'table' as const,
      config: {
        title: `Blood Test Results - ${new Date(latestTest.test_date).toLocaleDateString()}`,
        description: `${latestTest.lab_name || 'Lab'} - ${latestTest.biomarkers.length} biomarkers`,
        data_keys: ['name', 'value', 'unit', 'status', 'reference_range']
      }
    }
  }
}

// Biomarker reference ranges database
export const BIOMARKER_RANGES: Record<string, { min: number; max: number; unit: string; optimal?: { min: number; max: number } }> = {
  'glucose': { min: 70, max: 99, unit: 'mg/dL', optimal: { min: 80, max: 90 } },
  'hemoglobin_a1c': { min: 4.0, max: 5.6, unit: '%', optimal: { min: 4.0, max: 5.0 } },
  'total_cholesterol': { min: 0, max: 200, unit: 'mg/dL', optimal: { min: 150, max: 180 } },
  'ldl_cholesterol': { min: 0, max: 100, unit: 'mg/dL', optimal: { min: 50, max: 80 } },
  'hdl_cholesterol': { min: 40, max: 200, unit: 'mg/dL', optimal: { min: 60, max: 80 } },
  'triglycerides': { min: 0, max: 150, unit: 'mg/dL', optimal: { min: 50, max: 100 } },
  'tsh': { min: 0.4, max: 4.0, unit: 'mIU/L', optimal: { min: 1.0, max: 2.5 } },
  't3': { min: 2.3, max: 4.2, unit: 'pg/mL' },
  't4': { min: 0.8, max: 1.8, unit: 'ng/dL' },
  'vitamin_d': { min: 30, max: 100, unit: 'ng/mL', optimal: { min: 40, max: 60 } },
  'vitamin_b12': { min: 200, max: 900, unit: 'pg/mL', optimal: { min: 400, max: 700 } },
  'folate': { min: 3, max: 17, unit: 'ng/mL', optimal: { min: 6, max: 12 } },
  'iron': { min: 60, max: 170, unit: 'μg/dL' },
  'ferritin': { min: 12, max: 300, unit: 'ng/mL' },
  'creatinine': { min: 0.6, max: 1.2, unit: 'mg/dL' },
  'bun': { min: 7, max: 20, unit: 'mg/dL' },
  'alt': { min: 7, max: 56, unit: 'U/L' },
  'ast': { min: 10, max: 40, unit: 'U/L' },
  'alkaline_phosphatase': { min: 44, max: 147, unit: 'U/L' },
  'total_bilirubin': { min: 0.2, max: 1.2, unit: 'mg/dL' },
  'white_blood_cells': { min: 4.5, max: 11.0, unit: '10³/μL' },
  'red_blood_cells': { min: 4.2, max: 5.4, unit: '10⁶/μL' },
  'hemoglobin': { min: 12.0, max: 16.0, unit: 'g/dL' },
  'hematocrit': { min: 36, max: 46, unit: '%' },
  'platelets': { min: 150, max: 450, unit: '10³/μL' },
  'c_reactive_protein': { min: 0, max: 3.0, unit: 'mg/L' },
}

export function analyzeBiomarker(name: string, value: number): Biomarker['status'] {
  const normalizedName = name.toLowerCase().replace(/[^a-z0-9]/g, '_')
  const range = BIOMARKER_RANGES[normalizedName]
  
  if (!range) return 'normal' // Unknown marker, assume normal
  
  if (value < range.min) {
    return value < (range.min * 0.8) ? 'critical_low' : 'low'
  }
  
  if (value > range.max) {
    return value > (range.max * 1.2) ? 'critical_high' : 'high'
  }
  
  return 'normal'
}
