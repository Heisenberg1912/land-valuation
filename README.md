# VitruviAnalyze - Construction Analysis Platform

AI-powered construction site analysis with free and Pro tier support. Built for Vercel deployment.

## 🚀 Quick Start

### Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   - Copy `.env.example` to `.env.local`
   - Add your MongoDB URI, Gemini API key, and access codes
   - See [.env.example](./.env.example) for all required variables

3. **Run development server:**
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000)

### Deploy to Vercel (Free Tier)

**📖 Complete deployment guide: [DEPLOYMENT.md](./DEPLOYMENT.md)**

Quick steps:
1. Push your code to GitHub/GitLab/Bitbucket
2. Import project in [Vercel](https://vercel.com/new)
3. Add environment variables in Vercel Dashboard
4. Deploy!

## ✨ Features

### Authentication System
- ✅ **Password-based** registration and login (email + password + name)
- ✅ **Access code** support for instant Pro tier access
- ✅ **Session management** with HTTP-only cookies
- ✅ Secure password hashing with bcrypt (12 rounds)

### Free/Pro Tier System
- **Free Tier**: 3 prompts per user/device
- **Pro Tier**: Unlimited prompts via:
  - User subscription (MongoDB `subscription.plan = "pro"`)
  - Valid access code (from `ACCESS_CODES` environment variable)

### Construction Analysis
- **Base Analysis**: Project status, stage, progress percentage, timeline estimation
- **Advanced Analysis**: Cost risk signals, recommendations, timeline drift
- **Multi-language** support (EN, HI, ES, FR, DE, TA, TE, KN, ML, MR, GU, PA, ZH, JA)
- **Multi-currency** support (USD, INR, EUR, GBP, AED, and 20+ more)

### CORS & API Access
- ✅ **Fully open CORS** - access from any domain
- ✅ API routes support cross-origin requests
- ✅ Custom headers (`X-Vitruvi-Access-Code`) supported

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: MongoDB with Mongoose
- **AI**: Google Gemini API (Vision)
- **Auth**: Custom JWT + bcrypt password hashing
- **Payments**: Stripe integration (optional)
- **Hosting**: Vercel (free tier ready!)
- **Styling**: Tailwind CSS

## 📋 Environment Variables

### Required
```bash
MONGODB_URI=your_mongodb_connection_string
MONGODB_DB=your_database_name
GEMINI_API_KEY=your_gemini_api_key
APP_URL=https://your-app.vercel.app
NEXT_PUBLIC_MARKETPLACE_URL=your_marketplace_url
```

### Optional
```bash
ACCESS_CODES=CODE1,CODE2,CODE3  # Pro tier access codes (comma-separated)
STRIPE_SECRET_KEY=your_stripe_key
STRIPE_PRICE_ID=your_price_id
STRIPE_WEBHOOK_SECRET=your_webhook_secret
```

**See [.env.example](./.env.example) for detailed documentation.**

## 📁 Project Structure

```
.
├── app/
│   ├── api/
│   │   ├── auth/           # Login, register, access code validation
│   │   ├── analyze/        # Base image analysis
│   │   ├── advanced/       # Advanced analysis
│   │   ├── usage/          # Usage tracking & tier info
│   │   └── stripe/         # Stripe checkout & webhooks
│   └── page.tsx            # Main UI (image upload, results, auth)
├── lib/
│   ├── models.ts           # MongoDB models (User, Usage, Session)
│   ├── auth.ts             # Auth helpers (login, register, checkHasPro)
│   ├── access-codes.ts     # Access code validation
│   ├── gemini.ts           # Gemini API integration
│   ├── mongo.ts            # MongoDB connection
│   └── schema.ts           # Zod validation schemas
├── middleware.ts           # CORS handling for all API routes
├── next.config.mjs         # Next.js config (CORS headers)
├── vercel.json             # Vercel deployment config
└── DEPLOYMENT.md           # Detailed deployment guide
```

## 🔐 Authentication Modes

### 1. Register (Create Account)
- Name, email, password required
- Password min 6 characters
- Creates user with Free tier
- Auto-login after registration

### 2. Sign In
- Email + password authentication
- Session stored in HTTP-only cookie
- Displays user name and tier badge

### 3. Access Code
- Enter valid code from `ACCESS_CODES` env var
- Instant Pro tier access
- Stored in localStorage
- Sent via `X-Vitruvi-Access-Code` header on all API calls

## 🎯 API Endpoints

### Authentication
```bash
POST /api/auth/register     # Register new user
POST /api/auth/login        # Login with email/password
POST /api/auth/logout       # Logout (clears session)
POST /api/auth/access-code  # Validate access code
```

### Analysis
```bash
POST /api/analyze           # Base analysis (requires image)
POST /api/advanced          # Advanced analysis (requires base result)
GET  /api/usage             # Get usage info and tier status
```

### Example: Analyze with Access Code
```javascript
const response = await fetch('/api/analyze', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Vitruvi-Access-Code': 'YOUR_ACCESS_CODE'  // Optional
  },
  body: JSON.stringify({
    imageDataUrl: 'data:image/jpeg;base64,...',
    meta: {
      location: 'Mumbai',
      projectType: 'Residential',
      language: 'EN'
    }
  })
});
```

## 📊 Tier Comparison

| Feature | Free Tier | Pro Tier |
|---------|-----------|----------|
| Image Analysis | 3 prompts | ✅ Unlimited |
| Advanced Analysis | 3 prompts | ✅ Unlimited |
| Multi-language | ✅ | ✅ |
| Multi-currency | ✅ | ✅ |
| User Registration | ✅ | ✅ |
| Access Codes | ❌ | ✅ |
| Database Subscription | ❌ | ✅ |

## 🔧 Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

## 🌐 CORS Configuration

**All CORS restrictions removed!** You can:
- Embed in iframes from any domain
- Make API calls from any frontend
- Use in mobile apps or browser extensions
- No origin restrictions

Headers set:
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization, X-Vitruvi-Access-Code
```

## 📖 Documentation

- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Complete Vercel deployment guide
- **[.env.example](./.env.example)** - Environment variables reference

## 🐛 Troubleshooting

Common issues and solutions in [DEPLOYMENT.md](./DEPLOYMENT.md#troubleshooting)

## 📄 License

Proprietary - All rights reserved

---

**Built with ❤️ for construction professionals**
