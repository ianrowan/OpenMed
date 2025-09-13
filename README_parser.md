# Quest Diagnostics JSON to CSV Parser

This script converts Quest Diagnostics JSON data to a standardized CSV format compatible with the OpenMed bloodwork parser.

## Usage

```bash
# Basic usage (uses default files)
node parse_quest_data.js

# Specify input and output files
node parse_quest_data.js input_data.json output_bloodwork.csv
```

## Input Format

The script expects a JSON file with Quest Diagnostics data structure:

```json
{
  "data": {
    "biomarkerResultsRecord": [
      {
        "questBiomarkerId": "30000000",
        "rangeMin": "3.8",
        "rangeMax": "10.8",
        "currentResult": {
          "calculatedResult": "4.3",
          "dateOfService": "2025-08-30",
          "inRange": true
        },
        "outOfRangeType": "in_range",
        "units": "Thousand/uL",
        "biomarker": {
          "name": "White Blood Cell (WBC) Count"
        }
      }
    ]
  }
}
```

## Output Format

The script generates a CSV file with the following columns:

- **Biomarker**: Human-readable name of the biomarker
- **Value**: Test result value
- **Unit**: Measurement unit (standardized)
- **Reference_Min**: Lower reference range
- **Reference_Max**: Upper reference range  
- **Status**: normal, high, low, or critical
- **Date**: Date of service
- **Lab**: Laboratory name (defaults to Quest Diagnostics)

## Example Output

```csv
Biomarker,Value,Unit,Reference_Min,Reference_Max,Status,Date,Lab
White Blood Cell (WBC) Count,4.3,10³/μL,3.8,10.8,normal,2025-08-30,Quest Diagnostics
Red Blood Cell (RBC) Count,4.96,10⁶/μL,4.20,5.80,normal,2025-08-30,Quest Diagnostics
Hemoglobin,15.7,g/dL,13.2,17.1,normal,2025-08-30,Quest Diagnostics
```

## Features

- ✅ Converts Quest biomarker IDs to human-readable names
- ✅ **Filters out non-numeric values** (e.g., "NEGATIVE", "YELLOW", "POSITIVE")
- ✅ **Provides default units** ("units") when unit information is missing
- ✅ **Safe reference ranges** (uses -999999/999999 for missing min/max values)
- ✅ Standardizes units (e.g., Thousand/uL → 10³/μL)
- ✅ Determines status from Quest range indicators
- ✅ Handles missing data gracefully
- ✅ Provides detailed progress output
- ✅ Compatible with OpenMed bloodwork uploader

## Data Handling

### **Reference Ranges:**
- Valid ranges: Uses provided min/max values
- Missing ranges: Uses -999999 (min) and 999999 (max) as safe extremes
- Ensures all records have numeric reference values for analysis

### **Units:**
- Standardizes common medical units (e.g., Thousand/uL → 10³/μL)
- Provides "units" as default when unit information is missing
- Ensures every biomarker has a unit designation

## Numeric Value Filtering

The parser automatically skips records with non-numeric values, including:
- Text results like "NEGATIVE", "POSITIVE", "DETECTED"
- Color descriptions like "YELLOW", "CLEAR"
- Qualitative results like "NORMAL", "ABNORMAL"
- Blood type results like "AB", "RH(D) NEGATIVE"

Only biomarkers with valid numeric values are included in the output CSV.

## Error Handling

The script will:
- Skip records missing essential data
- Warn about incomplete records
- Provide clear error messages for invalid JSON
- Exit gracefully with helpful feedback

## Notes

- The parser assumes Quest Diagnostics as the lab source
- Missing dates default to 2024-01-01
- Only processes records with valid results and biomarker names
- Supports both `calculatedResult` and `displayResult` fields
