# Memory Mesh - Free Cloud Deployment Guide

Complete guide to deploying Memory Mesh on free cloud services.

## Prerequisites

- GitHub account
- Google/GitHub OAuth credentials (optional)
- 30 minutes of your time

## Step 1: Database Setup (Neon PostgreSQL)

### Create Neon Account
1. Go to [neon.tech](https://neon.tech)
2. Sign up with GitHub
3. Click "Create Project"
4. Name: `memory-mesh-db`
5. Region: Choose closest to you
6. Click "Create Project"

### Get Connection String
1. Click "Connection Details"
2. Copy the connection string (starts with `postgresql://`)
3. Save it - you'll need it later

### Run Migrations
```bash
# Update .env with Neon connection string
MEMORY_DATABASE_URL=postgresql://user:pass@ep-xxx.neon.tech/neondb

# Run migrations
alembic upgrade head
```

---

## Step 2: Redis Setup (Upstash)

### Create Upstash Account
1. Go to [upstash.com](https://upstash.com)
2. Sign up with GitHub
3. Click "Create Database"
4. Name: `memory-mesh-redis`
5. Type: Regional
6. Region: Choose same as Neon
7. Click "Create"

### Get Connection String
1. Click on your database
2. Scroll to "REST API"
3. Copy the Redis URL (starts with `redis://`)
4. Save it for later

---

## Step 3: Backend Deployment (Render)

### Push to GitHub
```bash
cd /Users/its.shubhhh/Desktop/memory\ layer
git add .
git commit -m "Add deployment configuration"
git push origin main
```

### Create Render Account
1. Go to [render.com](https://render.com)
2. Sign up with GitHub
3. Click "New +" → "Blueprint"
4. Connect your GitHub repository
5. Select `memory-layer` repo
6. Render will detect `render.yaml`
7. Click "Apply"

### Configure Environment Variables
In Render dashboard, go to your web service and add:

```bash
MEMORY_DATABASE_URL=<your-neon-connection-string>
MEMORY_REDIS_URL=<your-upstash-connection-string>
JWT_SECRET_KEY=<generate-with-command-below>
GOOGLE_CLIENT_ID=<your-google-client-id>
GOOGLE_CLIENT_SECRET=<your-google-client-secret>
GITHUB_CLIENT_ID=<your-github-client-id>
GITHUB_CLIENT_SECRET=<your-github-client-secret>
OAUTH_REDIRECT_URL=https://your-frontend.vercel.app/api/auth/callback
```

Generate JWT secret:
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

### Deploy
1. Click "Manual Deploy" → "Deploy latest commit"
2. Wait 5-10 minutes for build
3. Your API will be at: `https://memory-mesh-api.onrender.com`

---

## Step 4: Frontend Deployment (Vercel)

### Create Vercel Account
1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub
3. Click "Add New..." → "Project"
4. Import your GitHub repository
5. **Important**: Set "Root Directory" to `frontend`
6. Click "Deploy"

### Configure Environment Variables
In Vercel dashboard, go to Settings → Environment Variables:

```bash
NEXT_PUBLIC_API_BASE_URL=https://memory-mesh-api.onrender.com
NEXT_PUBLIC_GOOGLE_CLIENT_ID=<your-google-client-id>
NEXT_PUBLIC_GITHUB_CLIENT_ID=<your-github-client-id>
```

### Redeploy
1. Go to Deployments
2. Click "..." on latest deployment
3. Click "Redeploy"
4. Your frontend will be at: `https://memory-mesh.vercel.app`

---

## Step 5: Update OAuth Redirect URLs

### Google Cloud Console
1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Select your project
3. Go to "Credentials"
4. Edit your OAuth 2.0 Client ID
5. Add authorized redirect URI:
   ```
   https://your-frontend.vercel.app/api/auth/callback
   ```
6. Save

### GitHub OAuth App
1. Go to [github.com/settings/developers](https://github.com/settings/developers)
2. Click on your OAuth App
3. Update "Authorization callback URL":
   ```
   https://your-frontend.vercel.app/api/auth/callback
   ```
4. Save

---

## Step 6: Test Your Deployment

### Test Backend
```bash
curl https://memory-mesh-api.onrender.com/v1/admin/health
```

Should return: `{"status":"healthy"}`

### Test Frontend
1. Visit `https://memory-mesh.vercel.app`
2. Click "Try Dashboard" → should redirect to login
3. Register with email
4. Login and access dashboard
5. Test OAuth login (if configured)

---

## Troubleshooting

### Backend won't start
- Check Render logs for errors
- Verify database connection string
- Ensure all environment variables are set

### Frontend can't reach backend
- Check CORS settings in backend
- Verify `NEXT_PUBLIC_API_BASE_URL` is correct
- Check Render service is running (free tier sleeps)

### OAuth not working
- Verify redirect URLs match exactly
- Check client IDs are correct
- Ensure secrets are set in backend

### Database connection errors
- Verify Neon connection string
- Check if database is active
- Run migrations: `alembic upgrade head`

---

## Free Tier Limitations

**Render Free Tier:**
- Sleeps after 15 minutes of inactivity
- First request after sleep takes ~30 seconds (cold start)
- 750 hours/month (enough for 1 service)

**Workaround**: Use a service like [UptimeRobot](https://uptimerobot.com) to ping your API every 14 minutes to keep it awake.

**Neon Free Tier:**
- 0.5 GB storage
- 1 active project
- Connection pooling recommended

**Upstash Free Tier:**
- 10,000 commands/day
- 256 MB storage
- Perfect for async jobs

---

## Custom Domain (Optional)

### Vercel
1. Go to Settings → Domains
2. Add your domain
3. Update DNS records as shown
4. Wait for SSL certificate

### Render
1. Go to Settings → Custom Domain
2. Add your domain
3. Update DNS records
4. Wait for SSL certificate

---

## Monitoring

### Render Dashboard
- View logs in real-time
- Monitor CPU/memory usage
- Check deployment status

### Vercel Analytics
- Free analytics included
- View page views, performance
- Monitor errors

---

## Next Steps

1. ✅ Deploy to production
2. Set up monitoring/alerts
3. Configure custom domain
4. Add error tracking (Sentry)
5. Set up backups
6. Monitor usage and upgrade if needed

---

## Support

If you encounter issues:
1. Check Render/Vercel logs
2. Review environment variables
3. Test locally first
4. Check OAuth configuration
5. Verify database migrations ran

Your app is now live and free! 🎉
