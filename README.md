# Prediction Platform

A forecasting platform similar to Polymarket, built with Next.js, TypeScript, and SQLite.

## Features

- User management with balance tracking
- Deposit system with idempotency
- Betting system with state machine (PLACED -> SETTLED/CANCELLED)
- Ledger model for append-only transaction history
- Admin reconciliation API

## Tech Stack

- **Backend**: Node.js with TypeScript
- **Frontend**: Next.js
- **Database**: SQLite with Prisma ORM
- **Deployment**: Vercel

## API Endpoints

### Users

- `POST /api/users/:id/deposit` - Deposit money with idempotency key
- `GET /api/admin/reconcile?userId=...` - Admin reconciliation

### Bets

- `POST /api/bets` - Place a bet
- `POST /api/bets/:id/settle` - Settle a bet (WIN/LOSE)
- `POST /api/bets/:id/cancel` - Cancel a bet

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up database:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

3. Run development server:
   ```bash
   npm run dev
   ```

4. Run tests:
   ```bash
   npm test
   ```

## Deployment

### Vercel Deployment

1. Connect your GitHub repository to Vercel
2. Add the following environment variable in Vercel dashboard:
   - `DATABASE_URL`: PostgreSQL connection string (e.g., `postgresql://username:password@host:port/database`)

3. Vercel will automatically run the build process

### Database Setup

For production, use a PostgreSQL database. You can use:
- Vercel Postgres (recommended)
- Supabase
- Railway
- PlanetScale
- Any PostgreSQL provider

Example DATABASE_URL format:
```
postgresql://username:password@host:port/database?sslmode=require
```

## Testing

The project includes 6 test cases covering:
1. Successful deposit and balance update
2. Idempotency key conflict handling
3. Insufficient balance for betting
4. Successful bet placement
5. Winning bet settlement
6. Bet cancellation

Run tests with `npm test`.