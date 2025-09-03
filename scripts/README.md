# Database Setup Scripts

## Quick Setup

1. **Configure environment variables:**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your Supabase credentials
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up database:**
   ```bash
   npm run db:setup
   ```

4. **Add sample data (optional):**
   ```bash
   npm run db:sample
   ```

## Available Scripts

- `npm run db:setup` - Sets up all database tables, policies, and functions
- `npm run db:sample` - Adds sample blood work and genetic data
- `npm run db:generate` - Generate TypeScript types from Supabase schema
- `npm run db:start` - Start local Supabase (requires Supabase CLI)
- `npm run db:stop` - Stop local Supabase
- `npm run db:reset` - Reset local database

## What Gets Created

### Tables
- `users` - User profiles linked to Supabase Auth
- `blood_test_results` - Blood work data with biomarkers
- `genetic_data` - Genetic variants (SNPs) with annotations
- `chat_messages` - AI conversation history
- `medical_literature` - Cached search results
- `user_preferences` - User settings and preferences

### Security
- Row Level Security (RLS) policies for all tables
- Users can only access their own data
- Service role can manage shared resources

### Functions
- `get_latest_blood_work()` - Get most recent blood test
- `get_biomarker_trends()` - Track biomarker changes over time
- `search_genetic_variants()` - Search SNPs by gene/phenotype
- `get_biomarker_stats()` - Calculate trends and statistics

## Troubleshooting

If the setup fails:

1. **Check your credentials** in `.env.local`
2. **Verify service role key** has the correct permissions
3. **Check Supabase dashboard** to see if tables were created
4. **Run scripts manually** in Supabase SQL Editor if needed

The SQL files are located in `/supabase/` directory for manual execution.
