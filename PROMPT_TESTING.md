# OpenMed AI - Dev Prompt Engineering Setup

## Quick Start

### 1. Start the dev server
```bash
npm run dev
```

### 2. Test any prompt
```bash
npm run test-prompt "What are my latest blood test results?"
```

## Overview

This dev infrastructure allows you to test and refine AI prompts using realistic demo data. Changes to the system prompt in `/lib/ai.ts` hot reload automatically—no server restart needed!

## Demo User Profile

The dev endpoint uses a comprehensive demo profile:

### Patient Information
- **Age:** 35 years old
- **Gender:** Female
- **Weight:** 65.5 kg
- **Height:** 165 cm

### Current Health Conditions
- **Prediabetes** - HbA1c at 6.1% (prediabetic range)
- **Iron Deficiency Anemia** - Ferritin at 28 ng/mL (low)
- **Vitamin D Deficiency** - 22 ng/mL (low)

### Current Medications
- Metformin 500mg daily
- Iron supplement 65mg daily
- Vitamin D3 2000 IU daily

### Allergies
- Penicillin
- Shellfish

### Family History
- Type 2 diabetes (mother)
- Breast cancer (aunt)
- Heart disease (father)

### Lifestyle Factors
- Non-smoker
- Occasional alcohol consumption
- Moderate exercise routine
- Mediterranean diet
- 7 hours of sleep per night

## Available Test Data

### Blood Test Results (2 tests available)

#### Most Recent Test (June 15, 2025)
Complete metabolic panel with 53 biomarkers including:

**🔴 High Priority Concerns:**
- HbA1c: 6.1% (prediabetic range, ref: 4.0-5.7%)
- Ferritin: 28 ng/mL LOW (ref: 38-380)
- Vitamin D: 22 ng/mL LOW (ref: 30-100)
- Total Cholesterol: 245 mg/dL HIGH (ref: 0-200)
- LDL Cholesterol: 156 mg/dL HIGH (ref: 0-100)
- Triglycerides: 185 mg/dL HIGH (ref: 0-150)
- hs-CRP: 2.8 mg/L HIGH (inflammation, ref: 0-1)
- Calcium: 10.7 mg/dL HIGH (ref: 8.6-10.3)
- Glucose: 105 mg/dL HIGH (ref: 65-99)
- Iron: 198 mcg/dL HIGH (ref: 50-195)
- Iron Saturation: 69% HIGH (ref: 20-48%)

**✅ Normal Results:**
- Complete blood count (WBC, RBC, Hemoglobin, Platelets)
- Kidney function (Creatinine, eGFR, BUN)
- Liver function (AST, ALT, Bilirubin)
- Thyroid function (TSH, Free T4, Free T3)
- Electrolytes (Sodium, Potassium, Chloride)
- Testosterone levels

#### Previous Test (March 15, 2025)
15 key biomarkers showing trends over time:
- Ferritin: 95 ng/mL (was normal, now low)
- Vitamin D: 35.8 ng/mL (was borderline, now deficient)
- HbA1c: 5.2% (was normal, now prediabetic)
- Cholesterol panels showing worsening trend

### Genetic Data (16 variants available)

#### Pharmacogenomic Variants
- **CYP2D6**: Normal metabolizer (CC, TT, CC)
- **CYP2C9*3**: AT - Affects warfarin metabolism
- **VKORC1**: AA - Sensitive to warfarin (requires lower doses)

#### Disease Risk Variants
- **APOE**: ε3/ε2 genotype - Slightly protective against Alzheimer's
- **MTHFR C677T**: TT (homozygous) - ⚠️ Impaired folate metabolism, may need methylfolate supplementation
- **MTHFR A1298C**: AA - Normal

#### Food Sensitivities
- **Lactose intolerance**: GG - Lactose intolerant genotype
- **Celiac risk**: TT - Increased celiac disease risk

#### Other Variants
- **Factor V Leiden**: TT - Normal (no thrombosis risk)
- **BRCA1**: GG - Normal
- Plus several research-phase variants

## Example Test Prompts

### Blood Work Analysis
```bash
npm run test-prompt "What are my latest blood test results?"
npm run test-prompt "Show me my cholesterol trends over time"
npm run test-prompt "Are there any concerning biomarkers?"
npm run test-prompt "How has my HbA1c changed?"
npm run test-prompt "What does my iron panel show?"
```

### Genetic Analysis
```bash
npm run test-prompt "Do I have the MTHFR gene variant?"
npm run test-prompt "What genetic variants affect my medication metabolism?"
npm run test-prompt "Am I lactose intolerant based on my genetics?"
npm run test-prompt "What are my Alzheimer's risk factors?"
npm run test-prompt "Check my warfarin sensitivity genes"
```

### Comprehensive Health Analysis
```bash
npm run test-prompt "Give me a complete health summary"
npm run test-prompt "What lifestyle changes should I make?"
npm run test-prompt "How do my genetics relate to my blood work?"
npm run test-prompt "What supplements should I consider?"
npm run test-prompt "Analyze my cardiovascular risk"
```

### Edge Cases & Complex Queries
```bash
npm run test-prompt "Is my high iron saturation concerning given low ferritin?"
npm run test-prompt "How does my MTHFR variant affect my current medications?"
npm run test-prompt "What's the connection between my inflammation and cholesterol?"
npm run test-prompt "Should I be worried about my family history of diabetes?"
```

## Dev Endpoint Details

### Endpoint: `/api/dev/chat`

**Features:**
- ✅ No authentication required
- ✅ Automatically uses demo data
- ✅ No rate limits
- ✅ Hot reload support (prompt changes apply immediately)
- ✅ Full tool access (blood work, genetics, medical search)
- ✅ Streaming responses
- ✅ Dev-only (blocked in production)

### Request Format
```bash
curl -X POST http://localhost:3000/api/dev/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "Your question here"}
    ],
    "model": "gpt-4.1-mini"
  }'
```

### Response Format
Streaming AI SDK response with:
- Text content chunks
- Tool calls (queryBloodWork, queryGenetics, searchMedicalLiterature)
- Tool results

## Hot Reload Testing

1. Open `/lib/ai.ts`
2. Modify the `MEDICAL_AGENT_PROMPT` constant
3. Run test prompt immediately - changes apply automatically!
4. No server restart needed

## For AI Agents

If you're an AI agent looking to refine prompts:

1. **Endpoint**: `http://localhost:3000/api/dev/chat`
2. **Method**: POST
3. **Headers**: `Content-Type: application/json`
4. **Body**:
   ```json
   {
     "messages": [{"role": "user", "content": "YOUR_PROMPT"}],
     "model": "gpt-4.1-mini"
   }
   ```
5. **Response**: Streaming response with text and tool calls

The demo profile has realistic data with multiple health concerns, making it perfect for testing comprehensive analysis capabilities.

## Architecture

```
┌─────────────────────────────────────────┐
│  npm run test-prompt "question"         │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│  /api/dev/chat (dev only)               │
│  - No auth                              │
│  - Demo mode forced                     │
│  - No rate limits                       │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│  Tools with demo_mode=true              │
│  ├─ BloodWorkTool → demo_blood_tests    │
│  ├─ GeneticTool → demo_genetic_variants │
│  └─ MedicalSearchTool                   │
└─────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│  Demo Supabase Tables                   │
│  ├─ demo_blood_test_results (2 tests)  │
│  ├─ demo_genetics_variants (16 SNPs)   │
│  └─ demo_medical_profiles (1 profile)  │
└─────────────────────────────────────────┘
```

## Troubleshooting

### "No AI model configured"
- Check `.env.local` has `OPENAI_API_KEY` set
- Restart dev server after adding key

### "Dev endpoint not available"
- Only works when `NODE_ENV=development`
- Make sure you're running `npm run dev`, not `npm start`

### "Connection refused"
- Dev server must be running on localhost:3000
- Check server is started: `npm run dev`

### No demo data returned
- Run demo data setup: `psql -f demo-data-setup.sql`
- Verify tables exist in Supabase dashboard

## Next Steps

1. Test with various prompts to see current behavior
2. Modify `MEDICAL_AGENT_PROMPT` in `/lib/ai.ts`
3. Re-run prompts to test improvements
4. Iterate until satisfied with responses
5. Deploy changes (prompt updates are safe to push)
