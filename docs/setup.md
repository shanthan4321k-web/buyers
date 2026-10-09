# AgriGuide Buyer Marketplace — Setup & Deployment Guide

## 1. Prerequisites
- **Node.js**: v18.0.0 or higher (v20+ recommended)
- **npm**: v9.0.0 or higher
- **Supabase Account & Project**: Active PostgreSQL project with Supabase Auth enabled

---

## 2. Supabase Database Configuration

1. Log in to your [Supabase Dashboard](https://app.supabase.com).
2. Open your project and navigate to the **SQL Editor**.
3. Open `docs/migrations.sql` from this repository.
4. Execute the SQL script. This will create:
   - `farmers` (if not already present)
   - `farms`, `plots`, `crop_cycles` (if not already present)
   - `selling_lots`
   - `buyer_profiles`
   - `buying_requirements`
   - `offers`
   - `orders`
   - All corresponding Row Level Security (RLS) policies and performance indexes.

---

## 3. Environment Variables Configuration

### Backend (`server/.env`)
Create a file named `.env` inside `server/` with the following contents:

```env
PORT=5000
CLIENT_URL=http://localhost:5173

# Replace with your actual Supabase project credentials
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

### Frontend (`client/.env`)
Create a file named `.env` inside `client/` with the following contents:

```env
VITE_API_URL=http://localhost:5000/api
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

> **Security Note**: Never commit `.env` files or expose the `SUPABASE_SERVICE_ROLE_KEY` in frontend source code.

---

## 4. Installation & Local Development

### 4.1 Install Dependencies
From the repository root:

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 4.2 Start the Backend API Server
```bash
cd server
npm run dev
```
The server will start on `http://localhost:5000`. You can verify health via:
`http://localhost:5000/api/health`

### 4.3 Start the Frontend Client
In a separate terminal:
```bash
cd client
npm run dev
```
The React application will be available at `http://localhost:5173`.

---

## 5. Verification & Testing Flows

1. **Sign Up / Sign In**:
   - Register a new account at `/auth`.
   - Verify that incomplete profiles are immediately routed to `/complete-profile`.
2. **Profile Completion**:
   - Fill in Business Name, Buyer Type, State, District, Preferred Crops.
   - Save and observe redirect to the `/dashboard`.
3. **Browse Real Listings**:
   - Navigate to `/crops`. Check filters for crop type, price range, and quantity.
4. **Post Buying Requirement**:
   - Navigate to `/requirements` and click "Post Buying Requirement".
   - Enter crop details, target price, required date.
   - Click "Find Matches" to test the deterministic matching algorithm against active selling lots.
5. **Submit & Manage Offers**:
   - Submit a purchase offer on a selling lot.
   - View the offer under `/orders` (Offers & Orders tab).
   - Test counteroffers, agreement generation, and order tracking.
