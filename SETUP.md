# 🚀 OpenMed Setup Guide

## Quick Start

### 1. Setup Environment Variables

First, copy the example environment file and fill in your Supabase credentials:

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your Supabase project details:

```bash
# Get these from your Supabase project dashboard
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Optional - for AI features (can be added later)
OPENAI_API_KEY=your-openai-key
```

**Where to find your Supabase credentials:**
1. Go to [supabase.com](https://supabase.com) and sign in
2. Create a new project (or use existing)
3. Go to Project Settings → API
4. Copy the Project URL, anon key, and service_role key

### 2. Initialize Database

Run the database setup script:

```bash
npm run db:setup
```

This will create all necessary tables, including:
- ✅ Users and medical profiles
- ✅ Blood test results and genetic data
- ✅ Chat messages and literature cache
- ✅ Row Level Security policies
- ✅ Database functions and triggers

### 3. Start the Application

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to start using OpenMed!

## 🧪 Testing the Auth System

### Test User Registration:
1. Click "Sign Up" on the homepage
2. Create an account with email/password
3. Complete the 3-step medical profile onboarding
4. You'll be redirected to the dashboard

### Test User Sign In:
1. Sign out from the dashboard
2. Sign back in with your credentials
3. Your medical profile data should be preserved

### Test OAuth (Optional):
- Google and Apple sign-in are configured
- You'll need to set up OAuth apps in the Supabase dashboard

## 🔧 Troubleshooting

### Database Setup Issues:
```bash
# Check if your .env.local file is correct
cat .env.local

# Test connection manually
node -e "
const { createClient } = require('@supabase/supabase-js');
const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
client.auth.getSession().then(() => console.log('✅ Connected')).catch(e => console.log('❌ Failed:', e.message));
"
```

### Authentication Issues:
1. Check Supabase Auth settings:
   - Go to Authentication → Settings
   - Ensure email confirmation is configured as needed
   - Add your domain to "Site URL" for OAuth

2. Check browser console for errors
3. Verify your environment variables are loaded

### Common Issues:

**"Module not found" errors:**
```bash
npm install
```

**"Invalid JWT" errors:**
- Check your service role key is correct
- Ensure keys match your Supabase project

**"Table doesn't exist" errors:**
- Re-run database setup: `npm run db:setup`
- Check Supabase dashboard to verify tables were created

## 🎯 What's Configured

✅ **Complete Authentication System:**
- Email/password signup and signin
- OAuth providers (Google, Apple)
- Protected routes with middleware
- User session management

✅ **Medical Profile Management:**
- 3-step onboarding process
- Profile editing and updates
- BMI calculations and health insights

✅ **Database Schema:**
- User profiles and medical data
- Chat history and AI interactions
- Row Level Security for data privacy

✅ **Modern UI Components:**
- Radix UI components
- Form validation with React Hook Form
- Responsive design with Tailwind CSS

## 🚀 Next Steps

After setup is complete, you can:

1. **Test the Chat Interface:** Navigate to `/chat` for AI conversations
2. **Upload Medical Data:** Use the upload functionality (requires OpenAI API key)
3. **Customize Settings:** Modify user preferences in the profile page
4. **Add Sample Data:** Run `npm run db:sample` for test data

The system is now ready for full development and testing!
