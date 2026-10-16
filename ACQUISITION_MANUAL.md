# TrueSignal — Acquisition & Technical Handover Manual

> **Confidential Asset Dossier & Commercial Handover Guide**  
> *Turnkey Shopify & Meta CAPI 1st-Party Attribution Platform*  
> **Prepared for Prospective Acquirers, Digital Agencies, and Micro-SaaS Operators**

---

## 1. Executive Summary & Asset Overview

**TrueSignal** is a production-ready, enterprise-grade e-commerce attribution and creative intelligence platform built specifically to solve the post-iOS 14.5 ad tracking problem for Shopify merchants and performance marketing agencies.

### The Problem It Solves
Since Apple introduced App Tracking Transparency (ATT), ad platforms like Meta and TikTok report degraded, delayed, and over-attributed return on ad spend (ROAS). Standard pixel tracking loses 30%–45% of conversion events due to ad blockers, browser privacy restrictions, and cookie expiration. Existing solutions (e.g., Triple Whale, Northbeam) charge high recurring monthly retainers (\$300 to \$2,000+/month per brand).

### The Solution: TrueSignal
* **1st-Party Server-Side Tracking:** Captures user sessions with 1st-party cookies (`SameSite=Lax; Secure`) and pushes deduplicated server-side events directly to Meta Conversions API (CAPI).
* **Multi-Touch Attribution Engine:** 5-tier confidence scoring that unifies Shopify order webhooks, UTM parameters, and click IDs without double-counting revenue.
* **Concept Family Clustering:** Automatically groups individual ad creatives into master creative concepts to identify which video angles or hooks actually drive net profit and POAS (Profit On Ad Spend).
* **Near-\$0 Operational Burn:** Architected entirely on modern edge infrastructure (Cloudflare Pages, Edge Functions, Cloudflare D1 serverless SQL, and DuckDB WASM), meaning your monthly server hosting cost is **effectively \$0.00** at baseline.

---

## 2. Technical Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                        TRUESIGNAL ARCHITECTURE                         │
└────────────────────────────────────────────────────────────────────────┘

  [Shopify Storefront]                 [Meta / TikTok / Google Ads]
           │                                        │
    1st-Party Cookie                          Marketing API
    Pixel Script                              Spend & Impressions
           │                                        │
           ▼                                        ▼
 ┌──────────────────────────────────────────────────────────────┐
 │             Cloudflare Edge Proxy & Worker Nodes             │
 │         (/functions/api/proxy, /api/auth, /api/d1)           │
 └──────────────────────────────┬───────────────────────────────┘
                                │
                                ▼
 ┌──────────────────────────────────────────────────────────────┐
 │              Cloudflare D1 & Client-Side Cache               │
 │           (IndexedDB Storage + DuckDB WASM Engine)           │
 └──────────────────────────────┬───────────────────────────────┘
                                │
                                ▼
 ┌──────────────────────────────────────────────────────────────┐
 │                  Interactive Executive UI                    │
 │    • Real-time Contribution Margin (POAS)                    │
 │    • Meta CAPI Attribution Engine (5-Tier Confidence)        │
 │    • Creative Concept Clustering                             │
 │    • Agency White-Label Studio (Instant Rebranding)          │
 └──────────────────────────────────────────────────────────────┘
```

### Core Codebase Modules
1. **Frontend Coordinator (`app.js`):** Client-side analytical orchestrator bridging background Web Workers, state management, and real-time dashboard visualizations.
2. **Attribution Engine (`attribution-engine.js`):** Multi-model attribution algorithm (First-Click, Last-Click, Linear, and Causal Incremental scoring).
3. **Profitability Engine (`profitability-engine.js`):** Dynamic contribution margin modeling, accounting for gateway transaction fees (2.9% + 30¢), COGS, courier shipping cards, and regional VAT modes.
4. **Creative Family Engine (`family-engine.js`):** Fingerprinting module that clusters disparate ad variants into unified creative concept trees.
5. **Shopify Tracking Pixel (`shopify-tracking-pixel.js`):** Lightweight client-side tag for Shopify theme integration, preserving 1st-party click IDs across shopping sessions.
6. **Edge Proxy Endpoints (`/functions/api/`):** Cloudflare Pages Functions managing OAuth authentication, token rotation, and serverless proxying to bypass CORS restrictions.
7. **White-Label Configuration (`brand.config.js`):** Centralized branding dictionary allowing instant customization of logos, app names, primary theme colors, and local currency formats.

---

## 3. Commercialization & Monetization Playbooks

For the acquiring entrepreneur or agency, TrueSignal offers multiple rapid paths to cash flow:

### Playbook A: White-Labeled Agency Retainer Add-On (Fastest ROI)
* **Strategy:** If you own or manage a performance marketing / DTC agency, offer TrueSignal under your own agency branding as a proprietary tracking service.
* **Pricing:** Charge **\$499 – \$1,200/month per client** as part of your media buying retainer.
* **Economics:** With just 2–3 agency clients, the \$8,500 acquisition investment is completely paid off in 60 to 90 days.

### Playbook B: Direct-to-Consumer Micro-SaaS
* **Strategy:** Launch TrueSignal as a self-serve Shopify App in the Shopify App Store.
* **Pricing Tiers:**
  * *Starter:* \$79/month (up to \$50k/mo store revenue).
  * *Growth:* \$199/month (up to \$250k/mo store revenue).
  * *Enterprise:* \$499/month (unlimited revenue + multi-store management).
* **Target:** Small-to-medium Shopify brands seeking a Triple Whale alternative without the \$400+/mo price tag.

### Playbook C: Turnkey Code Flip or Strategic Rollup
* **Strategy:** Add a pre-launch landing page, secure 3 to 5 pilot stores using the included Sandbox Demo, and relist on Acquire.com as a revenue-generating asset at a 3x–4x ARR multiple (\$30k–\$50k valuation).

---

## 4. 15-Minute Turnkey Deployment Guide

Deploying TrueSignal requires zero expensive server setups (no AWS EC2, no Kubernetes, no recurring Heroku bills).

### Step 0: Single Master Configuration (`platform.config.js`)
The entire application uses a **single master configuration file** located in the root directory: [`platform.config.js`](platform.config.js).
Before or immediately after deploying, open this file to plug in your credentials:
* **Mistral AI API Key:** (`mistral.apiKey`) — Powers the AI Copilot and reasoning analytics.
* **Firebase Authentication:** (`firebase`) — Standard web config object from your Firebase console.
* **Cloudflare D1 & Account:** (`cloudflare.d1DatabaseId`) — D1 Database ID for serverless analytics.
* **Agency Branding:** (`brand`) — Your app name, company name, primary theme color, and currency.

### Step 1: Deploy to Cloudflare Pages (Free)
1. Fork or clone the repository to your private GitHub account.
2. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com/) → **Workers & Pages** → **Create Application** → **Pages** → **Connect to Git**.
3. Select this repository:
   * **Framework preset:** `None`
   * **Build command:** *(Leave empty)*
   * **Build output directory:** `/`
4. Click **Save and Deploy**. Your application will be live globally within 60 seconds at `https://your-app.pages.dev`.

### Step 2: Configure Optional Environment Variables (Optional Server-Side Overrides)
In Cloudflare Pages Settings → **Environment variables**, set:
* `CLOUDFLARE_ACCOUNT_ID` — Your Cloudflare Account ID.
* `D1_DATABASE_ID` — (Optional) Cloudflare D1 database ID for persistent serverless storage.
* `META_APP_ID` & `META_APP_SECRET` — Your Meta Developer App credentials for 1-click OAuth.
* `SHOPIFY_CLIENT_ID` & `SHOPIFY_CLIENT_SECRET` — Your Shopify Partner App credentials.

### Step 3: Add Custom Domain & SSL
In Cloudflare Pages → **Custom domains**, enter your production domain (e.g., `app.youragency.com`). Cloudflare automatically provisions a free Universal SSL certificate.

---

## 5. Instant Agency White-Labeling (60 Seconds)

TrueSignal is built from the ground up for white-labeling:

### Option 1: Live In-App White-Label Studio
1. Open the dashboard and click **White-Label Studio** in the sidebar.
2. Enter your App Name, Agency Name, and pick your primary theme color with the color picker.
3. Select your default currency (`GBP £`, `USD $`, `EUR €`, `CAD C$`, `AUD A$`).
4. Click **Apply Live Rebranding**. The entire dashboard updates instantly in real time.

### Option 2: Code-Level Branding
Open [`brand.config.js`](brand.config.js) and update the configuration object:
```javascript
const BrandConfig = {
  brand: {
    appName: "Apex Attribution",           // Your App Name
    agencyName: "Apex Growth Partners",   // Your Agency Name
    tagline: "Causal Attribution & Creative Intelligence",
    badgeText: "PROPRIETARY ENGINE"
  },
  theme: {
    primaryColor: "#2563eb",              // Your Brand Hex Color
    logoImageUrl: "https://yourdomain.com/logo.png"
  },
  localization: {
    defaultCurrency: "USD",
    currencySymbol: "$"
  }
};
```

---

## 6. Included Assets & Handover Checklist

Upon completion of the asset buyout, the buyer receives 100% legal, exclusive ownership of:

* [x] **Complete Git Repository & Source Code:** All frontend, engine, pixel, edge functions, and SQL schema files.
* [x] **Full Intellectual Property & Commercial Rights:** Perpetual, unrestricted global ownership to deploy, rebrand, resell, modify, and license.
* [x] **Interactive Sandbox Demo Pipeline:** Preloaded with 90 days of synthetic DTC e-commerce data for instant customer demos.
* [x] **Pixel Tracking Scripts & Integration Guides:** Clean tracking pixel ready for direct Shopify theme injection.
* [x] **Database Schema & Migrations:** SQLite / D1 and PostgreSQL (`supabase_schema.sql`) schema definitions.
* [x] **14 Days of Technical Transition Support:** Direct developer guidance to assist with domain setup, initial deployment, and environment variable verification.

---

**For acquisition inquiries, due diligence access, or private Escrow closing, contact the seller via Acquire.com or directly via email.**
