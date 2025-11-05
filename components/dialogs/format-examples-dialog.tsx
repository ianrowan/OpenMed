'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FileText, Activity, Dna, Copy, Check } from 'lucide-react'
import { useState } from 'react'

const bloodworkExample = `Biomarker,Value,Unit,Reference_Min,Reference_Max,Date,Lab
Hemoglobin,15.2,g/dL,13.2,17.1,2025-06-15,Quest Diagnostics
White Blood Cell Count,7.5,10³/μL,3.8,10.8,2025-06-15,Quest Diagnostics
Glucose,95,mg/dL,65,99,2025-06-15,Quest Diagnostics
Total Cholesterol,188,mg/dL,0,200,2025-06-15,Quest Diagnostics
HDL Cholesterol,58,mg/dL,40,999,2025-06-15,Quest Diagnostics
LDL Cholesterol,108,mg/dL,0,100,2025-06-15,Quest Diagnostics
Triglycerides,110,mg/dL,0,150,2025-06-15,Quest Diagnostics
TSH,2.4,mIU/L,0.4,4.5,2025-06-15,Quest Diagnostics
Vitamin D,45,ng/mL,30,100,2025-06-15,Quest Diagnostics
Ferritin,85,ng/mL,38,380,2025-06-15,Quest Diagnostics`

const geneticExample = `# rsid	chromosome	position	genotype
rs1801133	1	11856378	TT
rs1801131	1	11854476	AA
rs6025	1	169549811	TT
rs429358	19	44908684	TT
rs7412	19	44908822	CT
rs1065852	22	42126499	CC
rs3892097	22	42128945	TT
rs4988235	2	136608646	GG
rs2187668	6	32665748	TT
rs1799853	10	94942290	AA
rs1057910	10	94938737	AT
rs9923231	16	31107689	AA`

export function FormatExamplesDialog() {
  const [copiedBlood, setCopiedBlood] = useState(false)
  const [copiedGenetic, setCopiedGenetic] = useState(false)

  const copyToClipboard = async (text: string, type: 'blood' | 'genetic') => {
    try {
      await navigator.clipboard.writeText(text)
      if (type === 'blood') {
        setCopiedBlood(true)
        setTimeout(() => setCopiedBlood(false), 2000)
      } else {
        setCopiedGenetic(true)
        setTimeout(() => setCopiedGenetic(false), 2000)
      }
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="flex items-center gap-2 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 transition-all"
        >
          <FileText className="h-4 w-4" />
          Format Examples
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Data Format Examples
          </DialogTitle>
          <DialogDescription>
            Copy these examples to understand the expected format for your uploads
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="bloodwork" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="bloodwork" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Bloodwork CSV
            </TabsTrigger>
            <TabsTrigger value="genetic" className="flex items-center gap-2">
              <Dna className="h-4 w-4" />
              Genetic Data
            </TabsTrigger>
          </TabsList>

          <TabsContent value="bloodwork" className="space-y-4 mt-4">
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-blue-900 flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Bloodwork CSV Format
                  </h4>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(bloodworkExample, 'blood')}
                    className="flex items-center gap-2"
                  >
                    {copiedBlood ? (
                      <>
                        <Check className="h-3 w-3 text-green-600" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>

                <div className="bg-white rounded-md p-3 border border-blue-200 shadow-sm">
                  <pre className="text-xs font-mono overflow-x-auto text-slate-800">
                    {bloodworkExample}
                  </pre>
                </div>

                <div className="space-y-2">
                  <h5 className="font-semibold text-blue-900 text-sm">Required Columns:</h5>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="bg-white p-2 rounded border border-blue-100">
                      <span className="font-mono text-blue-700 font-semibold">Biomarker</span>
                      <p className="text-xs text-slate-600 mt-1">Name of the test (e.g., "Hemoglobin")</p>
                    </div>
                    <div className="bg-white p-2 rounded border border-blue-100">
                      <span className="font-mono text-blue-700 font-semibold">Value</span>
                      <p className="text-xs text-slate-600 mt-1">Numeric result value</p>
                    </div>
                    <div className="bg-white p-2 rounded border border-blue-100">
                      <span className="font-mono text-blue-700 font-semibold">Unit</span>
                      <p className="text-xs text-slate-600 mt-1">Measurement unit (e.g., "g/dL")</p>
                    </div>
                    <div className="bg-white p-2 rounded border border-blue-100">
                      <span className="font-mono text-blue-700 font-semibold">Reference_Min</span>
                      <p className="text-xs text-slate-600 mt-1">Lower reference range</p>
                    </div>
                    <div className="bg-white p-2 rounded border border-blue-100">
                      <span className="font-mono text-blue-700 font-semibold">Reference_Max</span>
                      <p className="text-xs text-slate-600 mt-1">Upper reference range</p>
                    </div>
                    <div className="bg-white p-2 rounded border border-blue-100">
                      <span className="font-mono text-blue-700 font-semibold">Date</span>
                      <p className="text-xs text-slate-600 mt-1">Test date (YYYY-MM-DD)</p>
                    </div>
                  </div>
                  
                  <div className="bg-amber-50 border border-amber-200 rounded p-3 mt-3">
                    <p className="text-xs text-amber-800">
                      <strong>Optional:</strong> Lab column for laboratory name. Status is automatically calculated.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="genetic" className="space-y-4 mt-4">
            <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-purple-900 flex items-center gap-2">
                    <Dna className="h-4 w-4" />
                    Genetic Data Format (23andMe/AncestryDNA)
                  </h4>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(geneticExample, 'genetic')}
                    className="flex items-center gap-2"
                  >
                    {copiedGenetic ? (
                      <>
                        <Check className="h-3 w-3 text-green-600" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>

                <div className="bg-white rounded-md p-3 border border-purple-200 shadow-sm">
                  <pre className="text-xs font-mono overflow-x-auto text-slate-800">
                    {geneticExample}
                  </pre>
                </div>

                <div className="space-y-2">
                  <h5 className="font-semibold text-purple-900 text-sm">Format Details:</h5>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="bg-white p-2 rounded border border-purple-100">
                      <span className="font-mono text-purple-700 font-semibold">rsid</span>
                      <p className="text-xs text-slate-600 mt-1">SNP identifier (e.g., "rs1801133")</p>
                    </div>
                    <div className="bg-white p-2 rounded border border-purple-100">
                      <span className="font-mono text-purple-700 font-semibold">chromosome</span>
                      <p className="text-xs text-slate-600 mt-1">Chromosome number (1-22, X, Y)</p>
                    </div>
                    <div className="bg-white p-2 rounded border border-purple-100">
                      <span className="font-mono text-purple-700 font-semibold">position</span>
                      <p className="text-xs text-slate-600 mt-1">Genomic position</p>
                    </div>
                    <div className="bg-white p-2 rounded border border-purple-100">
                      <span className="font-mono text-purple-700 font-semibold">genotype</span>
                      <p className="text-xs text-slate-600 mt-1">Your genotype (e.g., "TT", "CT", "AA")</p>
                    </div>
                  </div>

                  <div className="space-y-2 mt-3">
                    <div className="bg-blue-50 border border-blue-200 rounded p-3">
                      <p className="text-xs text-blue-800">
                        <strong>Supported formats:</strong> Tab-separated (.txt), comma-separated (.csv), or space-separated files
                      </p>
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded p-3">
                      <p className="text-xs text-green-800">
                        <strong>Automatic annotation:</strong> Clinically significant variants are automatically annotated with health insights
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-purple-100 border border-purple-300 rounded p-3">
                  <h5 className="font-semibold text-purple-900 text-sm mb-2">Example Variants Included:</h5>
                  <div className="grid grid-cols-2 gap-2 text-xs text-purple-800">
                    <div>• <strong>rs1801133</strong> - MTHFR (folate metabolism)</div>
                    <div>• <strong>rs429358</strong> - APOE (Alzheimer's risk)</div>
                    <div>• <strong>rs6025</strong> - Factor V Leiden (clotting)</div>
                    <div>• <strong>rs4988235</strong> - Lactose intolerance</div>
                    <div>• <strong>rs1065852</strong> - CYP2D6 (drug metabolism)</div>
                    <div>• <strong>rs9923231</strong> - VKORC1 (warfarin sensitivity)</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
          <h4 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Tips for Best Results
          </h4>
          <ul className="text-sm text-slate-700 space-y-1.5">
            <li>• Use UTF-8 encoding for all files</li>
            <li>• Include column headers in the first row</li>
            <li>• Use consistent date formats (YYYY-MM-DD recommended)</li>
            <li>• Remove any formatting, colors, or extra rows from spreadsheets</li>
            <li>• Ensure numeric values don't include commas or currency symbols</li>
            <li>• For genetic data, comment lines starting with "#" are automatically ignored</li>
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  )
}
