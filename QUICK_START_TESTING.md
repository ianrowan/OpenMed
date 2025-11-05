# Quick Reference: Prompt Testing

## Start Testing in 3 Steps

1. **Start dev server** (if not already running):
   ```bash
   npm run dev
   ```

2. **Run any prompt**:
   ```bash
   npm run test-prompt "Your question here"
   ```

3. **Edit prompts** in `/lib/ai.ts` - changes apply immediately!

## Example Commands

```bash
# Blood work analysis
npm run test-prompt "What are my latest blood test results?"
npm run test-prompt "Show me cholesterol trends over time"
npm run test-prompt "Is my HbA1c concerning?"

# Genetic analysis  
npm run test-prompt "Do I have the MTHFR variant?"
npm run test-prompt "What genes affect my medication?"
npm run test-prompt "Am I lactose intolerant?"

# Complex queries
npm run test-prompt "How do my genetics relate to my blood work?"
npm run test-prompt "What lifestyle changes should I make?"
npm run test-prompt "Analyze my cardiovascular risk"
```

## For AI Agents / Automation

**Endpoint**: `POST http://localhost:3000/api/dev/chat`

**Request**:
```json
{
  "messages": [
    {"role": "user", "content": "Your question"}
  ],
  "model": "gpt-4.1-mini"
}
```

**Features**:
- ✅ No auth required
- ✅ Demo data auto-loaded
- ✅ No rate limits
- ✅ Hot reload prompts
- ✅ Streaming responses

## Demo Profile Summary

35-year-old female with:
- **Prediabetes** (HbA1c 6.1%)
- **Iron deficiency** (Ferritin 28 ng/mL)
- **Vitamin D deficiency** (22 ng/mL)
- **High cholesterol** (Total 245, LDL 156 mg/dL)
- **MTHFR TT variant** (homozygous)
- 2 blood tests (June + March 2025)
- 16 genetic variants

See `PROMPT_TESTING.md` for full details.

## Modifying Prompts

1. Open `/lib/ai.ts`
2. Edit `MEDICAL_AGENT_PROMPT` constant
3. Save file
4. Run test command - changes apply instantly!

No server restart needed. 🎉
