# Quick Deploy to Vercel 🚀

Your code is now on GitHub: **https://github.com/Heisenberg1912/land-valuation**

## Deploy in 5 Minutes

### Step 1: Import to Vercel

1. Go to **https://vercel.com/new**
2. Click "Import Git Repository"
3. Paste: `https://github.com/Heisenberg1912/land-valuation`
4. Click "Import"

### Step 2: Configure Project

Vercel will auto-detect Next.js. Just click **"Deploy"** for now (we'll add env vars next).

### Step 3: Add Environment Variables

After first deployment, go to:
**Project Settings → Environment Variables**

Add these (all environments: Production, Preview, Development):

```bash
MONGODB_URI=mongodb+srv://Titiksha-builtattic:Titiksha%401111@marketplace-builtattic.y8ruzz2.mongodb.net/Titiksha-builtattic?retryWrites=true&w=majority&appName=marketplace-builtattic

MONGODB_DB=Titiksha-builtattic

GEMINI_API_KEY=AIzaSyBER7bUT1m9dz0fi1FkeCzW9WIKEycq2Js

ACCESS_CODES=DEMO123,TESTCODE456,PROKEY789

NEXT_PUBLIC_MARKETPLACE_URL=https://www.builtattic.com/products/vitruviai-pro-access?variant=47204727128299

APP_URL=https://your-deployment-name.vercel.app
```

**Important:** Update `APP_URL` with your actual Vercel deployment URL after you see it.

### Step 4: Redeploy

After adding environment variables:
1. Go to **Deployments** tab
2. Click "..." on latest deployment
3. Click **"Redeploy"**

### Step 5: MongoDB Atlas Setup

⚠️ **Critical Step:**

1. Go to **https://cloud.mongodb.com**
2. Select your cluster: `marketplace-builtattic`
3. Click **"Network Access"** (left sidebar)
4. Click **"Add IP Address"**
5. Enter: `0.0.0.0/0` (Allow access from anywhere)
6. Click **"Confirm"**

This allows Vercel's dynamic IPs to connect to your database.

## ✅ Test Your Deployment

Visit: `https://your-deployment-name.vercel.app`

### Test Checklist:
- [ ] Page loads successfully
- [ ] Register a new account (email + password + name)
- [ ] Login with credentials
- [ ] Upload an image and analyze (free tier: 1/3)
- [ ] Test access code: Enter `DEMO123` in Access Code mode
- [ ] Verify Pro badge appears
- [ ] Test unlimited prompts with Pro tier

## 🔧 Update Environment Variables Anytime

1. Go to your project in Vercel
2. **Settings → Environment Variables**
3. Edit or add new variables
4. **Redeploy** for changes to take effect

## 📊 Monitor Your Deployment

### Vercel Dashboard
- **Overview**: See deployment status
- **Deployments**: View all deployments and logs
- **Analytics**: Monitor traffic (free tier included)
- **Logs**: Debug runtime errors

### MongoDB Atlas
- **Metrics**: Database performance
- **Collections**: View stored data
  - `users` - User accounts
  - `usages` - Free tier usage tracking
  - `sessions` - Active sessions

## 🎯 Access Codes

Current valid codes (from `ACCESS_CODES` env var):
- `DEMO123`
- `TESTCODE456`
- `PROKEY789`

To add more codes:
1. Edit `ACCESS_CODES` in Vercel environment variables
2. Add comma-separated codes: `CODE1,CODE2,CODE3`
3. Redeploy

## 🔗 Useful Links

- **GitHub Repo**: https://github.com/Heisenberg1912/land-valuation
- **Vercel Dashboard**: https://vercel.com/dashboard
- **MongoDB Atlas**: https://cloud.mongodb.com
- **Full Documentation**: See [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Deployment Checklist**: See [VERCEL_CHECKLIST.md](./VERCEL_CHECKLIST.md)

## 🆘 Troubleshooting

### Build Failed
- Check build logs in Vercel
- Ensure all dependencies in `package.json`
- Try building locally: `npm run build`

### Can't Connect to Database
- Verify `MONGODB_URI` is correct
- Check MongoDB Atlas IP whitelist includes `0.0.0.0/0`
- Test connection string locally

### Environment Variables Not Working
- Make sure variables are added to ALL environments
- Check spelling matches exactly
- Redeploy after adding variables

### 403/404 Errors
- Check Vercel deployment logs
- Verify API routes are deployed
- Check CORS configuration (already done)

## 📱 Custom Domain (Optional)

1. Go to **Settings → Domains**
2. Add your custom domain
3. Configure DNS as instructed
4. Update `APP_URL` environment variable
5. Redeploy

---

**You're live! 🎉**

Your app is now deployed and accessible worldwide with:
- ✅ Free tier (3 prompts) + Pro tier (unlimited)
- ✅ Password authentication
- ✅ Access code system
- ✅ Full CORS support
- ✅ AI-powered construction analysis

Need help? See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed documentation.
