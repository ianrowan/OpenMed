-- OpenMed Demo Data Setup
-- Run this in Supabase SQL Editor to create demonstration data
-- ============================================================

-- STEP 1: Create demo tables (independent of user authentication)

-- Demo blood test results table
CREATE TABLE IF NOT EXISTS public.demo_blood_test_results (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    test_date date NOT NULL,
    lab_name text NOT NULL,
    biomarkers jsonb NOT NULL,
    uploaded_at timestamptz DEFAULT now(),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Demo genetics variants table
CREATE TABLE IF NOT EXISTS public.demo_genetics_variants (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    rsid text NOT NULL,
    genotype text NOT NULL,
    source text,
    chromosome text,
    position bigint,
    gene_symbol text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Demo medical profile table
CREATE TABLE IF NOT EXISTS public.demo_medical_profiles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    age integer,
    gender text,
    weight numeric,
    height numeric,
    conditions text[],
    medications text[],
    allergies text[],
    family_history text[],
    lifestyle_factors jsonb,
    biomarker_preferences jsonb,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- STEP 2: Insert Demo Blood Test Results
-- Multiple test dates to show trends over time

-- Most recent blood work (3 months ago) - Complete panel with all biomarkers
INSERT INTO public.demo_blood_test_results (
    id,
    test_date,
    lab_name,
    biomarkers,
    uploaded_at,
    created_at,
    updated_at
) VALUES (
    '11111111-0000-0000-0000-000000000001'::uuid,
    '2025-06-15'::date,
    'Quest Diagnostics - Demo Lab',
    '[
        {
            "biomarker": "White Blood Cell (WBC) Count",
            "value": 7.2,
            "unit": "10³/μL",
            "status": "normal",
            "referenceMin": 3.8,
            "referenceMax": 10.8
        },
        {
            "biomarker": "Red Blood Cell (RBC) Count",
            "value": 4.44,
            "unit": "10⁶/μL",
            "status": "normal",
            "referenceMin": 4.2,
            "referenceMax": 5.8
        },
        {
            "biomarker": "Hemoglobin",
            "value": 13.8,
            "unit": "g/dL",
            "status": "normal",
            "referenceMin": 13.2,
            "referenceMax": 17.1
        },
        {
            "biomarker": "Hematocrit",
            "value": 42.3,
            "unit": "%",
            "status": "normal",
            "referenceMin": 38.5,
            "referenceMax": 50
        },
        {
            "biomarker": "Mean Corpuscular Volume (MCV)",
            "value": 89.2,
            "unit": "fL",
            "status": "normal",
            "referenceMin": 80,
            "referenceMax": 100
        },
        {
            "biomarker": "Mean Corpuscular Hemoglobin (MCH)",
            "value": 29.1,
            "unit": "pg",
            "status": "normal",
            "referenceMin": 27,
            "referenceMax": 33
        },
        {
            "biomarker": "Mean Corpuscular Hemoglobin Concentration (MCHC)",
            "value": 34.2,
            "unit": "g/dL",
            "status": "normal",
            "referenceMin": 32,
            "referenceMax": 36
        },
        {
            "biomarker": "Red Cell Distribution Width (RDW)",
            "value": 13.7,
            "unit": "%",
            "status": "normal",
            "referenceMin": 11,
            "referenceMax": 15
        },
        {
            "biomarker": "Platelet Count",
            "value": 267,
            "unit": "10³/μL",
            "status": "normal",
            "referenceMin": 140,
            "referenceMax": 400
        },
        {
            "biomarker": "Mean Platelet Volume (MPV)",
            "value": 9.4,
            "unit": "fL",
            "status": "normal",
            "referenceMin": 7.5,
            "referenceMax": 12.5
        },
        {
            "biomarker": "Neutrophils",
            "value": 4320,
            "unit": "cells/μL",
            "status": "normal",
            "referenceMin": 1500,
            "referenceMax": 7800
        },
        {
            "biomarker": "Lymphocytes",
            "value": 2155,
            "unit": "cells/μL",
            "status": "normal",
            "referenceMin": 850,
            "referenceMax": 3900
        },
        {
            "biomarker": "Monocytes",
            "value": 580,
            "unit": "cells/μL",
            "status": "normal",
            "referenceMin": 200,
            "referenceMax": 950
        },
        {
            "biomarker": "Eosinophils",
            "value": 125,
            "unit": "cells/μL",
            "status": "normal",
            "referenceMin": 15,
            "referenceMax": 500
        },
        {
            "biomarker": "Basophils",
            "value": 20,
            "unit": "cells/μL",
            "status": "normal",
            "referenceMin": 0,
            "referenceMax": 200
        },
        {
            "biomarker": "Ferritin",
            "value": 28,
            "unit": "ng/mL",
            "status": "low",
            "referenceMin": 38,
            "referenceMax": 380
        },
        {
            "biomarker": "Thyroxine (T4) Free",
            "value": 1.23,
            "unit": "ng/dL",
            "status": "normal",
            "referenceMin": 0.8,
            "referenceMax": 1.8
        },
        {
            "biomarker": "Thyroid-Stimulating Hormone (TSH)",
            "value": 2.95,
            "unit": "mIU/L",
            "status": "normal",
            "referenceMin": 0.4,
            "referenceMax": 4.5
        },
        {
            "biomarker": "Triiodothyronine (T3) Free",
            "value": 3.8,
            "unit": "pg/mL",
            "status": "normal",
            "referenceMin": 2.3,
            "referenceMax": 4.2
        },
        {
            "biomarker": "Vitamin D",
            "value": 22,
            "unit": "ng/mL",
            "status": "low",
            "referenceMin": 30,
            "referenceMax": 100
        },
        {
            "biomarker": "Hemoglobin A1c (HbA1c)",
            "value": 6.1,
            "unit": "%",
            "status": "high",
            "referenceMin": 4.0,
            "referenceMax": 5.7
        },
        {
            "biomarker": "Iron",
            "value": 198,
            "unit": "mcg/dL",
            "status": "high",
            "referenceMin": 50,
            "referenceMax": 195
        },
        {
            "biomarker": "Iron Binding Capacity",
            "value": 285,
            "unit": "mcg/dL",
            "status": "normal",
            "referenceMin": 250,
            "referenceMax": 425
        },
        {
            "biomarker": "Iron % Saturation",
            "value": 69,
            "unit": "%",
            "status": "high",
            "referenceMin": 20,
            "referenceMax": 48
        },
        {
            "biomarker": "Uric Acid",
            "value": 7.2,
            "unit": "mg/dL",
            "status": "normal",
            "referenceMin": 4,
            "referenceMax": 8
        },
        {
            "biomarker": "Glucose",
            "value": 105,
            "unit": "mg/dL",
            "status": "high",
            "referenceMin": 65,
            "referenceMax": 99
        },
        {
            "biomarker": "Blood Urea Nitrogen (BUN)",
            "value": 23,
            "unit": "mg/dL",
            "status": "normal",
            "referenceMin": 7,
            "referenceMax": 25
        },
        {
            "biomarker": "Creatinine",
            "value": 1.18,
            "unit": "mg/dL",
            "status": "normal",
            "referenceMin": 0.6,
            "referenceMax": 1.24
        },
        {
            "biomarker": "Creatinine-Based Estimated Glomerular Filtration Rate (eGFR)",
            "value": 78,
            "unit": "mL/min/1.73m²",
            "status": "normal",
            "referenceMin": 60,
            "referenceMax": 999
        },
        {
            "biomarker": "Sodium",
            "value": 138,
            "unit": "mmol/L",
            "status": "normal",
            "referenceMin": 135,
            "referenceMax": 146
        },
        {
            "biomarker": "Potassium",
            "value": 3.9,
            "unit": "mmol/L",
            "status": "normal",
            "referenceMin": 3.5,
            "referenceMax": 5.3
        },
        {
            "biomarker": "Chloride",
            "value": 106,
            "unit": "mmol/L",
            "status": "normal",
            "referenceMin": 98,
            "referenceMax": 110
        },
        {
            "biomarker": "Carbon Dioxide",
            "value": 24,
            "unit": "mmol/L",
            "status": "normal",
            "referenceMin": 20,
            "referenceMax": 32
        },
        {
            "biomarker": "Calcium",
            "value": 10.7,
            "unit": "mg/dL",
            "status": "high",
            "referenceMin": 8.6,
            "referenceMax": 10.3
        },
        {
            "biomarker": "Total Protein",
            "value": 6.8,
            "unit": "g/dL",
            "status": "normal",
            "referenceMin": 6.1,
            "referenceMax": 8.1
        },
        {
            "biomarker": "Albumin",
            "value": 4.2,
            "unit": "g/dL",
            "status": "normal",
            "referenceMin": 3.6,
            "referenceMax": 5.1
        },
        {
            "biomarker": "Globulin",
            "value": 2.6,
            "unit": "g/dL",
            "status": "normal",
            "referenceMin": 1.9,
            "referenceMax": 3.7
        },
        {
            "biomarker": "Albumin / Globulin Ratio",
            "value": 1.6,
            "unit": "ratio",
            "status": "normal",
            "referenceMin": 1,
            "referenceMax": 2.5
        },
        {
            "biomarker": "Total Bilirubin",
            "value": 0.8,
            "unit": "mg/dL",
            "status": "normal",
            "referenceMin": 0.2,
            "referenceMax": 1.2
        },
        {
            "biomarker": "Alkaline Phosphatase (ALP)",
            "value": 89,
            "unit": "U/L",
            "status": "normal",
            "referenceMin": 36,
            "referenceMax": 130
        },
        {
            "biomarker": "Aspartate Aminotransferase (AST)",
            "value": 31,
            "unit": "U/L",
            "status": "normal",
            "referenceMin": 10,
            "referenceMax": 40
        },
        {
            "biomarker": "Alanine Transaminase (ALT)",
            "value": 42,
            "unit": "U/L",
            "status": "normal",
            "referenceMin": 9,
            "referenceMax": 46
        },
        {
            "biomarker": "High-Sensitivity C-Reactive Protein (hs-CRP)",
            "value": 2.8,
            "unit": "mg/L",
            "status": "high",
            "referenceMin": 0,
            "referenceMax": 1
        },
        {
            "biomarker": "Magnesium",
            "value": 4.7,
            "unit": "mg/dL",
            "status": "normal",
            "referenceMin": 4,
            "referenceMax": 6.4
        },
        {
            "biomarker": "Total Cholesterol",
            "value": 245,
            "unit": "mg/dL",
            "status": "high",
            "referenceMin": 0,
            "referenceMax": 200
        },
        {
            "biomarker": "HDL-Cholesterol",
            "value": 52,
            "unit": "mg/dL",
            "status": "normal",
            "referenceMin": 40,
            "referenceMax": 999
        },
        {
            "biomarker": "Triglycerides",
            "value": 185,
            "unit": "mg/dL",
            "status": "high",
            "referenceMin": 0,
            "referenceMax": 150
        },
        {
            "biomarker": "LDL-Cholesterol",
            "value": 156,
            "unit": "mg/dL",
            "status": "high",
            "referenceMin": 0,
            "referenceMax": 100
        },
        {
            "biomarker": "Total Cholesterol / HDL Ratio",
            "value": 4.7,
            "unit": "ratio",
            "status": "high",
            "referenceMin": 0,
            "referenceMax": 3.5
        },
        {
            "biomarker": "Non-HDL Cholesterol",
            "value": 193,
            "unit": "mg/dL",
            "status": "high",
            "referenceMin": 0,
            "referenceMax": 130
        },
        {
            "biomarker": "Testosterone Total",
            "value": 680,
            "unit": "ng/dL",
            "status": "normal",
            "referenceMin": 250,
            "referenceMax": 1100
        },
        {
            "biomarker": "Testosterone Free",
            "value": 126,
            "unit": "pg/mL",
            "status": "normal",
            "referenceMin": 35,
            "referenceMax": 155
        },
        {
            "biomarker": "Thyroid Peroxidase Antibodies (TPO)",
            "value": 3,
            "unit": "IU/mL",
            "status": "normal",
            "referenceMin": 0,
            "referenceMax": 9
        },
        {
            "biomarker": "Biological Age",
            "value": 32.8,
            "unit": "Years",
            "status": "high",
            "referenceMin": 29.2,
            "referenceMax": 29.2
        }
    ]'::jsonb,
    NOW(),
    NOW(),
    NOW()
);

-- Older blood work (6 months ago) to show trends - subset of key markers with variations
INSERT INTO public.demo_blood_test_results (
    id,
    test_date,
    lab_name,
    biomarkers,
    uploaded_at,
    created_at,
    updated_at
) VALUES (
    '11111111-0000-0000-0000-000000000002'::uuid,
    '2025-03-15'::date,
    'LabCorp - Demo Lab',
    '[
        {
            "biomarker": "Hemoglobin",
            "value": 15.1,
            "unit": "g/dL",
            "status": "normal",
            "referenceMin": 13.2,
            "referenceMax": 17.1
        },
        {
            "biomarker": "Hematocrit",
            "value": 46.8,
            "unit": "%",
            "status": "normal",
            "referenceMin": 38.5,
            "referenceMax": 50
        },
        {
            "biomarker": "Ferritin",
            "value": 95,
            "unit": "ng/mL",
            "status": "normal",
            "referenceMin": 38,
            "referenceMax": 380
        },
        {
            "biomarker": "Thyroid-Stimulating Hormone (TSH)",
            "value": 3.22,
            "unit": "mIU/L",
            "status": "normal",
            "referenceMin": 0.4,
            "referenceMax": 4.5
        },
        {
            "biomarker": "Thyroxine (T4) Free",
            "value": 1.45,
            "unit": "ng/dL",
            "status": "normal",
            "referenceMin": 0.8,
            "referenceMax": 1.8
        },
        {
            "biomarker": "Vitamin D",
            "value": 35.8,
            "unit": "ng/mL",
            "status": "normal",
            "referenceMin": 30,
            "referenceMax": 100
        },
        {
            "biomarker": "Hemoglobin A1c (HbA1c)",
            "value": 5.2,
            "unit": "%",
            "status": "normal",
            "referenceMin": 4.0,
            "referenceMax": 5.7
        },
        {
            "biomarker": "Total Cholesterol",
            "value": 188,
            "unit": "mg/dL",
            "status": "normal",
            "referenceMin": 0,
            "referenceMax": 200
        },
        {
            "biomarker": "HDL-Cholesterol",
            "value": 58,
            "unit": "mg/dL",
            "status": "normal",
            "referenceMin": 40,
            "referenceMax": 999
        },
        {
            "biomarker": "LDL-Cholesterol",
            "value": 108,
            "unit": "mg/dL",
            "status": "high",
            "referenceMin": 0,
            "referenceMax": 100
        },
        {
            "biomarker": "Triglycerides",
            "value": 92,
            "unit": "mg/dL",
            "status": "normal",
            "referenceMin": 0,
            "referenceMax": 150
        },
        {
            "biomarker": "Glucose",
            "value": 87,
            "unit": "mg/dL",
            "status": "normal",
            "referenceMin": 65,
            "referenceMax": 99
        },
        {
            "biomarker": "Creatinine",
            "value": 1.02,
            "unit": "mg/dL",
            "status": "normal",
            "referenceMin": 0.6,
            "referenceMax": 1.24
        },
        {
            "biomarker": "Iron",
            "value": 165,
            "unit": "mcg/dL",
            "status": "normal",
            "referenceMin": 50,
            "referenceMax": 195
        },
        {
            "biomarker": "Thyroid Peroxidase Antibodies (TPO)",
            "value": 2,
            "unit": "IU/mL",
            "status": "normal",
            "referenceMin": 0,
            "referenceMax": 9
        }
    ]'::jsonb,
    NOW(),
    NOW(),
    NOW()
);

-- STEP 3: Insert Demo Genetic Variants
-- Include important pharmacogenomic and health-related variants

INSERT INTO public.demo_genetics_variants (id, rsid, genotype, source, created_at, updated_at) VALUES
-- CYP2D6 variants (drug metabolism)
('22222222-0000-0000-0000-000000000001'::uuid, 'rs1065852', 'CC', '23andme', NOW(), NOW()),
('22222222-0000-0000-0000-000000000002'::uuid, 'rs3892097', 'TT', '23andme', NOW(), NOW()),
('22222222-0000-0000-0000-000000000003'::uuid, 'rs28371725', 'CC', '23andme', NOW(), NOW()),

-- APOE variants (Alzheimer''s risk)
('22222222-0000-0000-0000-000000000004'::uuid, 'rs429358', 'TT', '23andme', NOW(), NOW()),
('22222222-0000-0000-0000-000000000005'::uuid, 'rs7412', 'CT', '23andme', NOW(), NOW()),

-- MTHFR variants (folate metabolism)
('22222222-0000-0000-0000-000000000006'::uuid, 'rs1801133', 'TT', '23andme', NOW(), NOW()),
('22222222-0000-0000-0000-000000000007'::uuid, 'rs1801131', 'AA', '23andme', NOW(), NOW()),

-- Factor V Leiden (thrombosis risk)
('22222222-0000-0000-0000-000000000008'::uuid, 'rs6025', 'TT', '23andme', NOW(), NOW()),

-- BRCA1 pathogenic variant (breast cancer risk)
('22222222-0000-0000-0000-000000000009'::uuid, 'rs80357906', 'GG', '23andme', NOW(), NOW()),

-- Lactose intolerance
('22222222-0000-0000-0000-000000000010'::uuid, 'rs4988235', 'GG', '23andme', NOW(), NOW()),

-- Celiac disease risk
('22222222-0000-0000-0000-000000000011'::uuid, 'rs2187668', 'TT', '23andme', NOW(), NOW()),

-- Warfarin sensitivity (CYP2C9)
('22222222-0000-0000-0000-000000000012'::uuid, 'rs1799853', 'AA', '23andme', NOW(), NOW()),
('22222222-0000-0000-0000-000000000013'::uuid, 'rs1057910', 'AT', '23andme', NOW(), NOW()),

-- VKORC1 (warfarin dosing)
('22222222-0000-0000-0000-000000000014'::uuid, 'rs9923231', 'AA', '23andme', NOW(), NOW()),

-- Some variants not in clinical database (like the one user mentioned)
('22222222-0000-0000-0000-000000000015'::uuid, 'rs28931614', 'TT', '23andme', NOW(), NOW()),
('22222222-0000-0000-0000-000000000016'::uuid, 'rs12345678', 'TT', '23andme', NOW(), NOW());

-- STEP 4: Create a demo medical profile
INSERT INTO public.demo_medical_profiles (
    id,
    age,
    gender,
    weight,
    height,
    conditions,
    medications,
    allergies,
    family_history,
    lifestyle_factors,
    biomarker_preferences,
    created_at,
    updated_at
) VALUES (
    '33333333-0000-0000-0000-000000000001'::uuid,
    35,
    'Female',
    65.5,
    165,
    ARRAY['Prediabetes', 'Iron deficiency anemia', 'Vitamin D deficiency'],
    ARRAY['Metformin 500mg daily', 'Iron supplement 65mg daily', 'Vitamin D3 2000 IU daily'],
    ARRAY['Penicillin', 'Shellfish'],
    ARRAY['Type 2 diabetes (mother)', 'Breast cancer (aunt)', 'Heart disease (father)'],
    '{
        "smoking": false,
        "alcohol": "occasional",
        "exercise": "moderate",
        "diet": "mediterranean",
        "sleep": 7
    }'::jsonb,
    '{
        "focus_areas": ["cardiovascular", "diabetes", "nutrition"],
        "alert_thresholds": {
            "cholesterol": 200,
            "hba1c": 5.7,
            "vitamin_d": 30
        }
    }'::jsonb,
    NOW(),
    NOW()
);

-- STEP 5: Success message
SELECT 'Demo data created successfully! 
- Demo tables: demo_blood_test_results, demo_genetics_variants, demo_medical_profiles
- Blood test results: 2 sets (showing trends over time)
- Genetic variants: 16 variants including pharmacogenomic markers
- Medical profile: Complete with conditions and medications

You can now toggle Demo Mode in the chat interface to use this data.' as message;
