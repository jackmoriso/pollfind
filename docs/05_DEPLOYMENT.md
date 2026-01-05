# Deployment Guide - Pollfind to GCP

**Last Updated:** 2026-01-06
**Environment:** GCP VM (asia-southeast1-b)
**Server:** qa-automation-runner

---

## 📋 Table of Contents

1. [Deployment Architecture](#deployment-architecture)
2. [GitHub Secrets Configuration](#github-secrets-configuration)
3. [Manual Deployment](#manual-deployment)
4. [Automatic Deployment (GitHub Actions)](#automatic-deployment)
5. [Monitoring & Logs](#monitoring--logs)
6. [Troubleshooting](#troubleshooting)

---

## 1. Deployment Architecture

```
GitHub Repository (main branch)
        ↓
GitHub Actions Triggered
        ↓
Build .env from secrets
        ↓
SSH to GCP VM
        ↓
Pull latest code
        ↓
npm install → npm run build
        ↓
PM2 restart pollfind
        ↓
✅ Running on VM
```

**VM Details:**
- **Project:** apps-staging-wvisc
- **Zone:** asia-southeast1-b
- **Instance:** qa-automation-runner
- **Path:** `/home/jack_initia_xyz/pollfind`
- **Process Manager:** PM2
- **User:** jack_initia_xyz

---

## 2. GitHub Secrets Configuration

### 🔐 Required Secrets

Go to: `https://github.com/jackmoriso/pollfind/settings/secrets/actions`

Click **"New repository secret"** and add each of these:

#### SSH Connection Secrets

| Secret Name | Value | Example |
|-------------|-------|---------|
| `SSH_HOST` | VM external IP | `34.124.193.161` |
| `SSH_USER` | SSH username | `jack_initia_xyz` |
| `SSH_PRIVATE_KEY` | Private SSH key | (see below) |

#### Application Environment Secrets

| Secret Name | Value | Default | Required |
|-------------|-------|---------|----------|
| `ENV_POLYMARKET_API_URL` | `https://clob.polymarket.com` | ✓ | Yes |
| `ENV_GAMMA_API_URL` | `https://gamma-api.polymarket.com` | ✓ | Yes |
| `ENV_POLYGON_RPC_URL` | `https://polygon-rpc.com` | ✓ | No |
| `ENV_POLL_INTERVAL_MS` | `5000` | ✓ | No |
| `ENV_MIN_TRADE_SIZE_USD` | `2500` | ✓ | No |
| `ENV_ALERT_LARGE_TRADE` | `10000` | ✓ | No |
| `ENV_ALERT_WHALE_TRADE` | `50000` | ✓ | No |
| `ENV_ALERT_VOLUME_SPIKE` | `2.0` | ✓ | No |
| `ENV_ALERT_PRICE_MOVE` | `0.10` | ✓ | No |
| `ENV_WATCH_MARKETS` | `` | (empty) | No |
| `ENV_WATCH_WALLETS` | `` | (empty) | No |
| `ENV_TELEGRAM_BOT_TOKEN` | Your bot token | (empty) | No |
| `ENV_TELEGRAM_CHAT_ID` | Your chat ID | (empty) | No |
| `ENV_DISCORD_WEBHOOK_URL` | Your webhook URL | (empty) | No |
| `ENV_DATABASE_PATH` | `./data/trades.db` | ✓ | No |

---

### 🔑 Getting SSH Private Key

**On your local machine:**

```bash
# 1. SSH to the VM
gcloud compute ssh --zone "asia-southeast1-b" "qa-automation-runner" --project "apps-staging-wvisc"

# 2. Check if SSH key exists for GitHub
cat ~/.ssh/id_rsa.pub

# If key doesn't exist, create one:
ssh-keygen -t rsa -b 4096 -C "pollfind-deploy" -f ~/.ssh/id_rsa -N ""

# 3. Add public key to GitHub
# Copy the output and add to: https://github.com/jackmoriso/pollfind/settings/keys
cat ~/.ssh/id_rsa.pub

# 4. Get PRIVATE key for GitHub Secrets
cat ~/.ssh/id_rsa
```

Copy the **entire private key** (including `-----BEGIN` and `-----END` lines) and paste into GitHub Secret `SSH_PRIVATE_KEY`.

---

### 📱 Optional: Telegram Bot Setup

1. Message @BotFather on Telegram
2. Send `/newbot` and follow instructions
3. Copy the bot token → `ENV_TELEGRAM_BOT_TOKEN`
4. Message @userinfobot to get your chat ID
5. Copy chat ID → `ENV_TELEGRAM_CHAT_ID`

---

### 💬 Optional: Discord Webhook Setup

1. Go to Discord Server Settings > Integrations > Webhooks
2. Create a new webhook
3. Copy the webhook URL → `ENV_DISCORD_WEBHOOK_URL`

---

## 3. Manual Deployment

### Option A: On the VM (Recommended for first deployment)

```bash
# 1. SSH to VM
gcloud compute ssh --zone "asia-southeast1-b" "qa-automation-runner" --project "apps-staging-wvisc"

# 2. Clone repository (first time only)
cd ~
git clone git@github.com:jackmoriso/pollfind.git
cd pollfind

# 3. Create .env file
cp .env.example .env
nano .env  # Edit with your values

# 4. Install dependencies
npm install

# 5. Build application
npm run build

# 6. Make start script executable
chmod +x start.sh

# 7. Create logs directory
mkdir -p logs

# 8. Start with PM2
pm2 start ecosystem.config.js

# 9. Save PM2 config
pm2 save

# 10. Check status
pm2 status
pm2 logs pollfind
```

### Option B: Using deploy.sh (Coming soon)

You can create a `deploy.sh` script similar to gufun if needed.

---

## 4. Automatic Deployment (GitHub Actions)

### 🚀 How it Works

1. Push code to `main` branch
2. GitHub Actions automatically triggers
3. Workflow builds .env from secrets
4. SSH to VM
5. Pull latest code
6. Build and restart with PM2

### Trigger Deployment

```bash
# Automatic: Just push to main
git add .
git commit -m "feat: your changes"
git push origin main

# Manual: Trigger via GitHub UI
# Go to: Actions → Deploy to GCP → Run workflow
```

### Monitor Deployment

```bash
# Watch GitHub Actions
# https://github.com/jackmoriso/pollfind/actions

# Or SSH and check logs
gcloud compute ssh --zone "asia-southeast1-b" "qa-automation-runner" --project "apps-staging-wvisc"
pm2 logs pollfind
```

---

## 5. Monitoring & Logs

### PM2 Commands

```bash
# SSH to VM first
gcloud compute ssh --zone "asia-southeast1-b" "qa-automation-runner" --project "apps-staging-wvisc"

# View status
pm2 status

# View logs (real-time)
pm2 logs pollfind

# View last 100 lines
pm2 logs pollfind --lines 100

# View only errors
pm2 logs pollfind --err

# Monitor resources
pm2 monit

# Restart app
pm2 restart pollfind

# Stop app
pm2 stop pollfind

# Delete app from PM2
pm2 delete pollfind
```

### Log Files

```bash
# Application logs are stored in:
~/pollfind/logs/
  ├── combined.log  # All logs
  ├── out.log       # stdout
  └── err.log       # stderr

# View logs
tail -f ~/pollfind/logs/combined.log
```

---

## 6. Troubleshooting

### Issue: Deployment fails with "Permission denied"

**Solution:**
```bash
# SSH to VM
gcloud compute ssh --zone "asia-southeast1-b" "qa-automation-runner" --project "apps-staging-wvisc"

# Check SSH key
cat ~/.ssh/id_rsa.pub

# Add to GitHub: https://github.com/settings/keys
```

### Issue: PM2 not found

**Solution:**
```bash
# Install PM2 globally
npm install -g pm2
```

### Issue: App crashes immediately

**Solution:**
```bash
# Check logs
pm2 logs pollfind --err

# Common causes:
# 1. Missing .env file
# 2. Invalid environment variables
# 3. Port already in use

# Verify .env
cat ~/pollfind/.env

# Check running processes
ps aux | grep node
```

### Issue: GitHub Actions can't SSH

**Solution:**
1. Verify `SSH_HOST` secret has correct IP
2. Verify `SSH_USER` secret is `jack_initia_xyz`
3. Verify `SSH_PRIVATE_KEY` includes full key with headers
4. Check VM firewall allows SSH (port 22)

### Issue: Environment variables not loading

**Solution:**
```bash
# On VM, test manually
cd ~/pollfind
source .env
echo $POLYMARKET_API_URL  # Should output URL

# If empty, check .env format
cat .env | grep POLYMARKET
```

---

## 7. Deployment Checklist

### First Time Setup

- [ ] Add SSH public key to GitHub Deploy Keys
- [ ] Configure all GitHub Secrets
- [ ] SSH to VM and clone repository
- [ ] Create .env file on VM
- [ ] Test manual deployment
- [ ] Verify PM2 is running
- [ ] Test automatic deployment

### Every Deployment

- [ ] Code pushed to main branch
- [ ] GitHub Actions runs successfully
- [ ] PM2 shows app as "online"
- [ ] Check logs for errors
- [ ] Verify alerts are working (if configured)

---

## 8. Quick Commands Reference

```bash
# === LOCAL ===

# SSH to VM
gcloud compute ssh --zone "asia-southeast1-b" "qa-automation-runner" --project "apps-staging-wvisc"

# Deploy
git push origin main  # Triggers auto-deployment


# === ON VM ===

# Navigate to project
cd ~/pollfind

# Pull latest
git pull origin main

# Rebuild
npm install && npm run build

# Restart
pm2 restart pollfind

# Logs
pm2 logs pollfind

# Status
pm2 status
```

---

## 9. Architecture Comparison

| Aspect | Gufun (Next.js) | Pollfind (Node.js) |
|--------|-----------------|---------------------|
| Port | 8080 | N/A (no HTTP server) |
| Start Command | `npm start` | `node dist/index.js` |
| Process Type | Web Server | Background Service |
| Logs | HTTP requests | Trade monitoring |
| Memory | ~50MB | ~50MB |
| Restart | On crash | On crash |

---

## 10. Security Notes

- ✅ `.env` file is NOT committed to git
- ✅ All secrets stored in GitHub Secrets
- ✅ SSH key is private, never exposed
- ✅ `.env` file has 600 permissions on VM
- ⚠️ Telegram/Discord tokens are sensitive

---

**Last Updated:** 2026-01-06
**Next Review:** After first successful deployment

---

*End of Deployment Documentation*
