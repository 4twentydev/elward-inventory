# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Elward Inventory Management System is a Next.js 15 application for tracking construction materials and tools. Built for Elward Systems Corporation with features for inventory tracking, pull/return transactions, quarterly counting workflows, AI-powered bundle counting, and QR label generation.

## Development Commands

```bash
# Development
pnpm dev              # Start dev server on http://localhost:3000
pnpm build           # Production build
pnpm start           # Start production server

# Code Quality
pnpm lint            # Lint with Biome
pnpm format          # Format code with Biome
pnpm check           # Lint and format in one command

# Database (when using Postgres)
pnpm db:push         # Push schema changes to database
pnpm db:generate     # Generate migration files
pnpm db:migrate      # Run migrations
pnpm db:studio       # Open Drizzle Studio GUI
```

## Architecture

### Dual Storage Strategy

The application supports two storage modes depending on environment configuration:

1. **Local Storage Mode** (default, no POSTGRES_URL): All data stored in browser localStorage via `src/lib/store.ts`. Single-device only, good for development.

2. **Database Mode** (POSTGRES_URL set): Data persisted to Vercel Postgres via Drizzle ORM. Multi-device sync enabled.

**Key implementation details:**
- `src/db/index.ts` exports `null` for db/sql when POSTGRES_URL is missing
- Server actions in `src/actions/` check `isDbConfigured()` and return empty arrays if false
- Client components use `src/components/inventory-context.tsx` which wraps `src/lib/store.ts` for state management
- The context provides a unified API regardless of storage backend

### State Management Pattern

State flows through React Context (`InventoryProvider` in `src/components/inventory-context.tsx`):
- Wraps localStorage operations from `src/lib/store.ts`
- Provides methods: `addItem`, `updateItem`, `deleteItem`, `pullItem`, `returnItem`, `recordCount`
- All inventory mutations go through this context to keep UI in sync
- Components use `useInventory()` hook to access state and actions

### Server Actions

Located in `src/actions/`:
- `items.ts` - CRUD operations for inventory items, bulk imports
- `users.ts` - User management and authentication
- `count-sessions.ts` - Managing guided counting sessions

These are only called when database mode is active. They use Drizzle ORM with the PostgreSQL schema from `src/db/schema.ts`.

### Database Schema (src/db/schema.ts)

Core tables:
- `items` - Inventory items with category enum (ACM, SwissPearl, Trespa, Extrusions, Tools, Hardware, Other)
- `transactions` - Pull/return/count history with before/after quantities
- `counts` - Count records with discrepancy tracking
- `countSessions` - Guided count workflow state (in_progress/completed)
- `users` - PIN-based authentication with roles (admin/counter/user)
- `aiCountLogs` - AI bundle counting history

All tables use text primary keys (UUIDs). Foreign keys cascade on delete where appropriate.

### Component Organization

**Main UI Components:**
- `app.tsx` - Root component, handles login/logout, mode switching
- `inventory-list.tsx` - Main inventory table with search, filters, actions
- `quarterly-count-mode.tsx` - Guided counting workflow with session management
- `analytics-dashboard.tsx` - Charts and reports using inventory data
- `ai-count-modal.tsx` - Photo upload + Claude Vision API integration

**Utility Components:**
- `transaction-modal.tsx` - Pull/Return quantity entry
- `item-form-modal.tsx` - Add/Edit item form
- `label-modal.tsx` - Bulk QR label generation
- `import-modal.tsx` - Excel/CSV upload and column mapping
- `user-management.tsx` - Admin user CRUD

**UI Primitives** (src/components/ui/):
Custom implementations of button, input, select, card, badge, modal using Tailwind + class-variance-authority.

### Import/Export System (src/lib/import-export.ts)

- Uses `xlsx` library to parse Excel and CSV files
- Supports flexible column mapping (users map their columns to expected fields)
- Required field: Name. Optional: Category, Quantity, Location, Supplier, SKU, Unit Cost, Reorder Level, Notes
- Export generates CSV/Excel from current inventory

### QR Code Labels (src/lib/labels.ts)

- Generates QR codes using `qrcode` library
- QR data format: `elward-inv://{itemId}`
- Label layout: 2"×1" print-ready HTML with item name, SKU, location
- Bulk printing opens new window with all labels

### AI Bundle Counting (src/app/api/ai-count/route.ts)

- POST endpoint accepts base64 image
- Calls Claude Vision API (Anthropic) to count extrusion bundle ends
- Returns suggested count for user confirmation
- User associates count with specific extrusion profile before saving

## Authentication

PIN-based system (no passwords):
- Default user: PIN `1234`, role `admin`
- Users stored in localStorage or `users` table
- Current user stored in localStorage as `elward_inventory_current_user`
- Role-based permissions: admin can manage users, counter can run counts, user can pull/return

## Code Style

Enforced by Biome (`biome.json`):
- Tabs for indentation (2-space width)
- Double quotes for strings
- Semicolons required
- No explicit `any` allowed (configured in linter rules)

## TypeScript

- Path alias: `@/*` maps to `./src/*`
- Strict mode enabled
- Type definitions in `src/types/index.ts` for client-side models
- Database types auto-generated from Drizzle schema via `$inferSelect` and `$inferInsert`

## Environment Variables

Required for AI counting:
- `ANTHROPIC_API_KEY` - Claude API key for vision features

Optional for database mode:
- `POSTGRES_URL` - Connection string (auto-configured on Vercel)
- Additional Postgres vars auto-set by Vercel when storage is added

## Default Login

PIN: `1234` (admin user)
