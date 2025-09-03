-- Sample data for testing OpenMed
-- Run this after setting up tables and policies
-- This creates demo data for testing purposes

-- Sample blood test data
INSERT INTO public.blood_test_results (
  user_id,
  test_date,
  lab_name,
  biomarkers
) VALUES (
  auth.uid(), -- Current user
  '2024-01-15',
  'Quest Diagnostics',
  '[
    {
      "name": "Total Cholesterol",
      "value": 245,
      "unit": "mg/dL",
      "reference_range": {"min": 0, "max": 200},
      "status": "high"
    },
    {
      "name": "HDL Cholesterol",
      "value": 38,
      "unit": "mg/dL", 
      "reference_range": {"min": 40, "max": 100},
      "status": "low"
    },
    {
      "name": "LDL Cholesterol",
      "value": 165,
      "unit": "mg/dL",
      "reference_range": {"min": 0, "max": 100},
      "status": "high"
    },
    {
      "name": "Triglycerides",
      "value": 210,
      "unit": "mg/dL",
      "reference_range": {"min": 0, "max": 150},
      "status": "high"
    },
    {
      "name": "Glucose",
      "value": 95,
      "unit": "mg/dL",
      "reference_range": {"min": 70, "max": 99},
      "status": "normal"
    },
    {
      "name": "Hemoglobin A1C",
      "value": 5.4,
      "unit": "%",
      "reference_range": {"min": 4.0, "max": 5.6},
      "status": "normal"
    },
    {
      "name": "Vitamin D",
      "value": 25,
      "unit": "ng/mL",
      "reference_range": {"min": 30, "max": 100},
      "status": "low"
    },
    {
      "name": "C-Reactive Protein",
      "value": 4.2,
      "unit": "mg/L",
      "reference_range": {"min": 0, "max": 3.0},
      "status": "high"
    }
  ]'::jsonb
);

-- Sample genetic data
INSERT INTO public.genetic_data (
  user_id,
  source,
  snps
) VALUES (
  auth.uid(), -- Current user
  '23andme',
  '[
    {
      "rsid": "rs4988235",
      "chromosome": "2",
      "position": 136608646,
      "genotype": "CT",
      "gene": "LCT",
      "annotation": {
        "phenotype": "Lactose tolerance",
        "clinical_significance": "benign",
        "disease_association": "Lactose intolerance",
        "risk_level": "low"
      }
    },
    {
      "rsid": "rs1801133",
      "chromosome": "1", 
      "position": 11796321,
      "genotype": "TT",
      "gene": "MTHFR",
      "annotation": {
        "phenotype": "Folate metabolism",
        "clinical_significance": "risk_factor",
        "disease_association": "Cardiovascular disease risk",
        "risk_level": "moderate"
      }
    },
    {
      "rsid": "rs7903146",
      "chromosome": "10",
      "position": 114758349,
      "genotype": "CT",
      "gene": "TCF7L2",
      "annotation": {
        "phenotype": "Type 2 diabetes risk",
        "clinical_significance": "risk_factor",
        "disease_association": "Type 2 diabetes",
        "risk_level": "moderate"
      }
    },
    {
      "rsid": "rs1065852",
      "chromosome": "22",
      "position": 42526694,
      "genotype": "CC",
      "gene": "CYP2D6",
      "annotation": {
        "phenotype": "Drug metabolism",
        "drug_response": "Normal metabolism of CYP2D6 substrates",
        "risk_level": "low"
      }
    },
    {
      "rsid": "rs4149056",
      "chromosome": "12",
      "position": 21331549,
      "genotype": "TT",
      "gene": "SLCO1B1",
      "annotation": {
        "phenotype": "Statin sensitivity",
        "drug_response": "Normal risk for statin-induced myopathy",
        "clinical_significance": "benign",
        "risk_level": "low"
      }
    }
  ]'::jsonb
);

-- Sample follow-up blood test (3 months later)
INSERT INTO public.blood_test_results (
  user_id,
  test_date,
  lab_name,
  biomarkers
) VALUES (
  auth.uid(),
  '2024-04-15',
  'LabCorp',
  '[
    {
      "name": "Total Cholesterol",
      "value": 195,
      "unit": "mg/dL",
      "reference_range": {"min": 0, "max": 200},
      "status": "normal"
    },
    {
      "name": "HDL Cholesterol",
      "value": 45,
      "unit": "mg/dL",
      "reference_range": {"min": 40, "max": 100},
      "status": "normal"
    },
    {
      "name": "LDL Cholesterol",
      "value": 120,
      "unit": "mg/dL",
      "reference_range": {"min": 0, "max": 100},
      "status": "high"
    },
    {
      "name": "Triglycerides",
      "value": 150,
      "unit": "mg/dL",
      "reference_range": {"min": 0, "max": 150},
      "status": "normal"
    },
    {
      "name": "Glucose",
      "value": 88,
      "unit": "mg/dL",
      "reference_range": {"min": 70, "max": 99},
      "status": "normal"
    },
    {
      "name": "Hemoglobin A1C",
      "value": 5.2,
      "unit": "%",
      "reference_range": {"min": 4.0, "max": 5.6},
      "status": "normal"
    },
    {
      "name": "Vitamin D",
      "value": 42,
      "unit": "ng/mL",
      "reference_range": {"min": 30, "max": 100},
      "status": "normal"
    },
    {
      "name": "C-Reactive Protein",
      "value": 1.8,
      "unit": "mg/L",
      "reference_range": {"min": 0, "max": 3.0},
      "status": "normal"
    }
  ]'::jsonb
);
