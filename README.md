# AgriGuide — Buyer Agricultural Procurement Marketplace

AgriGuide is a standalone B2B buyer-side agricultural procurement platform designed to connect commercial buyers (retailers, wholesalers, traders, distributors, food processors) directly with farmers who publish crops for sale.

Both the AgriGuide Buyer Platform and the Farmer Platform share the **same Supabase PostgreSQL database** as the integration and transactional bridge.

---

## 🌾 Core Features

1. **Profile-First User Experience**:
   - Enforces mandatory commercial profile completion (Business Name, Category, Delivery Location, Preferred Crops) before accessing dashboard procurement tools.
2. **Authentic Data Principle**:
   - Displays 100% genuine database records only. Zero synthetic farmers, mock prices, or fake transactions.
   - Clean, actionable empty states when databases are fresh.
3. **Available Crops Marketplace (`/crops`)**:
   - Query, search, and filter real farmer selling lots (`selling_lots`) by crop, variety, price, quantity, and state/district.
   - Distinctly displays farmer asking price or "Price not specified" without guessing or estimating market rates.
   - Interactive modal to submit purchase offers with proposed rates, quantities, transport responsibilities, and payment terms.
4. **Buying Requirements (`/requirements`)**:
   - Post commercial procurement demand with quantity, target price / maximum budget ceiling, delivery timeline, and quality requirements.
   - **Deterministic Matching Engine**: Scores active farmer crop listings against your requirement based on crop variety, quantity overlap, price ceiling, and regional location.
5. **Offers & Order Center (`/orders`)**:
   - Manage the entire negotiation lifecycle: Sent Offers, Counteroffers, Acceptance, Rejection, and Withdrawal.
   - Formal Agreed Orders (`orders`) generated upon agreement acceptance.
   - Track delivery status (`CONFIRMED`, `IN_TRANSIT`, `DELIVERED`, `COMPLETED`), weighbridge verification (`CONFIRMED_AT_FARM`, `CONFIRMED_AT_DELIVERY`), and real payment tracking (`UNPAID`, `PARTIAL`, `PAID`).
6. **Buyer Dashboard (`/dashboard`)**:
   - Summary metrics computed from authenticated buyer database records.
   - Quick actions and recent activity streams.

---

## 🛠️ Technology Stack

- **Frontend**: React 18, Vite, JavaScript (JSX), React Router DOM v7, Tailwind CSS, Lucide React, Axios, React Hook Form, Zod.
- **Backend**: Node.js, Express.js (ES modules), Supabase JS Client (`@supabase/supabase-js`), Zod validation, JWT verification middleware via Supabase Auth.
- **Database & Security**: Shared Supabase PostgreSQL, Supabase Auth, Row Level Security (RLS) policies.

---

## 🚀 Quickstart & Setup

### 1. Execute Database Migrations
Apply the additive SQL migrations in `docs/migrations.sql` in your Supabase project's SQL Editor.

### 2. Configure Environment Variables
- Copy `server/.env.example` to `server/.env` and insert your `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`.
- Copy `client/.env.example` to `client/.env` and insert your `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

### 3. Install Dependencies & Run

```bash
# Server (Port 5000)
cd server
npm install
npm run dev

# Client (Port 5173 - In a separate terminal)
cd client
npm install
npm run dev
```

---

## 📚 Technical Documentation

- [Database Contract & Schema Specification](file:///c:/Users/nalla/OneDrive/Documents/webdev/buyers/docs/database-contract.md)
- [Farmer-Side Platform Changes Specification](file:///c:/Users/nalla/OneDrive/Documents/webdev/buyers/docs/farmer-platform-changes.md)
- [Detailed Setup & Verification Guide](file:///c:/Users/nalla/OneDrive/Documents/webdev/buyers/docs/setup.md)
- [Additive Database SQL Migrations](file:///c:/Users/nalla/OneDrive/Documents/webdev/buyers/docs/migrations.sql)
