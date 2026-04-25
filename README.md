<p align="center">
  <img src="public/aegis-logo.avif" alt="Aegis Logo" width="180" />
</p>

<h1 align="center"> LambdaLens  </h1>

<p align="center">
  An AI-powered FinOps detective that analyzes your cloud spending, detects anomalies, and provides intelligent insights.
</p>

---

## 🚀 Quick Start (Docker — Recommended)

> **Prerequisites:** Install [Docker Desktop](https://www.docker.com/products/docker-desktop/) and make sure it's running.

### 1. Clone the repo

```bash
git clone https://github.com/YOUR_USERNAME/The-Aegis-Project.git
cd The-Aegis-Project
```

### 2. Create your environment file

Copy the example and fill in your API keys:

```bash
cp .env.example .env
```

Open `.env` in any text editor (Notepad works fine!) and fill in the values.  
Ask the project owner if you don't have the keys.

### 3. Start everything

```bash
docker compose up --build
```

That's it! Wait for the build to finish and open **http://localhost:3000** in your browser. 🎉

### Stopping the app

Press `Ctrl+C` in the terminal, or run:

```bash
docker compose down
```

---

## 🛠️ Development Setup (without Docker)

If you prefer running locally:

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local
# Fill in your values in .env.local

# Start the dev server
npm run dev
```

Open **http://localhost:3000**.

### LocalStack (optional — for AWS service emulation)

```bash
# Start LocalStack
npm run localstack:up

# Seed test data
npm run localstack:seed

# Stop LocalStack
npm run localstack:down
```

---

## 📁 Project Structure

```
├── app/              # Next.js pages & API routes
│   ├── api/          # Backend API endpoints
│   ├── dashboard/    # Dashboard UI
│   └── page.tsx      # Landing page
├── components/       # Reusable React components
├── lib/              # Utilities, DB, AI agent logic
├── public/           # Static assets (logo, images)
├── scripts/          # Dev scripts & LocalStack setup
├── Dockerfile        # Production container image
├── docker-compose.yml# One-command start (app + LocalStack)
└── .env.example      # Template for environment variables
```

---

## 📝 Environment Variables

| Variable | Required | Description |
|---|---|---|
| `GOOGLE_API_KEY` | ✅ | Google Gemini API key |
| `GROQ_API_KEY` | ✅ | Groq API key for LLM inference |
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Supabase service role key |
| `UPSTASH_VECTOR_REST_URL` | ✅ | Upstash Vector store URL |
| `UPSTASH_VECTOR_REST_TOKEN` | ✅ | Upstash Vector auth token |
| `INGEST_WEBHOOK_SECRET` | ✅ | Webhook auth secret |
| `VERCEL_API_TOKEN` | ❌ | Only for Vercel deployments |
| `VERCEL_TEAM_ID` | ❌ | Only for Vercel deployments |
