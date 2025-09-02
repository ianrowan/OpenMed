# OpenMed AI - Medical Data Analysis Chat Application

OpenMed AI is a comprehensive medical data analysis application that allows users to upload and chat with their medical data including blood work results, genetic testing data, and search medical literature for insights.

## 🚀 Features

- **Blood Work Analysis**: Upload and analyze blood test results with reference ranges and visualizations
- **Genetic Data Interpretation**: Analyze 23andMe raw data and clinical variants
- **Medical Literature Search**: Search PubMed and medical databases for research insights
- **AI-Powered Chat**: Natural language interface powered by OpenAI GPT models
- **Real-time Visualization**: Interactive charts and cards for medical data
- **Secure Data Storage**: Supabase integration for secure medical data storage

## 🛠 Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API routes, Vercel AI SDK
- **Database**: Supabase (PostgreSQL with vector extensions)
- **AI/ML**: OpenAI GPT-4, tool calling for medical data analysis
- **Authentication**: Supabase Auth (ready for integration)

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn package manager
- OpenAI API key
- Supabase project (optional for data persistence)

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd openmed
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Fill in your environment variables:
   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url (optional)
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key (optional)
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key (optional)
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open the application**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🚨 Medical Disclaimer

**IMPORTANT**: This application is for informational and educational purposes only. It is not intended to diagnose, treat, cure, or prevent any disease. Always consult with a qualified healthcare professional for medical advice. Do not make medical decisions based solely on this application.

## 🔄 Development

### Running Tests
```bash
npm run test
```

### Building for Production
```bash
npm run build
```

### Linting
```bash
npm run lint
```

**Built with ❤️ for better health data understanding**
