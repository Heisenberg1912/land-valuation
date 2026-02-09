# Vercel Deployment Checklist ✅

Use this checklist to ensure your project is ready for Vercel deployment.

## Pre-Deployment

### Code Repository
- [ ] Code pushed to GitHub/GitLab/Bitbucket
- [ ] `.gitignore` configured correctly
- [ ] No sensitive data (API keys, passwords) in repository
- [ ] `.env.local` NOT committed (should be in `.gitignore`)

### Environment Variables Ready
- [ ] `MONGODB_URI` - MongoDB connection string
- [ ] `MONGODB_DB` - Database name
- [ ] `GEMINI_API_KEY` - Google Gemini API key
- [ ] `ACCESS_CODES` - Pro tier access codes (comma-separated)
- [ ] `NEXT_PUBLIC_MARKETPLACE_URL` - Marketplace/upgrade URL

### MongoDB Atlas Configuration
- [ ] MongoDB Atlas cluster created (free M0 tier is fine)
- [ ] Database user created with read/write permissions
- [ ] IP whitelist configured:
  - [ ] **Add `0.0.0.0/0`** to allow Vercel's dynamic IPs
  - Or add Vercel's IP ranges (more restrictive)
- [ ] Connection string tested locally
- [ ] Database name matches `MONGODB_DB` env var

### Local Testing
- [ ] Run `npm install` successfully
- [ ] Run `npm run build` successfully
- [ ] Test registration flow
- [ ] Test login flow
- [ ] Test free tier (3 prompts limit)
- [ ] Test access code validation
- [ ] Test image analysis
- [ ] No TypeScript errors
- [ ] No console errors

## During Deployment

### Vercel Dashboard
- [ ] Project imported from Git repository
- [ ] Framework preset: **Next.js** (auto-detected)
- [ ] Root directory: `./` (default)
- [ ] Build command: `npm run build` (default)
- [ ] Output directory: `.next` (default)

### Environment Variables in Vercel
Add these in Project Settings → Environment Variables:

#### Production Environment
- [ ] `MONGODB_URI` → Production value
- [ ] `MONGODB_DB` → Production value
- [ ] `GEMINI_API_KEY` → Production value
- [ ] `ACCESS_CODES` → Production codes
- [ ] `APP_URL` → `https://your-app.vercel.app`
- [ ] `NEXT_PUBLIC_MARKETPLACE_URL` → Production URL

#### Preview Environment (Optional)
- [ ] Same variables as production OR
- [ ] Separate staging/preview values

#### Development Environment (Optional)
- [ ] Same as local `.env.local` OR
- [ ] Separate dev values

### First Deployment
- [ ] Build logs show no errors
- [ ] Deployment successful
- [ ] Visit deployment URL
- [ ] Check deployment status (green checkmark)

## Post-Deployment Testing

### Basic Functionality
- [ ] Website loads successfully
- [ ] No 500/404 errors on homepage
- [ ] Images and assets load correctly
- [ ] Styling appears correct
- [ ] Dark/light theme toggle works

### Authentication
- [ ] Registration form works
  - [ ] Create new account
  - [ ] Password validation (min 6 chars)
  - [ ] Auto-login after registration
- [ ] Login form works
  - [ ] Login with correct credentials
  - [ ] Error message for wrong credentials
- [ ] Access code validation works
  - [ ] Enter valid code from `ACCESS_CODES`
  - [ ] Pro badge appears
  - [ ] Invalid code shows error
- [ ] Logout works
  - [ ] Session cleared
  - [ ] Returns to signin state

### Tier System
- [ ] Free tier works
  - [ ] Upload and analyze image (count: 1/3)
  - [ ] Second analysis (count: 2/3)
  - [ ] Third analysis (count: 3/3)
  - [ ] Fourth attempt shows paywall
- [ ] Pro tier via access code
  - [ ] Enter valid access code
  - [ ] Unlimited analyses work
  - [ ] No prompt limit
- [ ] Usage info displays correctly
  - [ ] Visit `/api/usage` returns correct data
  - [ ] User info shows in response

### Image Analysis
- [ ] Base analysis works
  - [ ] Upload construction image
  - [ ] Results display correctly
  - [ ] Progress percentage shown
  - [ ] Stage identified
  - [ ] Timeline estimation shown
- [ ] Advanced analysis works
  - [ ] "Run Tool 10" button enabled after base
  - [ ] Advanced results display
  - [ ] Risk signals shown
  - [ ] Recommendations shown

### CORS Testing
- [ ] Make API request from different domain
- [ ] No CORS errors in console
- [ ] `Access-Control-Allow-Origin: *` header present
- [ ] OPTIONS preflight requests succeed

### Database Connectivity
- [ ] User registrations save to MongoDB
- [ ] Login retrieves user from database
- [ ] Usage tracking updates correctly
- [ ] Session management works

## Performance Check

### Vercel Analytics (Optional)
- [ ] Enable Vercel Analytics
- [ ] Check page load times
- [ ] Monitor API response times
- [ ] Review bandwidth usage

### Free Tier Limits Awareness
- [ ] 100 GB bandwidth/month (Vercel)
- [ ] 100 GB-hours function execution (Vercel)
- [ ] 10 second max function duration (Vercel free)
- [ ] 512 MB storage (MongoDB Atlas M0)

## Production Readiness

### Security
- [ ] All API keys in environment variables
- [ ] No secrets in code repository
- [ ] HTTPS enabled (automatic on Vercel)
- [ ] Cookies are HTTP-only
- [ ] Password hashing with bcrypt

### Monitoring
- [ ] Set up MongoDB Atlas alerts
  - [ ] Storage limit warning
  - [ ] Connection limit warning
- [ ] Check Vercel deployment notifications
- [ ] Monitor error logs in Vercel dashboard

### Documentation
- [ ] README.md updated
- [ ] DEPLOYMENT.md reviewed
- [ ] Environment variables documented
- [ ] API endpoints documented

## Optional Enhancements

### Custom Domain
- [ ] Domain purchased
- [ ] DNS records configured
- [ ] Domain added in Vercel
- [ ] SSL certificate active
- [ ] Update `APP_URL` with custom domain

### Continuous Deployment
- [ ] Automatic deployments on push
- [ ] Branch preview deployments working
- [ ] Main branch deploys to production

### Monitoring & Logging
- [ ] Set up error tracking (Sentry, etc.)
- [ ] Configure log aggregation
- [ ] Set up uptime monitoring

## Troubleshooting Reference

### Build Fails
```bash
# Test locally first
npm run build

# Check TypeScript errors
npm run lint
```

### Database Connection Issues
- Verify MongoDB IP whitelist includes `0.0.0.0/0`
- Check connection string is correct
- Verify database user has permissions

### Function Timeout
- Free tier: 10s limit
- Optimize image processing
- Consider upgrading to Vercel Pro (60s limit)

### Environment Variable Issues
- Double-check all required vars are set
- Verify no typos in variable names
- Check `NEXT_PUBLIC_` prefix for client-side vars

---

## ✅ All Checks Complete?

**You're ready to go live! 🚀**

Visit your deployment: `https://your-app.vercel.app`

---

**Questions?** See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed troubleshooting.
