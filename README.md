# OpenMed AI - Open Source Medical Data Analysis Platform

OpenMed AI is an open-source platform designed to **democratize health data analysis** by giving individuals the power to understand their own medical data through AI-powered insights. Upload your blood work, genetic testing results, and get personalized health insights through natural language conversations.

## 🌟 Mission

Healthcare data should be accessible and understandable to everyone. OpenMed AI empowers individuals to:
- Take ownership of their health data
- Gain insights from complex medical reports
- Make informed decisions about their health
- Bridge the gap between raw data and actionable knowledge

## ✨ Features

### 🩸 **Blood Work Analysis**
- Upload lab results (PDF, CSV, JSON formats)
- Automatic biomarker extraction and interpretation
- Reference range comparisons with visual indicators
- Trend analysis across multiple test dates
- Out-of-range value identification with explanations

### 🧬 **Genetic Data Analysis**
- Support for 23andMe, AncestryDNA, and other raw genetic data
- RSID-based variant lookup and interpretation
- Disease risk assessment based on genetic variants
- Pharmacogenomics insights for drug metabolism
- Evidence-based genetic recommendations

### 📚 **Medical Literature Integration**
- Real-time PubMed and medical database searches
- Evidence-based explanations for findings
- Latest research integration for personalized insights
- Citation-backed recommendations

### 🤖 **AI-Powered Chat Interface**
- Natural language conversations about your health data
- Multi-step analysis with tool calling
- Personalized insights based on your medical profile
- Interactive data visualizations and cards

### 🔒 **Privacy & Security**
- Local data processing options
- Encrypted data storage
- Row-level security policies
- Custom OpenAI API key support (bypass usage limits)
- Complete data ownership and control

### 📊 **Advanced Features**
- Usage limits with premium/basic tiers
- Demo mode with sample data
- Conversation history and management
- Medical profile integration
- Multi-model AI support (GPT-4, GPT-5 variants)

## 🛠 Tech Stack

- **Frontend**: Next.js 15, React 18, TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui, Radix UI primitives
- **Backend**: Next.js API routes with serverless functions
- **Database**: Supabase (PostgreSQL) with Row Level Security
- **AI/ML**: OpenAI GPT models (GPT-4, GPT-4 Turbo, GPT-o1)
- **Authentication**: Supabase Auth with social providers
- **File Processing**: PDF parsing, CSV processing, genetic data formats
- **Deployment**: Vercel (recommended) with Supabase cloud integration

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js 20+** (managed with nvm recommended)
- **Docker Desktop** (required for local Supabase)
- **Git** for version control
- **OpenAI API key** for AI features

## 🚀 Local Development Setup

### 1. Clone and Install

```bash
# Clone the repository
git clone https://github.com/ianrowan/OpenMed.git
cd OpenMed

# Use Node 20 (recommended)
nvm use

# Install all dependencies
npm install
```

### 2. Set Up Supabase Locally

```bash
# Start local Supabase (requires Docker Desktop)
npx supabase start
```

This will:
- Start PostgreSQL, Auth, Realtime, Storage, and Edge Functions
- Create a local Supabase instance on `http://localhost:54323`
- Provide local development keys

### 3. Configure Environment Variables

```bash
# Copy environment template
cp .env.example .env.local
```

After running `npx supabase start`, you'll see output with local credentials. Update `.env.local`:

```env
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Local Supabase Configuration (from supabase start output)
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_local_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_local_service_role_key

# Optional: Production Supabase (for deployment)
# NEXT_PUBLIC_SUPABASE_URL=your_production_supabase_url
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key
# SUPABASE_SERVICE_ROLE_KEY=your_production_service_role_key
```

### 4. Initialize Database Schema

Choose one of these methods to set up the database:

**Option A: Command Line (Recommended)**
```bash
# Apply database schema and seed data
cat complete_database_setup.sql | supabase db query
```

**Option B: Supabase Dashboard**
1. Visit the local dashboard: http://localhost:54323/
2. Navigate to SQL Editor
3. Copy and paste the contents of `complete_database_setup.sql`
4. Execute the SQL

### 5. Start Development Server

```bash
# Start the development server
nvm use && npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 🗂 Project Structure

```
OpenMed/
├── app/                    # Next.js 15 app router
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── chat/              # Chat interface
│   └── dashboard/         # User dashboard
├── components/            # Reusable React components
│   ├── chat/             # Chat-related components
│   ├── dashboard/        # Dashboard components
│   └── ui/               # shadcn/ui components
├── lib/                  # Utility functions and configurations
├── supabase/            # Database migrations and types
├── tools/               # AI function calling tools
└── types/               # TypeScript type definitions
```

## 🚨 Medical Disclaimer

**IMPORTANT**: This application is for informational and educational purposes only. It is not intended to diagnose, treat, cure, or prevent any disease. Always consult with a qualified healthcare professional for medical advice. Do not make medical decisions based solely on this application.

## 🧪 Using the Application

### Demo Mode
- Visit the application without signing up to explore sample data
- Try uploading the provided sample files in `/sample-data/`
- Experience the full feature set with test medical data

### Production Usage
1. **Create an account** or sign in
2. **Upload your medical data**:
   - Blood work (PDF lab reports, CSV exports)
   - Genetic data (23andMe, AncestryDNA raw files)
3. **Chat with your data** using natural language
4. **Explore insights** through AI-powered analysis
5. **Optional**: Add your own OpenAI API key to bypass usage limits

## 🔧 Development Commands

```bash
# Development
nvm use && npm run dev     # Start development server
npm run build             # Build for production
npm run start             # Start production build

# Database
npx supabase start        # Start local Supabase
npx supabase stop         # Stop local Supabase
npx supabase db reset     # Reset local database
npx supabase db query     # Run SQL queries

# Code Quality
npm run lint              # Run ESLint
npm run type-check        # TypeScript type checking
```

## 🚀 Deployment

### Vercel + Supabase Cloud (Recommended)

1. **Deploy to Vercel**:
   ```bash
   # Deploy with Vercel CLI
   npx vercel --prod
   ```

2. **Set up production Supabase**:
   - Create a new project at [supabase.com](https://supabase.com)
   - Run the database setup SQL in the Supabase dashboard
   - Update environment variables in Vercel

3. **Configure environment variables** in Vercel dashboard with production values

## 🤝 Contributing

We welcome contributions to democratize health data analysis! Here's how to get involved:

### Getting Started
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Follow the local development setup above
4. Make your changes and test thoroughly
5. Submit a pull request

### Development Guidelines
- Follow existing code style and TypeScript patterns
- Add tests for new features
- Update documentation for user-facing changes
- Keep medical accuracy and user privacy as top priorities

### Areas for Contribution
- 🧬 Additional genetic data format support
- 📊 New data visualization components
- 🔍 Enhanced medical literature search capabilities
- 🌐 Internationalization and accessibility
- 📱 Mobile application development
- 🔒 Additional privacy and security features


## 🤝 Support & Community

- **Issues**: Report bugs or request features via [GitHub Issues](https://github.com/ianrowan/OpenMed/issues)
- **Discussions**: Join community discussions in [GitHub Discussions](https://github.com/ianrowan/OpenMed/discussions)

