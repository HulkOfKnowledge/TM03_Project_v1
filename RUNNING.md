# Running Creduman with Credit Intelligence Service

This guide explains how to run the full Creduman platform with both the Next.js frontend and Python credit intelligence service.

## Quick Start

### 1. Setup Credit Intelligence Service (First Time Only)

```bash
cd credit-intelligence-service
./setup.sh
```

This will:
- Create a Python virtual environment
- Install all dependencies
- Run tests to verify everything works

### 2. Train ML Models (Optional but Recommended)

```bash
npm run ml:train
```

Or manually:
```bash
cd credit-intelligence-service
./venv/bin/python app/ml/train.py
```

### 3. Run Both Apps Concurrently

**Development Mode:**
```bash
npm run dev:all
```

This runs:
- Next.js app on `http://localhost:3000`
- Python credit intelligence service on `http://localhost:8000`

**Production Mode:**
```bash
npm run start:all
```

## Individual Scripts

### Next.js Only
```bash
npm run dev          # Development mode
npm run start        # Production mode
```

### Python Service Only
```bash
npm run dev:python   # Run Python service
npm run ml:test      # Run Python service tests
npm run ml:train     # Train ML models
```

## Available Endpoints

### Next.js App
- Frontend: `http://localhost:3000`
- API Routes: `http://localhost:3000/api/*`

### Credit Intelligence Service
- API: `http://localhost:8000/api/v1/*`
- Docs: `http://localhost:8000/docs`
- Health: `http://localhost:8000/health`

## API Integration

The Next.js API routes communicate with the Python service:

```
User → Next.js Frontend → Next.js API Routes → Python Service → ML Models
```

Example flow:
1. User views credit card analysis page
2. Frontend calls `/api/credit-intelligence/analyze`
3. Next.js API route calls Python service at `http://localhost:8000/api/v1/analyze`
4. Python service analyzes data using ML models and rules
5. Results returned through the chain back to user

## Environment Variables

Make sure you have:

**Root `.env.local`:**
```env
CREDIT_INTELLIGENCE_API_URL=http://localhost:8000
CREDIT_INTELLIGENCE_API_KEY=your-secret-key
```

**`credit-intelligence-service/.env`:**
```env
API_KEY=your-secret-key
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
```

## Troubleshooting

### Python service won't start
```bash
cd credit-intelligence-service
./setup.sh  # Re-run setup
```

### ML models not loaded
```bash
npm run ml:train  # Train the models
```

### Port conflicts
- Next.js default: 3000 (can change with `PORT=3001 npm run dev`)
- Python default: 8000 (change in `credit-intelligence-service/main.py`)

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Creduman Platform                        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌────────────────────┐         ┌─────────────────────────┐ │
│  │   Next.js App      │         │  Python ML Service      │ │
│  │   Port: 3000       │────────▶│  Port: 8000            │ │
│  │                    │  HTTP   │                         │ │
│  │  - Frontend        │         │  - Credit Analysis      │ │
│  │  - API Routes      │         │  - ML Models            │ │
│  │  - Auth            │         │  - Recommendations      │ │
│  └────────────────────┘         │  - Transaction Insights │ │
│                                  └─────────────────────────┘ │
│                                                               │
│  Database: Supabase                                          │
│  Auth: Supabase Auth                                         │
│  Storage: Supabase Storage                                   │
└─────────────────────────────────────────────────────────────┘
```

## Development Workflow

1. **Start both services:**
   ```bash
   npm run dev:all
   ```

2. **Make changes:**
   - Next.js changes auto-reload
   - Python changes require restart (Ctrl+C, then `npm run dev:all` again)

3. **Test:**
   ```bash
   npm run ml:test    # Test Python service
   npm run lint       # Lint Next.js code
   npm run type-check # TypeScript check
   ```

4. **Before committing:**
   ```bash
   npm run format     # Format code
   npm run lint       # Check for errors
   ```

---

**Note:** The Python service must be running for credit intelligence features to work in the Next.js app.
