# Turnkey White-Label Shopify & Meta Attribution Platform

> **Turnkey 1st-party cookie attribution, Meta CAPI server-side integration, and creative concept clustering engine for Shopify brands and performance agencies.**

---

## 🚀 Key Highlights for Acquirers & Agencies

* **⚡ Instant Interactive Sandbox Demo:** Preloaded with 90 days of realistic DTC e-commerce orders, customer journeys, Meta/TikTok ad spend, and multi-touch attribution. Launch immediately without external credentials via `?demo=true` or the in-app Test Drive button.
* **🎨 60-Second Agency White-Label Studio:** Change the platform name, logo, primary theme color, and currency live in-app or via [`brand.config.js`](brand.config.js) to re-sell or white-label for clients.
* **🛡️ Zero-Burn Edge Infrastructure:** Built on Cloudflare Pages, Cloudflare D1 serverless SQLite, and DuckDB WASM. Baseline monthly server cost is **$0.00**.
* **📚 Complete Handover Manual:** See [**`ACQUISITION_MANUAL.md`**](ACQUISITION_MANUAL.md) for the complete asset dossier, architecture diagram, commercialization playbooks, and 15-minute deployment guide.

---

## Architecture Overview

- **Frontend Dashboard:** Pure client-side analytical coordinator ([`app.js`](app.js)), IndexedDB local caching ([`db.js`](db.js)), and reactive chart rendering.
- **Attribution & Intelligence Engines:**
  - [`attribution-engine.js`](attribution-engine.js): 5-tier attribution confidence scoring and journey tracking.
  - [`profitability-engine.js`](profitability-engine.js): Net profit, UK VAT modes, gateway fees, and POAS calculations.
  - [`family-engine.js`](family-engine.js): Creative fingerprinting, concept clustering, and ad grouping.
  - [`maturity-engine.js`](maturity-engine.js): Refund cohort aging and reporting window adjustments.
- **Data Ingestion & Storage:**
  - [`shopify-tracking-pixel.js`](shopify-tracking-pixel.js): 1st-party cookie tracker (`SameSite=Lax; Secure`) preserving click IDs and UTM context.
  - [`supabase-client.js`](supabase-client.js) / [`supabase_schema.sql`](supabase_schema.sql): PostgreSQL cloud data warehouse with automated retention pruning.
  - [`functions/api/proxy/`](functions/api/proxy/): Cloudflare Pages Edge proxy for CORS bypass and D1 database routing.
- **Authentication & OAuth:** Meta Marketing API and Shopify GraphQL OAuth handshakes.

---

## ⚙️ Single Master Configuration (`platform.config.js`)

When acquiring or deploying the platform, **all primary API keys and settings are edited in one single file** in the project root:
[`platform.config.js`](platform.config.js)

```javascript
const PLATFORM_CONFIG = {
  mistral: {
    apiKey: "your_mistral_api_key_here",
    defaultModel: "ministral-14b-2512"
  },
  firebase: {
    apiKey: "AIzaSy...",
    authDomain: "your-app.firebaseapp.com",
    projectId: "your-app-id"
  },
  cloudflare: {
    accountId: "your_cloudflare_account_id",
    d1DatabaseId: "your_d1_database_id"
  },
  brand: {
    appName: "TrueSignal",
    primaryColor: "#4338ca",
    currency: "GBP",
    currencySymbol: "£"
  }
};
```
Editing this one file automatically configures Firebase Authentication, Mistral AI Copilot, Cloudflare Edge functions, and branding across the entire application.

---

## Getting Started

1. **Test Drive Sandbox Demo:** Open `index.html` in any browser or launch local server and append `?demo=true`:
   ```bash
   node server.js
   # Visit: http://localhost:8000/?demo=true
   ```
2. **Review Environment Variables:**
   ```bash
   cp .env.example .env
   ```
3. **Deployment Guide:** See [DEPLOYMENT.md](DEPLOYMENT.md) and [ACQUISITION_MANUAL.md](ACQUISITION_MANUAL.md) for turnkey Cloudflare Pages hosting.

