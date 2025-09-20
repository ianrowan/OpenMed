# Usage Limits Environment Variables

## Required Environment Variables

Add the following environment variables to your `.env.local` file to configure daily usage limits for AI models:

```bash
# Daily usage limits for different model tiers
DAILY_PREMIUM_LIMIT=50
DAILY_BASIC_LIMIT=100
```

## Variable Descriptions

### `DAILY_PREMIUM_LIMIT`
- **Type**: Number
- **Default**: 10 (if not set)
- **Description**: Daily message limit for premium AI models (GPT-5, GPT-4.1)
- **Recommended Values**: 
  - Free tier: 5-10 messages
  - Paid tier: 50-100 messages
  - Enterprise: 200+ messages

### `DAILY_BASIC_LIMIT`
- **Type**: Number  
- **Default**: 50 (if not set)
- **Description**: Daily message limit for basic AI models (GPT-5-Mini, GPT-4.1-Mini)
- **Recommended Values**:
  - Free tier: 20-50 messages
  - Paid tier: 100-200 messages
  - Enterprise: 500+ messages

## Model Tier Classifications

### Premium Models
- GPT-5
- GPT-4.1

### Basic Models  
- GPT-5-Mini
- GPT-4.1-Mini

## Usage Tracking & Security

- Limits are tracked per user on a rolling 24-hour basis
- Usage resets 24 hours after the first message of the day
- Users are warned when they reach 80% of their limit
- Models become unavailable when limits are exceeded
- Usage statistics are displayed in the model selector

### Security Features
- **Read-only access**: Users can only view their usage data, not modify it
- **Server-side enforcement**: All usage increment operations happen server-side via API routes
- **Function-based updates**: Usage can only be incremented through the secure `increment_usage()` function
- **Service role exclusive**: Only the service role can modify usage data
- **Input validation**: Function validates all parameters and model tiers

## Database Schema

The usage tracking requires a `daily_usage_limits` table with the following structure:

```sql
CREATE TABLE daily_usage_limits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    model_tier TEXT NOT NULL CHECK (model_tier IN ('premium', 'basic')),
    usage_count INTEGER NOT NULL DEFAULT 0,
    first_usage_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, model_tier, DATE(first_usage_at))
);
```

### Secure Row Level Security (RLS) Policies

```sql
-- Users can only READ their usage data
CREATE POLICY "Users can view own usage limits" ON daily_usage_limits
  FOR SELECT USING (auth.uid() = user_id);

-- Block direct user modifications to prevent tampering
CREATE POLICY "Block direct user insertions" ON daily_usage_limits
  FOR INSERT TO authenticated WITH CHECK (false);

CREATE POLICY "Block direct user updates" ON daily_usage_limits  
  FOR UPDATE TO authenticated USING (false);

-- Service role has full access for API operations
CREATE POLICY "Service role can manage usage limits" ON daily_usage_limits
  FOR ALL TO service_role USING (true);
```

For existing databases, run the migration script provided in `/migration-daily-usage-limits.sql`.

## API Integration

The usage limits are automatically enforced in:
- `/api/chat` - Checks limits before processing messages
- `/api/usage-stats` - Provides usage statistics to the UI

## UI Components

- **Model Selector**: Shows usage counts and disables models when limits are reached
- **Usage Limit Error**: Displays friendly error messages when limits are exceeded
- **Progress Indicators**: Visual progress bars showing current usage vs limits
