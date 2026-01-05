# 🚀 Deployment Quick Start

**Get pollfind running on GCP in 10 minutes!**

---

## Step 1: Get SSH Key (2 min)

```bash
# SSH to your VM
gcloud compute ssh --zone "asia-southeast1-b" "qa-automation-runner" --project "apps-staging-wvisc"

# Get the private key
cat ~/.ssh/id_rsa
```

Copy the **entire output** (including BEGIN/END lines).

---

## Step 2: Add GitHub Secrets (5 min)

Go to: https://github.com/jackmoriso/pollfind/settings/secrets/actions

Add these **3 required secrets:**

| Secret Name | Value |
|-------------|-------|
| `SSH_HOST` | `34.124.193.161` |
| `SSH_USER` | `jack_initia_xyz` |
| `SSH_PRIVATE_KEY` | (paste key from Step 1) |

Add these **2 minimum environment secrets:**

| Secret Name | Value |
|-------------|-------|
| `ENV_POLYMARKET_API_URL` | `https://clob.polymarket.com` |
| `ENV_GAMMA_API_URL` | `https://gamma-api.polymarket.com` |

**Optional but recommended:**

| Secret Name | Value | Purpose |
|-------------|-------|---------|
| `ENV_TELEGRAM_BOT_TOKEN` | Your token | Telegram alerts |
| `ENV_TELEGRAM_CHAT_ID` | Your chat ID | Telegram alerts |
| `ENV_POLL_INTERVAL_MS` | `5000` | Poll every 5 seconds |
| `ENV_MIN_TRADE_SIZE_USD` | `2500` | Track trades >= $2500 |
| `ENV_ALERT_LARGE_TRADE` | `10000` | Alert on $10k+ |
| `ENV_ALERT_WHALE_TRADE` | `50000` | Alert on $50k+ |

---

## Step 3: Add Deploy Key to GitHub (1 min)

1. Get public key from VM:
```bash
cat ~/.ssh/id_rsa.pub
```

2. Go to: https://github.com/jackmoriso/pollfind/settings/keys
3. Click "Add deploy key"
4. Title: `GCP qa-automation-runner`
5. Paste the public key
6. ✅ Check "Allow write access"
7. Click "Add key"

---

## Step 4: Deploy! (2 min)

### Option A: Automatic (Recommended)

```bash
# Just push to main
git add .
git commit -m "chore: add deployment config"
git push origin main

# Watch deployment
# https://github.com/jackmoriso/pollfind/actions
```

### Option B: Manual First Time

```bash
# SSH to VM
gcloud compute ssh --zone "asia-southeast1-b" "qa-automation-runner" --project "apps-staging-wvisc"

# Clone repo (first time only)
cd ~
git clone git@github.com:jackmoriso/pollfind.git
cd pollfind

# Create .env
cp .env.example .env
nano .env  # Add your values

# Deploy
npm install
npm run build
chmod +x start.sh
mkdir -p logs
pm2 start ecosystem.config.js
pm2 save
```

---

## Step 5: Verify (1 min)

```bash
# Check PM2 status
pm2 status

# Should show:
# ┌─────┬──────────┬─────────┬────────┬─────────┐
# │ id  │ name     │ status  │ cpu    │ memory  │
# ├─────┼──────────┼─────────┼────────┼─────────┤
# │ 0   │ pollfind │ online  │ 0%     │ 50mb    │
# └─────┴──────────┴─────────┴────────┴─────────┘

# View logs
pm2 logs pollfind
```

---

## ✅ Done!

Your pollfind is now:
- ✅ Running on GCP
- ✅ Auto-restarting on crash
- ✅ Auto-deploying on push to main
- ✅ Logging all activity

---

## 🔧 Useful Commands

```bash
# View logs
pm2 logs pollfind

# Restart
pm2 restart pollfind

# Stop
pm2 stop pollfind

# Monitor
pm2 monit

# Manual deploy
git pull && npm install && npm run build && pm2 restart pollfind
```

---

## 🆘 Problems?

**App not starting?**
```bash
pm2 logs pollfind --err
```

**Deployment failed?**
- Check GitHub Actions logs
- Verify all secrets are set
- Ensure deploy key has write access

**Need help?**
Read the full guide: `docs/05_DEPLOYMENT.md`

---

**Happy trading! 📊**
