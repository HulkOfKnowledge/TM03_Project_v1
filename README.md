# Creduman Platform

A credit education and card management platform for Canadian newcomers, built with Next.js and Python FastAPI.

## Architecture

This is a **monolithic Next.js application** with a separate **Python microservice** for credit intelligence:

- **Next.js Frontend/Backend**: User interface, authentication, Flinks integration, database access
- **Python FastAPI Service**: Credit analysis, payment recommendations, ML models (future)

## Tech Stack

### Next.js Application
- **Framework**: Next.js 14+ with App Router
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS + shadcn/ui
- **Database**: PostgreSQL via Supabase
- **Authentication**: Supabase Auth
- **External API**: Flinks API
- **Internationalization**: next-intl (English, French, Arabic)

### Python Service
- **Framework**: FastAPI
- **Language**: Python 3.11+
- **Validation**: Pydantic
- **Deployment**: Docker

## Getting Started

### Prerequisites

- Node.js 20+ and npm
- Python 3.11+
- Supabase account
- Flinks API credentials

### 1. Clone and Install Dependencies

```bash
# Install Next.js dependencies
npm install

# Install shadcn/ui components
npx shadcn-ui@latest init
npx shadcn-ui@latest add button card input label toast

# Install Python dependencies
cd credit-intelligence-service
pip install -r requirements.txt
cd ..
```

### 2. Set Up Environment Variables

Copy `.env.example` to `.env` and fill in your credentials:

```bash
# Next.js
cp .env.example .env

# Python service
cp credit-intelligence-service/.env.example credit-intelligence-service/.env
```

**Required Environment Variables:**
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key (server-side only)
- `FLINKS_CUSTOMER_ID`: Your Flinks customer ID
- `FLINKS_INSTANCE`: Your Flinks instance name
- `CREDIT_INTELLIGENCE_API_KEY`: API key for Python service
- `WEBHOOK_SECRET`: Secret for webhook verification

### 3. Set Up Database

Run Supabase migrations:

```bash
# Initialize Supabase (if not done)
npx supabase init

# Link to your project
npx supabase link --project-ref your-project-ref

# Run migrations
npx supabase db push
```

Or manually run the SQL migration file in your Supabase SQL editor:
- `supabase/migrations/20260129000000_initial_schema.sql`

### 4. Run Development Servers

**Terminal 1 - Next.js:**
```bash
npm run dev
```
Next.js will run on [http://localhost:3000](http://localhost:3000)

**Terminal 2 - Python Service:**
```bash
cd credit-intelligence-service
python main.py
```
Python service will run on [http://localhost:8000](http://localhost:8000)

Visit [http://localhost:8000/docs](http://localhost:8000/docs) for Python API documentation.

## Project Structure

```
creduman/
├── app/                          # Next.js App Router
│   ├── (routes)/
│   │   ├── login/               # Authentication pages
│   │   ├── signup/
│   │   ├── onboarding/
│   │   ├── learn-dashboard/     # Learning dashboard
│   │   └── card-dashboard/      # Card management dashboard
│   ├── api/                     # API Routes
│   │   ├── auth/               # Authentication endpoints
│   │   ├── flinks/             # Flinks integration
│   │   ├── credit-intelligence/ # Python service integration
│   │   └── user/               # User management
│   ├── globals.css             # Global styles
│   └── layout.tsx              # Root layout
├── components/                  # React components (shadcn/ui)
│   └── ui/                     # UI components
├── lib/                        # Utilities and clients
│   ├── supabase/              # Supabase client configurations
│   ├── validations.ts         # Zod schemas
│   └── utils.ts               # Helper functions
├── services/                   # Business logic layer
│   ├── flinks.service.ts      # Flinks API integration
│   ├── credit-intelligence.service.ts  # Python service client
│   └── user.service.ts        # User management
├── types/                      # TypeScript type definitions
│   ├── database.types.ts      # Database models
│   ├── flinks.types.ts        # Flinks API types
│   ├── credit-intelligence.types.ts  # Python service types
│   └── api.types.ts           # API response types
├── supabase/
│   └── migrations/            # Database migrations
├── credit-intelligence-service/  # Python FastAPI microservice
│   ├── app/
│   │   ├── api/              # API routes
│   │   ├── core/             # Configuration and security
│   │   ├── models/           # Pydantic schemas
│   │   └── services/         # Business logic
│   ├── main.py               # FastAPI application
│   ├── requirements.txt      # Python dependencies
│   └── Dockerfile           # Docker configuration
└── middleware.ts             # Next.js middleware (auth)
```

## Security

- **Row Level Security (RLS)**: All database tables have RLS policies
- **Authentication**: Supabase Auth with HTTP-only cookies
- **API Keys**: Python service requires API key authentication
- **Webhook Verification**: HMAC signature verification for webhooks
- **Input Validation**: Zod schemas for runtime validation
- **Environment Variables**: Never commit secrets to git

## Internationalization

The platform supports:
- **English (en)**: Default language
- **Future release may support multi-language

Language preference is stored in user profile and affects:
- UI text and labels
- Learning module content
- Credit insights and recommendations

## Database Schema

### Core Tables:
- `user_profiles`: User information and preferences
- `connected_credit_cards`: Linked credit cards from Flinks
- `credit_data_cache`: Synced credit card data
- `learning_modules`: Educational content (multilingual)
- `user_learning_progress`: User progress tracking
- `credit_insights`: AI-generated insights and recommendations
- `audit_logs`: Security and activity logs

## Development Workflow

### Adding a New Feature

1. **Define Types**: Add TypeScript interfaces in `types/`
2. **Create Database Migration**: If schema changes needed
3. **Add Service Methods**: Implement business logic in `services/`
4. **Create API Routes**: Add endpoints in `app/api/`
5. **Build UI Components**: Create pages and components
6. **Add Validation**: Define Zod schemas in `lib/validations.ts`

### Running Tests

```bash
# TODO: Add test commands when tests are implemented
npm run test
```

### Code Quality

```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Formatting
npm run format
```

## 🐳 Docker Deployment

### Python Service

```bash
cd credit-intelligence-service
docker build -t creduman-intelligence .
docker run -p 8000:8000 --env-file .env creduman-intelligence
```

### Full Stack (TODO: Add docker-compose)

```yaml
# docker-compose.yml coming soon
```
