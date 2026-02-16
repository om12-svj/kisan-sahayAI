# 🌾 KISAN SAHAY - Farmer Mental Health Support System Backend

A comprehensive Node.js/TypeScript backend API for supporting farmer mental health through mood tracking, AI-driven risk analysis, and personalized interventions.

## ✨ Features

### 🔐 Authentication & Security
- **OTP-based Authentication** - Phone/SMS verification via MSG91 and WhatsApp (Twilio)
- **JWT Token System** - Secure access & refresh token mechanism
- **Role-based Access Control** - Farmer, Counselor, District Admin, Super Admin roles
- **AES-256-GCM Encryption** - For sensitive data at rest
- **Rate Limiting** - Protection against abuse

### 📊 Mood Tracking & Assessment
- **Weekly Check-ins** - Structured mood and wellness assessments
- **Multi-factor Risk Scoring** - Crop condition, loan pressure, sleep quality, family support, hope level
- **Automatic Risk Classification** - LOW, MODERATE, HIGH, CRITICAL levels
- **Alert Generation** - Automatic alerts for high-risk cases

### 🤖 AI-Driven Analysis
- **Sentiment Analysis** - Multi-language keyword-based analysis (Marathi, Hindi, English)
- **Critical Risk Detection** - Automatic detection of crisis keywords
- **Personalized Feedback** - Context-aware response generation
- **Risk Trend Analytics** - Historical analysis for patterns

### 📱 Automated Notifications
- **SMS Reminders** - Weekly check-in reminders via MSG91
- **WhatsApp Integration** - Rich messages via Twilio
- **Follow-up Alerts** - Automated follow-ups for high-risk cases
- **Counselor Notifications** - Real-time alerts for assigned cases

### 👥 Admin Dashboard API
- **Dashboard Statistics** - Real-time overview of farmer wellness
- **Farmer Management** - List, filter, and view farmer details
- **Alert Management** - Acknowledge, resolve, and track alerts
- **Counselor Assignment** - Assign counselors to farmers
- **Analytics & Trends** - Risk distribution and trend analysis

### 🌐 Multi-Language Support (i18n)
- **Primary Languages** - Marathi (मराठी), Hindi (हिंदी), English
- **Additional Languages** - Telugu, Kannada, Punjabi, Gujarati, Bengali
- **Localized Messages** - All responses in user's preferred language

## 🏗️ Architecture

```
src/
├── app.ts                 # Express app configuration
├── server.ts              # Server entry point
├── config/                # Configuration
│   ├── database.ts        # Prisma client
│   ├── env.ts             # Environment variables
│   └── index.ts
├── modules/               # Feature modules
│   ├── auth/              # Authentication
│   ├── farmer/            # Farmer management
│   ├── checkin/           # Check-in & risk assessment
│   └── admin/             # Admin dashboard
├── services/              # Core services
│   ├── notification/      # SMS, WhatsApp, Email
│   ├── reminder/          # Automated reminders
│   ├── ai/                # Sentiment analysis
│   └── i18n/              # Internationalization
├── shared/                # Shared utilities
│   ├── middleware/        # Auth, validation, error handling
│   ├── types/             # TypeScript types
│   └── utils/             # Hash, JWT, encryption
└── prisma/               
    └── schema.prisma      # Database schema
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- SQLite (development) or PostgreSQL (production)

### Installation

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Generate Prisma client
npm run prisma:generate

# Push database schema
npm run prisma:push

# Start development server
npm run dev
```

## 📋 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/register` | Register new farmer |
| POST | `/api/v1/auth/login` | Login with password |
| POST | `/api/v1/auth/otp/send` | Send OTP |
| POST | `/api/v1/auth/otp/verify` | Verify OTP and login |
| POST | `/api/v1/auth/refresh` | Refresh tokens |
| POST | `/api/v1/auth/logout` | Logout |
| GET | `/api/v1/auth/me` | Get current user |

### Farmer
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/farmers/me` | Get profile |
| PATCH | `/api/v1/farmers/me` | Update profile |
| GET | `/api/v1/farmers/me/checkins` | Get check-in history |
| GET | `/api/v1/farmers/me/stats` | Get statistics |

### Check-ins
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/checkins` | Submit check-in |
| GET | `/api/v1/checkins/:id` | Get check-in by ID |

### Admin Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/admin/login` | Admin login |
| GET | `/api/v1/admin/dashboard` | Dashboard stats |
| GET | `/api/v1/admin/farmers` | List farmers |
| GET | `/api/v1/admin/farmers/:id` | Farmer details |
| GET | `/api/v1/admin/alerts` | List alerts |
| PATCH | `/api/v1/admin/alerts/:id` | Update alert |
| GET | `/api/v1/admin/counselors` | List counselors |
| POST | `/api/v1/admin/counselors/assign` | Assign counselor |
| GET | `/api/v1/admin/checkins` | List check-ins |
| GET | `/api/v1/admin/analytics/trends` | Risk trends |
| POST | `/api/v1/admin/notifications/send` | Send reminder |

## 🔧 Environment Variables

```env
# Server
NODE_ENV=development
PORT=3001

# Database
DATABASE_URL="file:./dev.db"

# JWT
JWT_ACCESS_SECRET="your-secret-key"
JWT_REFRESH_SECRET="your-refresh-secret"
JWT_ACCESS_EXPIRY="15m"
JWT_REFRESH_EXPIRY="7d"

# OTP
OTP_EXPIRY_MINUTES=5
OTP_MAX_ATTEMPTS=3

# SMS (MSG91)
MSG91_AUTH_KEY="your-key"
MSG91_SENDER_ID="KISANS"
MSG91_TEMPLATE_ID="your-template"

# WhatsApp (Twilio)
TWILIO_ACCOUNT_SID="your-sid"
TWILIO_AUTH_TOKEN="your-token"
TWILIO_WHATSAPP_FROM="whatsapp:+14155238886"

# Email (SMTP)
SMTP_HOST="smtp.example.com"
SMTP_PORT=587
SMTP_USER="your-user"
SMTP_PASS="your-pass"

# Encryption
ENCRYPTION_SECRET="min-32-char-secret"

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
```

## 📦 Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run typecheck    # Type check without emit
npm run lint         # Run ESLint
npm run format       # Format with Prettier

# Prisma
npm run prisma:generate  # Generate Prisma client
npm run prisma:migrate   # Run migrations
npm run prisma:push      # Push schema (dev)
npm run prisma:studio    # Open Prisma Studio
```

## 🗃️ Database Models

- **Farmer** - User profiles with location and preferences
- **CheckIn** - Mood assessments with risk scores
- **Alert** - High-risk case notifications
- **AdminUser** - Admin/counselor accounts
- **RefreshToken** - JWT refresh token storage
- **OTPLog** - OTP verification tracking

## 🔒 Security Features

1. **Password Hashing** - bcrypt with salt rounds
2. **Token Security** - Short-lived access tokens, secure refresh rotation
3. **Data Encryption** - AES-256-GCM for sensitive data
4. **Input Validation** - Zod schema validation
5. **Rate Limiting** - Configurable request limits
6. **CORS** - Configurable origin restrictions
7. **Helmet** - Security headers

## 🌍 Supported Languages

| Code | Language | Native Name |
|------|----------|-------------|
| mr | Marathi | मराठी |
| hi | Hindi | हिंदी |
| en | English | English |
| te | Telugu | తెలుగు |
| kn | Kannada | ಕನ್ನಡ |
| pa | Punjabi | ਪੰਜਾਬੀ |
| gu | Gujarati | ગુજરાતી |
| bn | Bengali | বাংলা |

## 📞 Helpline Integration

The system is designed to connect farmers with mental health resources:
- **National Helpline**: 1800-233-4000
- **iCall**: 9152987821
- **Vandrevala Foundation**: 1860-2662-345
- **Kisan Call Center**: 1551

## 📄 License

MIT License - See LICENSE file for details

---

Built with ❤️ for Indian Farmers 🇮🇳
