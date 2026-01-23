# Changelog

All notable changes to this project will be documented in this file.

## [0.2.1] - 2026-01-23

### Added
- **Legal & Compliance Pages**
  - Created dedicated pages for Privacy Policy, Terms of Service, Cookie Policy, and GDPR Compliance.
  - Linked all legal pages in the footer.

- **Static Content Pages**
  - Added **About Us** page with mission, vision, and stats.
  - Added **FAQ** page with interactive accordion for common questions.

- **Partner University Linking**
  - Updated "Trusted by Leading Institutions" section on Home Page to link to individual university profiles (`/university/[id]`).

### Changed
- **Footer Updates**
  - Updated contact information (Email: Mahmoud@sitconnect.net, Phone: +20 106 271 7279).
  - Updated social media links (Facebook, Instagram, LinkedIn, Twitter) to point to `@studyintk`.
  - Added "Sit Connect" text below the footer logo.
  - Replaced text logo with `logo-red.svg` (white filter applied).

- **UI Improvements**
  - **Recruit Page**: Changed "Submit Inquiry" button to standard Red (`bg-red-600`) for better visibility.
  - **Header**: Resized logo (50% smaller) and added "Sit Connect" text below it for a cleaner brand lockup.
  - **Footer**: Updated "Organized by" link to point to Fuar inn.

## [0.2.0] - 2026-01-22

### Added
- **Multi-Language Support (i18n) - NEW**
  - 3 languages: English (en), Turkish (tr), Arabic (ar) with RTL support
  - next-intl integration with URL-based locale detection (`/`, `/tr/`, `/ar/`)
  - Language switcher in header with flag buttons
  - Translation files with ~150 strings per language
  - RTL layout automatically applied for Arabic
  - **Localized User Flow**:
    - **Event Page**: Full translation of static UI buttons, labels, and dynamic event content.
    - **Registration Form**: Localized form fields, placeholders, and error messages.
    - **Emails**: Conditional logic to send Confirmation Emails in the user's registration language (EN/AR).

- **Delete Event Feature**
  - Added delete button with confirmation dialog on event edit page
  - Cascade delete of related registrations, check-ins, and message logs
  - Danger Zone UI section for destructive actions

- **University Pricing**
  - Added participation fee and currency fields for university registration
  - Admin form support for setting pricing per event

- **Website Redesign ("EduFairs")**
  - Completely overhauled UI with professional "Red/Yellow" brand palette
  - Implemented new typography system using Playfair Display (Headings) and Inter (Body)
  - Redesigned Home Page with Wave Dividers, Glassmorphism stats, and modern card layouts
  - Created `/recruit` landing page for University Partners with pricing tables
  - Added "Exhibitor Inquiry" form with validation and email logging

- **UI Overhaul (Lovable Design)**
  - Migrated Home Page to match provided Lovable export 100%
  - Implemented new Global Styles, Gradient Tokens, and Turkish-Red theme
  - Added "Hero", "Stats", "How It Works" sections with high-fidelity animations
  - Integrated existing backend data (Events) into the new design components
  - Maintained full i18n support within the new design structure
  - **Event Details Page**: Redesigned `/events/[slug]` with immersive Hero gradient, glassmorphic sidebar, and animated content cards
  - **Search Functionality**: Enabled real-time search on Home Page filtering by Title, City, and Country via URL parameters
  - **Premium UI Upgrade**: Enhanced Event Details page with cinematic hero, noise textures, and overlapping card layout for a "Pro Max" aesthetic

- **Internationalization & RTL Support**
  - **New Font**: Integrated `Cairo` font for Arabic language support
  - **RTL**: Implemented proper Right-to-Left direction handling for Arabic locale
  - **Dynamic Layouts**: Upgraded Root Layout architecture to support per-locale fonts and direction
  - **Translations**: Added full Arabic (human translated) and Turkish support for new UI components
  - **CMS**: Admin interface support for managing Event content in multiple languages

- **Multi-Language Content**
  - Added translation support for event titles and descriptions (EN/TR/AR)
  - Admin interface with language tabs and RTL support
  - Public pages automatically display content in user's selected language
  - Fallback to English for missing translations

### Fixed
- **Event Form Infinite Loop Bug** - Fixed Select components causing maximum update depth exceeded error by using empty string fallbacks for undefined values
- Added missing countries prop to event edit page

- **Admin Dashboard "Command Center" Redesign**
  - Premium dark theme with glassmorphism cards and violet/cyan accent gradients
  - Animated count-up stat cards with hover glow effects
  - Time-based personalized greeting
  - Global Network map with glowing data point markers and pulse animation
  - Live Activity timeline with gradient connecting line and alert bars
  - Outfit font for headers, JetBrains Mono for data/numbers
  - Bento grid layout with responsive design
  - **Light Theme Migration**: Unified light theme for admin dashboard with clean white cards

- **Location Management System (NEW)**
  - `Country` and `City` models for hierarchical location data
  - Countries CRUD with flag emoji picker and timezone selector
  - Cities CRUD with tabbed editor for:
    - Attractions/places to visit
    - Cafes and restaurants
    - Transportation info (airport, metro, taxi)
    - Local tips and emergency contacts
  - Reusable city content for events in the same location
  - Country filter on cities list page

- **Universities Management (Enhanced)**
  - Full CRUD with logo, contact info, and programs list
  - Active/inactive status toggle
  - Event assignment functionality
  - Sidebar navigation for Countries, Cities, Universities

### Fixed
- Analytics route check-in query (corrected to use `checkIn` relation)
- University dashboard event participation query
- Auth adapter type compatibility with next-auth beta
- Icon serialization between Server and Client Components

## [0.1.0] - 2026-01-21

### Added
- **Project Initialization**
  - Next.js 15 with TypeScript, Tailwind CSS, and App Router
  - Prisma ORM with PostgreSQL (Supabase compatible)
  - NextAuth.js v5 with credentials authentication
  - shadcn/ui components (button, card, form, table, dialog, etc.)

- **Public Website**
  - Home page with hero section, stats, upcoming/past events
  - Events listing page with search and filters (country, city)
  - Event detail page with full information and registration form
  - Registration success page with QR code preview
  - "Add to Google Calendar" integration
  - QR verification page (`/r/{token}`)

- **Admin Dashboard**
  - Secure login with role-based access control
  - Dashboard with stats overview (events, registrations, check-ins)
  - Events CRUD (create, edit, list)
  - Registrations management with filters and search
  - CSV export functionality
  - **Admin User Management**: Full CRUD for admin users with name, email, role, and password.
  - **Message Template Management**: Interface to manage email and WhatsApp templates with live preview.
  - **Role-Based Access Control (RBAC)**: Centralized permission system for `SUPER_ADMIN`, `EVENT_MANAGER`, and `EVENT_STAFF`.
  - **Mock Data Fallback**: Admin pages now support mock data mode when the database is unreachable, ensuring UI testability.
  - **Failsafe Login**: Added a hardcoded `admin@example.com` login for development environments.
  - **Admin Sidebar Refactor**: Improved navigation logic and dynamic icon loading for admin pages.
  - Admin users page with role descriptions

- **Marketing Tracking & Zoho CRM Integration**
  - Per-event marketing pixel configuration (Google Analytics, Facebook Pixel, LinkedIn, TikTok, Snapchat)
  - Custom head/body script injection for advanced tracking
  - Zoho CRM lead creation with campaign ID and lead source tracking
  - UTM parameter forwarding to CRM
  - **Zoho CRM Admin Panel**: Admin page to check connection status, send test leads, and view field mapping

- **3D Hero Section**
  - Immersive React Three Fiber hero with floating education-themed elements
  - Graduation caps, globes, and books with smooth animations
  - Particle field and star background for depth
  - Responsive gradient overlays for text readability

- **Editorial Magazine Design Overhaul**
  - Sophisticated dark theme with gold/charcoal color palette
  - Playfair Display serif + DM Sans typography pairing
  - Grain texture overlay for depth and visual interest
  - Animated underlines and staggered reveal animations
  - Full-screen hero with asymmetric stats layout
  - Consistent design across homepage, events listing, and event detail pages

- **QR Scanner & Check-in**
  - Mobile-friendly scanner page with camera access
  - BarcodeDetector API integration for QR scanning
  - Manual token entry fallback
  - Phone/email search fallback
  - Duplicate check-in prevention
  - Live session counter

- **Messaging Integration**
  - SendGrid/Resend email service with enhanced HTML templates
  - Meta WhatsApp Cloud API integration
  - QR code embedding in emails
  - Message logging to database
  - **Email Sequence Skill Compliance**: Refactored Confirmation and Reminder emails to align with best practices (modern design, single CTA, Pro Tips, engaging subject lines).

- **Database**
  - Complete Prisma schema with 10 entities
  - Seed script with sample data
  - Supabase connection pooling support

### Configuration
- Environment variables template (`.env.example`)
- Prisma scripts: generate, migrate, seed, push, studio
