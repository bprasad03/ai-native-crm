# 🛍️ AI Native CRM

> An AI-native Mini CRM that helps retail brands intelligently reach their shoppers through smart segmentation, personalised messaging, and real-time campaign analytics.

**Live Demo** → [ai-native-crm-five.vercel.app](https://ai-native-crm-five.vercel.app)  
**Backend API** → [ai-native-crm-production-6dbf.up.railway.app](https://ai-native-crm-production-6dbf.up.railway.app)

---

## 🎯 What I Built

A marketer's cockpit — a clean, fast UI where the marketer is always in control, but AI is their co-pilot at every meaningful step.

The product helps a Direct-to-Consumer brand:
- **Understand** their shoppers (customer database with value tiers)
- **Segment** audiences using plain English → AI builds the rules
- **Reach** them via WhatsApp, SMS, or Email with AI-drafted messages
- **Track** campaign performance in real-time (sent, delivered, failed, opened, clicked)
- **Analyse** results with AI-generated campaign insights

---

## ✨ AI Touch Points

| Where | What AI Does |
|---|---|
| Segment Builder | Converts plain English to filter rules (e.g. "high spenders inactive 30 days" → `{min_spent: 5000, inactive_days: 30}`) |
| Message Drafting | Writes personalised WhatsApp/SMS/Email copy based on segment profile + campaign goal |
| Campaign Insights | Generates a plain-English performance summary after campaign runs |

---

## 🏗️ Architecture

```
┌─────────────────────────┐        ┌──────────────────────────┐
│     React Frontend      │        │     Channel Service      │
│   Vercel (port 5173)    │        │   Railway (port 4000)    │
│                         │        │                          │
│  Dashboard              │        │  POST /send              │
│  Customers              │        │  → simulates outcomes    │
│  Segments               │        │  → async callback        │
│  Campaigns              │        │    to CRM /api/receipts  │
└────────────┬────────────┘        └──────────┬───────────────┘
             │ REST API                        │ callback
             ▼                                 ▼
┌─────────────────────────────────────────────────────────────┐
│                    CRM Backend (Express)                     │
│                   Railway (port 3000)                        │
│                                                              │
│  /api/customers   /api/segments   /api/campaigns             │
│  /api/receipts    Groq AI SDK                                │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
                ┌────────────────────────┐
                │     PostgreSQL DB      │
                │       Railway          │
                │                        │
                │  customers  orders     │
                │  segments   campaigns  │
                │  communications        │
                └────────────────────────┘
```

### Key Design Decisions

- **Two-service architecture** — CRM backend and channel service are separate, mimicking real-world messaging infrastructure
- **Callback-driven delivery** — channel service asynchronously calls back `/api/receipts` with delivery status, just like real providers (Twilio, MSG91)
- **JSONB for rules and stats** — flexible schema for segment rules and campaign stats without migrations
- **Groq LLM** — fast, free inference for AI features (llama-3.3-70b-versatile)

### Scale Tradeoffs

| Decision | Why | At Scale I'd |
|---|---|---|
| Sequential sends in launch | Simple, debuggable | Use a message queue (BullMQ/SQS) |
| Single Node process | Fine for demo | Horizontal scaling + worker processes |
| Polling for stats | Not needed, callbacks handle it | Add WebSockets for live updates |
| No auth | Out of scope | JWT + multi-tenant with org isolation |

---

## 🗂️ Database Schema

```sql
customers     — id, name, email, phone, city, total_spent, last_order_at
orders        — id, customer_id, amount, product, created_at
segments      — id, name, rules (JSONB), customer_count
campaigns     — id, name, segment_id, channel, message, status, stats (JSONB)
communications — id, campaign_id, customer_id, status, sent_at, updated_at
```

---

## 📁 Project Structure

```
ai-native-crm/
├── frontend/                  # React + Vite + Tailwind
│   └── src/
│       ├── pages/
│       │   ├── Dashboard.jsx  # Stats + charts overview
│       │   ├── Customers.jsx  # Customer table with filters
│       │   ├── Segments.jsx   # AI segment builder
│       │   └── Campaigns.jsx  # Campaign creator + launcher
│       ├── components/
│       │   ├── Navbar.jsx
│       │   └── StatCard.jsx
│       └── config.js          # API URL config
│
├── backend/                   # Node.js + Express + PostgreSQL
│   └── src/
│       ├── routes/
│       │   ├── customers.js
│       │   ├── segments.js    # AI suggest endpoint
│       │   ├── campaigns.js   # AI draft + launch endpoints
│       │   └── receipts.js    # Callback handler
│       ├── db/
│       │   ├── index.js       # PostgreSQL pool
│       │   └── schema.sql     # Table definitions
│       └── seed/
│           └── seed.js        # 200 fake customers + orders
│
└── channel-service/           # Stubbed delivery service
    └── src/
        └── index.js           # Simulates async delivery callbacks
```

---

## 🚀 Running Locally

### Prerequisites
- Node.js 18+
- PostgreSQL 15+

### 1. Clone the repo
```bash
git clone https://github.com/bprasad03/ai-native-crm.git
cd ai-native-crm
```

### 2. Setup Backend
```bash
cd backend
npm install
cp .env.example .env   # fill in your values
psql -U postgres -d xeno_crm -f src/db/schema.sql
node src/seed/seed.js
npm run dev
```

### 3. Setup Channel Service
```bash
cd channel-service
npm install
npm run dev
```

### 4. Setup Frontend
```bash
cd frontend
npm install
npm run dev
```

### Environment Variables

**backend/.env**
```
DB_USER=postgres
DB_PASSWORD=yourpassword
DB_HOST=localhost
DB_PORT=5432
DB_NAME=xeno_crm
PORT=3000
CHANNEL_SERVICE_URL=http://localhost:4000
GROQ_API_KEY=your_groq_api_key
```

**channel-service/.env**
```
PORT=4000
CRM_BACKEND_URL=http://localhost:3000
```

---

## 🛠️ Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React, Vite, Tailwind CSS, Recharts |
| Backend | Node.js, Express |
| Database | PostgreSQL |
| AI | Groq API (llama-3.3-70b-versatile) |
| Channel Service | Node.js, Express |
| Deployment | Vercel (frontend), Railway (backend + DB + channel) |

---

## 📊 Features

- ✅ 519 seeded customers with realistic Indian profiles
- ✅ AI-powered segment builder (plain English → filter rules)
- ✅ AI message drafting for WhatsApp, SMS, Email
- ✅ Campaign launch with async delivery simulation
- ✅ Real-time stats (sent, delivered, failed, opened, clicked)
- ✅ Progress bars for delivery and open rates
- ✅ AI campaign insight summaries
- ✅ Customer value tiers (High/Mid/New)
- ✅ Dashboard with bar chart + donut chart

---

## 🎬 Walkthrough Video

[Watch the 5-minute walkthrough →](#) *(link will be added before submission)*

---

Built with ❤️ for Xeno Engineering Assignment 2026
