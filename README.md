# Education Events Platform

A comprehensive platform for managing education events with QR-based registration, WhatsApp/Email notifications, and mobile check-in scanning.

## Features

- 🌐 **Public Website** - Event listings, registration, QR codes
- 📊 **Admin Dashboard** - Event management, registrations, analytics
- 📱 **Mobile Scanner** - QR check-in with camera access
- 📧 **Messaging** - Email & WhatsApp confirmations
- 🔐 **Authentication** - Role-based access control

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL database (Supabase recommended)

### Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Configure your .env with:
# - DATABASE_URL (Supabase connection string)
# - NEXTAUTH_SECRET
# - SENDGRID_API_KEY (optional)
# - WHATSAPP_ACCESS_TOKEN (optional)

# Push database schema
npm run db:push

# Seed sample data
npm run db:seed

# Start development server
npm run dev
```

### Login Credentials (after seeding)
- **Email:** admin@studyinturkiye.com
- **Password:** admin123

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run db:push` | Push schema to database |
| `npm run db:migrate` | Run migrations |
| `npm run db:seed` | Seed sample data |
| `npm run db:studio` | Open Prisma Studio |

## Project Structure

```
src/
├── app/
│   ├── (public)/       # Public pages
│   ├── admin/          # Admin dashboard
│   └── api/            # API routes
├── components/
│   ├── ui/             # shadcn components
│   ├── public/         # Public components
│   └── admin/          # Admin components
└── lib/
    ├── auth.ts         # NextAuth config
    ├── db.ts           # Prisma client
    ├── email.ts        # SendGrid service
    ├── whatsapp.ts     # WhatsApp service
    └── qr.ts           # QR code utilities
```

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Database:** PostgreSQL + Prisma
- **Auth:** NextAuth.js v5
- **UI:** Tailwind CSS + shadcn/ui
- **Email:** SendGrid
- **WhatsApp:** Meta Cloud API

## License

Private - Study in Turkiye
