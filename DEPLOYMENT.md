# Vercel Deployment Guide

This guide will help you deploy the VitruviAnalyze project to Vercel's free tier.

## Prerequisites

1. **Vercel Account** - Sign up at [vercel.com](https://vercel.com)
2. **GitHub/GitLab/Bitbucket** - Repository for automatic deployments
3. **MongoDB Atlas** - Free tier database (already configured)
4. **Gemini API Key** - From Google AI Studio

## Step 1: Prepare Your Repository

1. Initialize git repository (if not already):
   ```bash
   cd "d:\vitruvialyze-vercel-fullstack 2\vitruvialyze-vercel-fullstack"
   git init
   git add .
   git commit -m "Initial commit"
   ```

2. Push to GitHub/GitLab/Bitbucket:
   ```bash
   git remote add origin YOUR_REPO_URL
   git push -u origin main
   ```

## Step 2: Deploy to Vercel

### Option A: Using Vercel Dashboard (Recommended)

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your Git repository
3. Configure project:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./` (default)
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `.next` (default)

### Option B: Using Vercel CLI

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Deploy:
   ```bash
   vercel
   ```

## Step 3: Configure Environment Variables

In Vercel Dashboard → Your Project → Settings → Environment Variables, add:

### Required Variables

| Variable | Value | Environment |
|----------|-------|-------------|
| `MONGODB_URI` | Your MongoDB connection string | Production, Preview, Development |
| `MONGODB_DB` | `Titiksha-builtattic` | Production, Preview, Development |
| `GEMINI_API_KEY` | Your Gemini API key | Production, Preview, Development |
| `APP_URL` | `https://your-app.vercel.app` | Production |
| `NEXT_PUBLIC_MARKETPLACE_URL` | Your marketplace URL | Production, Preview, Development |

### Optional Variables

| Variable | Value | Notes |
|----------|-------|-------|
| `ACCESS_CODES` | Comma-separated codes | E.g., `CODE1,CODE2,CODE3` |
| `STRIPE_SECRET_KEY` | Your Stripe secret key | If using Stripe |
| `STRIPE_PRICE_ID` | Your Stripe price ID | If using Stripe |
| `STRIPE_WEBHOOK_SECRET` | Your Stripe webhook secret | If using Stripe |

**Example ACCESS_CODES:**
```
DEMO123,TESTCODE456,PROKEY789
```

## Step 4: Verify Deployment

1. Visit your deployed URL: `https://your-app.vercel.app`
2. Test authentication:
   - Register a new account
   - Login with credentials
   - Try access code validation
3. Test image analysis:
   - Upload an image
   - Verify free tier (3 prompts)
   - Test with access code for Pro tier

## Step 5: Set Up Custom Domain (Optional)

1. Go to Project Settings → Domains
2. Add your custom domain
3. Configure DNS records as instructed by Vercel
4. Update `APP_URL` environment variable with your custom domain

## Vercel Free Tier Limits

✅ **Included in Free Tier:**
- 100 GB bandwidth per month
- Serverless function execution: 100 GB-hours
- Function duration: 10 seconds max
- 100 deployments per day
- Automatic SSL certificates
- Global CDN

⚠️ **Important Notes:**
- Free tier is suitable for development and small projects
- For production with high traffic, consider upgrading to Pro ($20/month)
- MongoDB Atlas free tier (M0) includes 512 MB storage

## Performance Optimization

The project is already optimized for Vercel:

✅ **Implemented:**
- Next.js App Router for efficient routing
- Server-side rendering where beneficial
- API routes with proper caching headers
- CORS configured for cross-origin access
- Middleware for request optimization

## Troubleshooting

### Build Failures

**Problem**: Build fails with TypeScript errors
```bash
# Solution: Run locally first
npm run build
```

**Problem**: Missing environment variables
```bash
# Solution: Add all required env vars in Vercel Dashboard
```

### Runtime Errors

**Problem**: "Cannot connect to MongoDB"
```bash
# Solution: Check MONGODB_URI is correct and IP whitelist in MongoDB Atlas
# Add 0.0.0.0/0 to allow Vercel's dynamic IPs
```

**Problem**: "Gemini API error"
```bash
# Solution: Verify GEMINI_API_KEY is valid
# Check API quota in Google AI Studio
```

**Problem**: CORS errors
```bash
# Solution: Already configured! middleware.ts handles all CORS
```

### Function Timeout

**Problem**: "Function execution timed out"
```bash
# Solution: Free tier has 10s limit
# Optimize image processing or upgrade to Pro (60s limit)
```

## Monitoring

### Vercel Analytics
- Enable in Project Settings → Analytics
- Free tier includes basic analytics
- Monitor bandwidth and function invocations

### MongoDB Atlas Monitoring
- Check database performance in Atlas dashboard
- Monitor storage usage (free tier: 512 MB)
- Set up alerts for storage limits

## Continuous Deployment

Vercel automatically deploys when you push to your repository:

```bash
git add .
git commit -m "Your changes"
git push
```

- **Main/Master branch** → Production deployment
- **Other branches** → Preview deployments

## Security Best Practices

✅ **Already Implemented:**
- Password hashing with bcrypt
- HTTP-only cookies for sessions
- Environment variables for secrets
- CORS protection (configurable)
- Rate limiting via tier system

🔒 **Additional Recommendations:**
- Enable Vercel's DDoS protection (automatic)
- Set up Vercel's WAF (Pro tier)
- Monitor access logs regularly
- Rotate access codes periodically

## Cost Estimation

### Free Tier (Current Setup)
- **Cost**: $0/month
- **Suitable for**: Development, demos, low-traffic apps
- **Limitations**: 100 GB bandwidth, 10s function timeout

### If You Need More:
- **Vercel Pro**: $20/month
  - 1 TB bandwidth
  - 60s function timeout
  - Advanced analytics

- **MongoDB Atlas**: Free tier sufficient for most use cases
  - Upgrade to M10 ($57/month) for production

## Support

- **Vercel Docs**: https://vercel.com/docs
- **Next.js Docs**: https://nextjs.org/docs
- **MongoDB Atlas Docs**: https://docs.atlas.mongodb.com

## Quick Commands

```bash
# Deploy to production
vercel --prod

# View deployment logs
vercel logs your-deployment-url

# List deployments
vercel ls

# Remove deployment
vercel remove deployment-name
```

---

## Summary Checklist

Before going live:

- [ ] Environment variables configured in Vercel
- [ ] MongoDB Atlas IP whitelist includes 0.0.0.0/0
- [ ] Gemini API key is valid and has quota
- [ ] Access codes are set (if using)
- [ ] Marketplace URL is correct
- [ ] Custom domain configured (optional)
- [ ] Test registration and login
- [ ] Test free tier limits (3 prompts)
- [ ] Test Pro tier with access code
- [ ] CORS working from your domain
- [ ] Analytics enabled

**You're ready to deploy! 🚀**
