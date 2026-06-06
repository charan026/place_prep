# PlacePrep — AI-Powered Placement Preparation Platform

A full-stack placement preparation platform with AI-driven resume analysis, mock interviews, DSA tracking, analytics, and company interview experiences.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + Tailwind CSS 3 + Vite |
| Backend | Node.js + Express |
| Database | PostgreSQL |
| Auth | JWT (JSON Web Tokens) |
| AI | Google Gemini API |
| Charts | Recharts |

## Features

- 🔐 **JWT Authentication** — Secure register/login with bcrypt password hashing
- 📊 **Student Dashboard** — Progress stats, streak tracker, quick actions
- 💻 **DSA Tracker** — 40+ curated problems across 7 topics, status tracking, notes
- 📄 **Resume Analyzer** — PDF upload + AI-powered analysis with score, strengths, weaknesses
- 🤖 **Mock Interview** — AI-generated questions, answer evaluation, overall feedback
- 🏢 **Company Experiences** — Community-driven interview experience database
- 📈 **Analytics** — Topic charts, difficulty pie, activity heatmap, performance trends

---

## Prerequisites

- **Node.js** v18+ and npm
- **PostgreSQL** v14+ (running locally or remote)
- **Google Gemini API Key** — Get one free at [Google AI Studio](https://aistudio.google.com/apikey)

---

## Quick Start

### 1. Database Setup

```bash
# Create the database
psql -U postgres -c "CREATE DATABASE placement_prep;"

# Run the schema
psql -U postgres -d placement_prep -f backend/src/db/schema.sql

# (Optional) Seed sample data
psql -U postgres -d placement_prep -f backend/src/db/seed.sql
```

### 2. Backend Setup

```bash
cd backend

# Copy environment file and fill in your values
cp .env.example .env

# Edit .env with your settings:
#   DB_PASSWORD=your_postgres_password
#   JWT_SECRET=a_long_random_string
#   GEMINI_API_KEY=your_gemini_api_key

# Install dependencies
npm install

# Start the server
npm run dev
```

The backend will start at `http://localhost:5000`. Verify with: `http://localhost:5000/api/health`

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start the dev server
npm run dev
```

The frontend will start at `http://localhost:5173`

### 4. Get Started

1. Open `http://localhost:5173` in your browser
2. Register a new account
3. Explore the Dashboard, DSA Tracker, Resume Analyzer, and Mock Interview

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Server port | `5000` |
| `DB_HOST` | PostgreSQL host | `localhost` |
| `DB_PORT` | PostgreSQL port | `5432` |
| `DB_USER` | PostgreSQL user | `postgres` |
| `DB_PASSWORD` | PostgreSQL password | `your_password` |
| `DB_NAME` | Database name | `placement_prep` |
| `JWT_SECRET` | JWT signing secret | `your_secret_key_here` |
| `JWT_EXPIRES_IN` | Token expiration | `7d` |
| `GEMINI_API_KEY` | Google AI Studio API key | `AIza...` |
| `GEMINI_MODEL` | Gemini model name | `gemini-2.0-flash` |

### Frontend (`frontend/.env`)

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `http://localhost:5000/api` |

---

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login and get JWT |
| GET | `/api/auth/me` | Get current user |

### DSA Tracker
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dsa/questions` | List questions (filterable) |
| POST | `/api/dsa/progress` | Update question status |
| GET | `/api/dsa/progress/stats` | Get progress statistics |

### Resume
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/resumes/upload` | Upload PDF resume |
| POST | `/api/resumes/:id/analyze` | Trigger AI analysis |
| GET | `/api/resumes/:id/analysis` | Get analysis results |

### Mock Interview
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/interviews/start` | Start new interview |
| POST | `/api/interviews/:id/answer` | Submit answer |
| POST | `/api/interviews/:id/complete` | Complete & get feedback |

### Company Experiences
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/experiences` | List all experiences |
| POST | `/api/experiences` | Share new experience |
| GET | `/api/experiences/companies` | Company aggregation |

### Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/analytics/overview` | Dashboard stats |
| GET | `/api/analytics/activity` | Daily activity data |
| GET | `/api/analytics/interviews` | Interview trends |

---

## Deployment

### Option A: VPS (DigitalOcean / AWS EC2)

```bash
# 1. Clone and setup on server
git clone <your-repo> && cd placement-prep

# 2. Setup PostgreSQL
sudo apt install postgresql
sudo -u postgres createdb placement_prep
sudo -u postgres psql -d placement_prep -f backend/src/db/schema.sql

# 3. Backend
cd backend && npm install --production
# Set environment variables
pm2 start src/index.js --name placement-api

# 4. Frontend
cd frontend && npm install && npm run build
# Serve with nginx pointing to frontend/dist
```

### Option B: Railway (Backend) + Vercel (Frontend)

**Backend on Railway:**
1. Push to GitHub
2. Connect Railway to your repo → select `backend/`
3. Add PostgreSQL add-on
4. Set environment variables in Railway dashboard
5. Deploy

**Frontend on Vercel:**
1. Connect Vercel to your repo → select `frontend/`
2. Set `VITE_API_URL` to your Railway backend URL
3. Deploy

### Option C: Docker

```dockerfile
# Example docker-compose.yml
version: '3.8'
services:
  db:
    image: postgres:16
    environment:
      POSTGRES_DB: placement_prep
      POSTGRES_PASSWORD: postgres
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./backend/src/db/schema.sql:/docker-entrypoint-initdb.d/01-schema.sql
      - ./backend/src/db/seed.sql:/docker-entrypoint-initdb.d/02-seed.sql
    ports:
      - "5432:5432"

  backend:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      DB_HOST: db
      DB_PASSWORD: postgres
      JWT_SECRET: change_me_in_production
      GEMINI_API_KEY: your_key_here
    depends_on:
      - db

  frontend:
    build: ./frontend
    ports:
      - "3000:80"

volumes:
  pgdata:
```

---

## Project Structure

```
├── backend/
│   ├── src/
│   │   ├── index.js              # Express server entry point
│   │   ├── config/               # DB and Gemini configuration
│   │   ├── middleware/            # Auth, upload, error handling
│   │   ├── routes/               # API route definitions
│   │   ├── controllers/          # Business logic
│   │   ├── services/             # AI service (Gemini)
│   │   └── db/                   # Schema + seed SQL
│   └── uploads/                  # Resume file storage
│
└── frontend/
    ├── src/
    │   ├── api/                  # Axios client
    │   ├── context/              # Auth context
    │   ├── components/           # UI, layout, chart components
    │   └── pages/                # All page components
    └── index.html
```

---

## License

MIT
