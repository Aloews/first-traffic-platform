# First Traffic Platform - Complete Setup Guide

## 🚀 Full Stack Deployment

This guide will help you deploy the platform to production and make it accessible to users.

## 📋 Prerequisites

- Node.js 18+
- Docker & Docker Compose
- PostgreSQL 15+
- Domain name (optional but recommended)
- Stripe account for payments
- SSL certificate (for production)

## 🏗️ Local Development Setup

### 1. Clone & Install

```bash
git clone https://github.com/Aloews/first-traffic-platform.git
cd first-traffic-platform
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and add:
```
STRIPE_SECRET_KEY=sk_test_your_key
STRIPE_PUBLIC_KEY=pk_test_your_key
STRIPE_WEBHOOK_SECRET=whsec_test_your_secret
STRIPE_STARTER_PRICE_ID=price_xxx
STRIPE_PRO_PRICE_ID=price_yyy
STRIPE_ENTERPRISE_PRICE_ID=price_zzz
```

### 3. Start Services

```bash
docker-compose up -d
npm run dev
```

**Access locally:** `http://localhost:3000`

---

## 🌍 Production Deployment

### Option 1: Deploy to Heroku (Easiest)

```bash
# Install Heroku CLI
brew tap heroku/brew && brew install heroku

# Login
heroku login

# Create app
heroku create first-traffic-platform

# Add PostgreSQL
heroku addons:create heroku-postgresql:standard-0 --app first-traffic-platform

# Set environment variables
heroku config:set \
  NODE_ENV=production \
  JWT_SECRET=your_secret_key \
  STRIPE_SECRET_KEY=sk_live_your_key \
  --app first-traffic-platform

# Deploy
git push heroku main
```

**Access:** `https://first-traffic-platform.herokuapp.com`

### Option 2: Deploy to DigitalOcean (Recommended)

#### Step 1: Create Droplet
```bash
# Create $5/month Ubuntu 22.04 droplet
# Enable automatic backups
# Add SSH key for security
```

#### Step 2: SSH into droplet
```bash
ssh root@your_droplet_ip
```

#### Step 3: Install dependencies
```bash
# Update system
apt update && apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt install -y nodejs

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
apt install -y docker-compose

# Install Nginx
apt install -y nginx
```

#### Step 4: Clone project
```bash
cd /root
git clone https://github.com/Aloews/first-traffic-platform.git
cd first-traffic-platform
```

#### Step 5: Configure environment
```bash
nano .env
# Add production environment variables
```

#### Step 6: Start services
```bash
docker-compose up -d
```

#### Step 7: Configure Nginx reverse proxy
```bash
nano /etc/nginx/sites-available/default
```

Add:
```nginx
server {
    listen 80;
    server_name your_domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

Restart Nginx:
```bash
systemctl restart nginx
```

#### Step 8: Install SSL (Let's Encrypt)
```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d your_domain.com
```

### Option 3: Deploy to AWS

1. **Launch EC2 Instance** (Ubuntu 22.04, t3.small)
2. **Configure Security Groups** (Allow 80, 443, 22)
3. **SSH into instance**
4. **Follow DigitalOcean steps 3-8**

---

## 💳 Stripe Setup for Payments

### 1. Create Stripe Account
- Go to https://stripe.com
- Sign up for a Stripe account

### 2. Create Products & Prices

**Starter Plan:**
```
Name: First Traffic Platform - Starter
Price: $29/month (recurring)
```

**Professional Plan:**
```
Name: First Traffic Platform - Professional
Price: $99/month (recurring)
```

**Enterprise Plan:**
```
Name: First Traffic Platform - Enterprise
Price: $299/month (recurring)
```

### 3. Get API Keys
- Go to Developers → API Keys
- Copy Secret Key and Publishable Key
- Add to `.env` as `STRIPE_SECRET_KEY` and `STRIPE_PUBLIC_KEY`

### 4. Create Webhook
- Go to Developers → Webhooks
- Add endpoint: `https://your_domain.com/api/payments/webhook`
- Subscribe to:
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
- Copy Signing Secret to `.env` as `STRIPE_WEBHOOK_SECRET`

---

## 🧪 Testing the Platform

### 1. Test User Registration
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "fullName": "Test User"
  }'
```

### 2. Test Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### 3. Test Pricing Endpoint
```bash
curl http://localhost:3000/api/payments/plans
```

### 4. Test Stripe Checkout
```bash
curl -X POST http://localhost:3000/api/payments/checkout \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"planId": "starter"}'
```

---

## 📱 Frontend Setup (Optional)

### React Frontend
```bash
npx create-react-app frontend
cd frontend
npm install axios react-router-dom stripe @stripe/react-js
```

### Connect to Backend
```javascript
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

// Example API call
const login = async (email, password) => {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  return response.json();
};
```

---

## 🔍 Monitoring & Logs

### Docker Logs
```bash
docker-compose logs -f app
docker-compose logs -f postgres
```

### Check Services
```bash
docker-compose ps
```

### Database Access
```bash
psql -U postgres -d traffic_platform
```

---

## 🚨 Troubleshooting

### Port Already in Use
```bash
lsof -i :3000
kill -9 <PID>
```

### Database Connection Error
```bash
# Check PostgreSQL is running
docker-compose ps postgres

# Check credentials in .env
cat .env | grep DB_
```

### Stripe Webhook Not Working
- Verify webhook endpoint in Stripe Dashboard
- Check logs: `docker-compose logs -f app`
- Test with Stripe CLI: `stripe listen --forward-to localhost:3000/api/payments/webhook`

---

## 📊 Production Checklist

- [ ] SSL/TLS certificate installed
- [ ] Environment variables configured
- [ ] Database backups enabled
- [ ] Monitoring set up (e.g., Sentry, DataDog)
- [ ] Logs centralized (e.g., CloudWatch, Papertrail)
- [ ] Rate limiting enabled
- [ ] CORS properly configured
- [ ] Database migrations run
- [ ] Load testing completed

---

## 🎯 Next Steps

1. **Add Admin Dashboard** - React frontend for managing campaigns
2. **Email Notifications** - SendGrid/Mailgun for alerts
3. **Advanced Analytics** - Elasticsearch for detailed reporting
4. **API Documentation** - Swagger/OpenAPI specs
5. **Mobile App** - React Native for iOS/Android

For more support, check the main README.md

