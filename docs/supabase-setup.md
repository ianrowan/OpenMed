# Supabase Setup Guide for OpenMed

## 🚀 Quick Setup

### 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com) and create an account
2. Click "New Project"
3. Choose your organization and set:
   - **Project Name**: `openmed-ai`
   - **Database Password**: Choose a strong password
   - **Region**: Select closest to your users

### 2. Get Your Credentials
After project creation, go to **Settings > API**:

```bash
# Copy these to your .env.local file
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 3. Configure Environment
Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

## 🗄️ Database Setup

### 1. Run SQL Setup Scripts
In your Supabase dashboard, go to **SQL Editor** and run these scripts in order:

1. **Enable Extensions** (see `supabase/01-extensions.sql`)
2. **Create Tables** (see `supabase/02-tables.sql`)
3. **Setup RLS Policies** (see `supabase/03-policies.sql`)
4. **Create Functions** (see `supabase/04-functions.sql`)

### 2. Enable Authentication
In **Authentication > Settings**:
- Enable Email/Password auth
- Configure redirect URLs for your domain
- Set up any social providers (optional)

## 📊 Data Schemas

### Blood Test Results
```sql
CREATE TABLE blood_test_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  test_date DATE NOT NULL,
  lab_name TEXT,
  biomarkers JSONB NOT NULL, -- Array of biomarker objects
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Biomarker Object Structure:**
```typescript
interface Biomarker {
  name: string              // "Total Cholesterol"
  value: number            // 245
  unit: string             // "mg/dL"
  reference_range: {
    min: number            // 0
    max: number            // 200
    optimal?: {
      min: number          // 150
      max: number          // 180
    }
  }
  status: 'normal' | 'high' | 'low' | 'critical_high' | 'critical_low'
  notes?: string
}
```

**Example Blood Test Record:**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "user_id": "user-123",
  "test_date": "2024-01-15",
  "lab_name": "Quest Diagnostics",
  "biomarkers": [
    {
      "name": "Total Cholesterol",
      "value": 245,
      "unit": "mg/dL",
      "reference_range": { "min": 0, "max": 200 },
      "status": "high"
    },
    {
      "name": "HDL Cholesterol", 
      "value": 38,
      "unit": "mg/dL",
      "reference_range": { "min": 40, "max": 100 },
      "status": "low"
    }
  ]
}
```

### Genetic Data
```sql
CREATE TABLE genetic_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  source TEXT NOT NULL, -- '23andme', 'ancestry', 'other'
  snps JSONB NOT NULL,  -- Array of SNP objects
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);
```

**SNP Object Structure:**
```typescript
interface SNP {
  rsid: string             // "rs1801133"
  chromosome: string       // "1"
  position: number         // 11796321
  genotype: string         // "CT", "TT", "CC"
  gene?: string           // "MTHFR"
  annotation?: {
    phenotype?: string              // "Folate metabolism"
    clinical_significance?: string  // "pathogenic", "benign", "risk_factor"
    disease_association?: string    // "Cardiovascular disease"
    drug_response?: string          // "Affects warfarin sensitivity"
    risk_level?: 'low' | 'moderate' | 'high'
  }
}
```

**Example Genetic Data Record:**
```json
{
  "id": "456e7890-e89b-12d3-a456-426614174000",
  "user_id": "user-123",
  "source": "23andme",
  "snps": [
    {
      "rsid": "rs1801133",
      "chromosome": "1", 
      "position": 11796321,
      "genotype": "CT",
      "gene": "MTHFR",
      "annotation": {
        "phenotype": "Folate metabolism",
        "clinical_significance": "risk_factor",
        "disease_association": "Cardiovascular disease",
        "risk_level": "moderate"
      }
    }
  ]
}
```

## 🔍 Common Biomarkers Reference

### Lipid Panel
- **Total Cholesterol**: < 200 mg/dL (optimal: 150-180)
- **LDL Cholesterol**: < 100 mg/dL (optimal: < 70)
- **HDL Cholesterol**: > 40 mg/dL men, > 50 mg/dL women
- **Triglycerides**: < 150 mg/dL

### Metabolic Panel
- **Glucose**: 70-99 mg/dL (optimal: 80-90)
- **HbA1c**: < 5.7% (optimal: < 5.0%)
- **Insulin**: 2.6-24.9 μIU/mL

### Complete Blood Count
- **White Blood Cells**: 4.5-11.0 × 10³/μL
- **Red Blood Cells**: 4.2-5.4 × 10⁶/μL
- **Hemoglobin**: 12.0-16.0 g/dL
- **Hematocrit**: 36-46%
- **Platelets**: 150-450 × 10³/μL

### Liver Function
- **ALT**: 7-56 U/L
- **AST**: 10-40 U/L
- **Alkaline Phosphatase**: 44-147 U/L
- **Total Bilirubin**: 0.2-1.2 mg/dL

### Kidney Function
- **Creatinine**: 0.6-1.2 mg/dL
- **BUN**: 7-20 mg/dL
- **eGFR**: > 60 mL/min/1.73m²

### Vitamins & Minerals
- **Vitamin D**: 30-100 ng/mL (optimal: 40-60)
- **Vitamin B12**: 200-900 pg/mL
- **Folate**: 3-17 ng/mL
- **Iron**: 60-170 μg/dL
- **Ferritin**: 12-300 ng/mL

## 🧬 Common Genetic Variants

### Cardiovascular Risk
- **rs1333049** (CDKN2A/CDKN2B): Coronary artery disease
- **rs4977574** (CDKN2A/CDKN2B): Heart disease risk
- **rs1801282** (PPARG): Type 2 diabetes risk

### Pharmacogenomics
- **rs1065852** (CYP2D6): Drug metabolism
- **rs4149056** (SLCO1B1): Statin-induced myopathy
- **rs1051740** (CYP2A6): Nicotine metabolism

### Nutrient Metabolism
- **rs4988235** (LCT): Lactose tolerance
- **rs1801133** (MTHFR): Folate metabolism
- **rs1229984** (ADH1B): Alcohol metabolism

## 🔐 Security Notes

1. **Row Level Security**: All tables use RLS policies
2. **User Isolation**: Data is automatically filtered by user_id
3. **API Keys**: Keep service role key secure (server-side only)
4. **HIPAA Compliance**: Consider Supabase Pro for healthcare compliance

## 📝 Data Upload Examples

See the `/components/data/file-upload.tsx` component for examples of:
- CSV blood work parsing
- 23andMe raw data processing
- Data validation and transformation

## 🛠️ Development Tips

1. **Local Development**: Use Supabase CLI for local development
2. **Type Safety**: Use the generated types from `types/database.ts`
3. **Real-time**: Enable real-time subscriptions for live updates
4. **Storage**: Use Supabase Storage for file uploads (lab reports, etc.)

## 🚀 Next Steps

1. Set up your Supabase project
2. Run the SQL scripts
3. Configure your environment variables
4. Test with the built-in file upload component
5. Customize biomarker ranges for your use case
