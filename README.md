# Elward Inventory Management System

A Next.js-based inventory management system for construction materials and tools, designed for Elward Systems Corporation.

## Features

### Core Inventory
- **Material/Tool Database**: Track ACM, SwissPearl, Trespa, extrusions, tools, and hardware
- **Excel/CSV Import**: Import existing inventory from spreadsheets with smart column mapping
- **Search & Filter**: Find items by name, SKU, location, or category
- **Low Stock Alerts**: Automatic alerts when items fall below reorder levels
- **Export**: Download inventory as CSV or Excel

### Pull & Return Tracking
- Log materials pulled for jobs with job/project references
- Record returns to inventory
- Full transaction history per item
- Track who did what and when

### Inventory Counting
- **Count Mode**: Guided workflow for full inventory counts
- **Quarterly/Daily/Spot counts**: Choose count type for reporting
- **Discrepancy Tracking**: Automatic detection and logging of count differences
- **Progress Tracking**: See completion status during count sessions

### AI Bundle Counting
- Upload photos of extrusion bundle ends
- AI-powered counting using Claude Vision API
- User confirmation before saving
- Associate counts with specific extrusion profiles

### Labels & QR Codes
- Generate QR code labels for any item
- Bulk label printing
- Print-ready 2"×1" label format
- Scan codes to quickly find items

### Analytics Dashboard
- Category breakdown with visual charts
- Pull/return activity summary
- Most active items tracking
- Low stock overview
- Recent transaction history
- Count session summaries

### User Management
- PIN-based login (no complex auth required)
- Role-based access: Admin, Counter, User
- Track who performed each action
- Admin user management panel

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Linting**: Biome
- **Database**: Local Storage (dev) / Vercel Postgres (production)
- **ORM**: Drizzle
- **QR Codes**: qrcode library
- **AI**: Claude API for vision features

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd elward-inventory

# Install dependencies
pnpm install

# Copy environment file
cp .env.example .env.local

# Start development server
pnpm dev
```

Open `http://localhost:3000` and login with PIN `1234`.

### Environment Variables

```env
# Required for AI Bundle Counting
ANTHROPIC_API_KEY=your-key-here

# Required for multi-device sync (Vercel Postgres)
POSTGRES_URL=your-postgres-url
```

## Database Setup (Optional)

For multi-device access, set up Vercel Postgres:

1. Create a Vercel project and add Postgres storage
2. Copy the connection strings to `.env.local`
3. Run migrations:

```bash
pnpm db:push
```

Available database commands:
- `pnpm db:generate` - Generate migrations
- `pnpm db:migrate` - Run migrations
- `pnpm db:push` - Push schema to database
- `pnpm db:studio` - Open Drizzle Studio

## Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
pnpm add -g vercel

# Deploy
vercel
```

Set environment variables in Vercel project settings:
- `ANTHROPIC_API_KEY` - For AI counting
- Postgres variables are auto-configured when you add storage

### Other Platforms

The app works on any platform that supports Next.js. Without Postgres configured, it falls back to browser local storage (single-device only).

## Usage Guide

### Importing Inventory

1. Click **Import** button
2. Upload Excel (.xlsx) or CSV file
3. Expected columns: Name (required), Category, Quantity, Location, Supplier, Reorder Level, Notes, SKU, Unit Cost
4. Review preview and confirm import

### Pull/Return Flow

1. Find item in list
2. Click **−** to pull or **↓** to return
3. Enter quantity and optional job reference
4. Confirm transaction

### Running a Count

1. Click **Count Mode** button
2. Name your session and select type (Quarterly/Daily/Spot)
3. Optionally filter by category
4. Count items one by one with guided interface
5. Review summary and save all counts

### AI Bundle Counting

1. Click **AI Count** button
2. Take or upload photo of extrusion bundle ends
3. Click **Analyze with AI**
4. Review and adjust the suggested count
5. Associate with an extrusion profile and save

### Printing Labels

1. Click **Labels** button for bulk printing
2. Or click **⋯** on an item → **Label** for single item
3. Select items and click **Print Labels**
4. Labels open in new window ready for printing

## Project Structure

```
src/
├── app/
│   ├── api/ai-count/       # AI counting endpoint
│   ├── globals.css         # Tailwind styles
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Home page
├── components/
│   ├── ui/                 # Reusable UI components
│   ├── inventory-context.tsx   # State management
│   ├── inventory-list.tsx      # Main list view
│   ├── quarterly-count-mode.tsx # Count workflow
│   ├── analytics-dashboard.tsx  # Reports
│   └── ...                 # Feature components
├── db/
│   ├── schema.ts           # Drizzle schema
│   └── index.ts            # Database client
├── actions/
│   ├── items.ts            # Item server actions
│   ├── users.ts            # User server actions
│   └── count-sessions.ts   # Count session actions
├── lib/
│   ├── import-export.ts    # Excel/CSV parsing
│   ├── labels.ts           # QR code generation
│   ├── store.ts            # Local storage
│   └── utils.ts            # Utilities
└── types/
    └── index.ts            # TypeScript types
```

## Default Credentials

- **PIN**: 1234
- **Role**: Admin

Create additional users in User Management (admin only).

## Mobile Support

The interface is optimized for:
- Large tap targets for warehouse use
- Works on phones, tablets, and desktop
- PWA-ready for home screen installation
- Responsive layout adapts to screen size

## License

MIT
