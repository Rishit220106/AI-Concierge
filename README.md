# ET AI Concierge
### AI-Powered Personalised Onboarding for the Economic Times Ecosystem

> **Hackathon Submission — Problem Statement 7**  
> Build Sprint · Phase 2 Prototype

---

## The Problem

The Economic Times offers **50+ products and services** across finance, markets, tax, insurance, HR, and tech leadership. Yet the average user discovers less than 10% of what's available — not because the products are poor, but because there is no personalised entry point.

A 28-year-old software engineer planning to buy a home has completely different needs from a 45-year-old HR director or a 22-year-old first-time investor. ET currently serves all of them the same homepage.

**ET AI Concierge closes that gap — in 3 minutes.**

---

## The Solution

A multi-agent AI pipeline that profiles users through a 5-question conversational onboarding flow, identifies their financial and professional gaps, and maps them to the most relevant ET products — generating a personalised dashboard unique to every user.

```
User answers 5 questions
        ↓
Agent 1 — Profiler        → Extracts archetype, risk profile, life stage
        ↓
Agent 2 — Gap Analyser    → Identifies 3–5 financial/professional gaps
        ↓
Agent 3 — ET Mapper       → Maps gaps to 15 ET products with match reasoning
        ↓
Personalised Dashboard    → Live ET product recommendations + financial health score
```

---

## Live Demo

| Screen | Description |
|--------|-------------|
| **Onboarding Chat** | 5-question profiling conversation with real-time profile preview panel |
| **AI Loading** | 3-step processing animation with live profile assembly |
| **Personalised Dashboard** | ET product recommendations, financial gaps, health scores, market pulse |

**Demo reset:** "Restart Demo" button in the nav — resets all state, creates fresh session, ready for next judge in seconds.

---

## Architecture

### Agent Pipeline

```
┌─────────────────────────────────────────────────────────────┐
│                    React Frontend                           │
│  Onboarding Chat → Loading Screen → Personalised Dashboard  │
└────────────────────────┬────────────────────────────────────┘
                         │ POST /profile/build
                         ↓
┌─────────────────────────────────────────────────────────────┐
│                   FastAPI Backend                           │
│                                                             │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐             │
│  │ Agent 1  │ →  │ Agent 2  │ →  │ Agent 3  │             │
│  │ Profiler │    │  Gap     │    │  ET      │             │
│  │          │    │ Analyser │    │ Mapper   │             │
│  └──────────┘    └──────────┘    └──────────┘             │
│       ↓               ↓               ↓                    │
│  Profile JSON    Gaps Array    Recommendations Array        │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ↓
                  Anthropic Claude API
                  (claude-sonnet-4-5)
```

### Agent Responsibilities

| Agent | Input | Output | Model |
|-------|-------|--------|-------|
| **Agent 1 — Profiler** | 5 user answers | Archetype, life stage, risk profile, income signal | claude-sonnet-4-5 |
| **Agent 2 — Gap Analyser** | Profile JSON | 3–5 financial gaps with severity scores (1–5) | claude-sonnet-4-5 |
| **Agent 3 — ET Mapper** | Profile + Gaps | 4–5 ranked ET product recommendations with match reasoning | claude-sonnet-4-5 |

### API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `POST` | `/session/create` | Create new user session, return UUID |
| `POST` | `/profile/build` | Run full 3-agent pipeline, return complete dashboard data |
| `GET`  | `/profile/{session_id}` | Retrieve stored session profile |
| `POST` | `/chat/message` | Context-aware chat with profile as system context |
| `POST` | `/crosssell/trigger` | Rule-based behaviour-triggered product nudges |
| `GET`  | `/health` | Service health check |

---

## User Archetypes

The concierge identifies one of 6 archetypes and routes users accordingly:

| Archetype | Trigger Profile | Primary ET Products |
|-----------|----------------|---------------------|
| **Goal-Saver** | Near-term goal (home, car), has SIPs | ET Prime, Term Insurance, Tax Wizard |
| **First-Timer** | Under 25, just started earning | ET Money Mentor, ET Money Genius |
| **Wealth Builder** | Has portfolio, aggressive risk | ET Markets Screener, ET Prime |
| **Pre-Retiree** | 45+, retirement focus | ET Wealth Tools, NPS, FD options |
| **Corporate Professional** | Career growth focus | ET Edge, ETHRWorld / ETCIO / ETBrandEquity |
| **Entrepreneur** | Business + financial goals | ET Edge Summits, ET Prime |

---

## ET Ecosystem Coverage

The concierge can recommend across **15 ET products**:

**Finance & Investing**
- ET Prime · ET Markets · ET Money Genius · ET Wealth Tools · ET Money Mentor · ET Markets Screener Plus

**Tax & Insurance**
- ET Tax Wizard · ET Partner (Term Insurance) · ET Partner (Home Loan) · ET Wealth Credit Score · ET Money NPS & FD

**Professional & Career**
- ET Edge Masterclasses · ETHRWorld · ETCIO · ETBrandEquity

**Regional**
- ET Vernacular (8 Indian languages)

All CTA buttons link to live official ET pages.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React (Vite), plain CSS, no component libraries |
| **Backend** | Python 3.11, FastAPI, Uvicorn |
| **AI** | Anthropic Claude API (`claude-sonnet-4-5`) |
| **Session Storage** | In-memory dict (stateless, demo-optimised) |
| **Deployment** | Frontend: Vercel / Netlify · Backend: Railway / Render |

---

## Setup & Running

### Prerequisites
- Node.js 18+
- Python 3.11+
- Anthropic API key

### Backend

```bash
cd backend
pip install -r requirements.txt

# Create .env file
echo "ANTHROPIC_API_KEY=sk-ant-your-key-here" > .env

# Start server
uvicorn main:app --reload --port 8000
```

Backend runs at `http://localhost:8000`  
Swagger docs at `http://localhost:8000/docs`

### Frontend

```bash
cd frontend
npm install

# Create .env file
echo "VITE_API_URL=http://localhost:8000" > .env

# Start dev server
npm run dev
```

Frontend runs at `http://localhost:5173`

---

## Project Structure

```
et-ai-concierge/
├── frontend/
│   ├── src/
│   │   ├── App.jsx           # Main app — 3-screen state machine
│   │   ├── api.js            # All backend API calls
│   │   └── constants.js      # Product URLs, fallback data
│   ├── public/
│   └── package.json
│
├── backend/
│   ├── main.py               # FastAPI app — all endpoints + agents
│   ├── requirements.txt
│   └── .env.example
│
├── docs/
│   └── architecture.docx     # Full architecture document
│
└── README.md
```

---

## Key Design Decisions

**Why 5 questions?**  
Questions 1–4 cover financial profile (goal, investments, age, insurance). Question 5 ("Career growth or financial growth?") unlocks the professional ET ecosystem — ETHRWorld, ETCIO, ET Edge — proving the concierge maps ET's full ecosystem, not just finance.

**Why sequential agents instead of one prompt?**  
Each agent has a focused task and a tight JSON schema. This produces more reliable structured outputs than a single monolithic prompt, and makes each stage independently testable.

**Why in-memory session storage?**  
This is a demo. No database cold-start, no schema migrations, instant resets. The architecture document describes how this would migrate to Redis/PostgreSQL in production.



## Business Impact

| Metric | Current | With Concierge |
|--------|---------|----------------|
| ET ecosystem discovery rate | ~10% | Est. 35–45% |
| Time to first relevant product | Minutes to never | Under 3 minutes |
| Cross-product engagement | Low (single-product users) | Multi-product journey from day 1 |
| Personalisation | None (same homepage for all) | 6 archetypes × 15 products |

**Target users:** 14 crore+ demat account holders in India who consume financial news but navigate ET's ecosystem without guidance.
