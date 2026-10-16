/**
 * ==============================================================================
 * TRUESIGNAL ATTRIBUTION PLATFORM - MASTER CONFIGURATION FILE
 * ==============================================================================
 * When you acquire this platform, THIS IS THE SINGLE PLACE TO CONFIGURE:
 * 1. Mistral AI API credentials (for the AI Copilot & Automated Diagnostics)
 * 2. Firebase Authentication keys (for User Login & Signup)
 * 3. Cloudflare Edge & D1 Database settings (for Serverless Hosting & Storage)
 * 4. Supabase Database credentials (for PostgreSQL Storage & Multi-Tier Analytics)
 * 5. Agency Branding & Theme (Name, Colors, Currency)
 * ==============================================================================
 */

const PLATFORM_CONFIG = {
  // ----------------------------------------------------------------------------
  // 1. MISTRAL AI API CREDENTIALS
  // ----------------------------------------------------------------------------
  // Get an API key in 30 seconds at: https://console.mistral.ai/api-keys/
  mistral: {
    // Your Mistral API Key:
    apiKey: "RFmsINiQyVSJceseBs95xDYe8ttzU36X",

    // Default model to use for the AI Copilot:
    // Recommended options:
    // - "ministral-14b-2512" (High intelligence, fast, supports tools)
    // - "codestral-2508"    (Optimized for data queries & technical code)
    // - "ministral-8b-2512"  (Fastest & most lightweight)
    // - "mistral-large-2512" (Enterprise tier flagship reasoning)
    defaultModel: "ministral-14b-2512",

    // Sampling temperature (0.0 to 1.0; 0.2 gives precise, deterministic analysis)
    temperature: 0.2
  },

  // ----------------------------------------------------------------------------
  // 2. FIREBASE AUTHENTICATION KEYS
  // ----------------------------------------------------------------------------
  // Create a free project at: https://console.firebase.google.com/
  // Navigate to: Project Settings -> General -> Your apps -> Web app -> Config
  firebase: {
    apiKey: "AIzaSyAw-OecWiy3JC961FqFVm676W1mGY_8vgw",
    authDomain: "truesignal-uk.firebaseapp.com",
    projectId: "truesignal-uk",
    storageBucket: "truesignal-uk.firebasestorage.app",
    messagingSenderId: "663947772513",
    appId: "1:663947772513:web:0efaddf5369bb9ee11e020",
    measurementId: "G-GS5CT9YREK"
  },

  // ----------------------------------------------------------------------------
  // 3. CLOUDFLARE EDGE & D1 DATABASE
  // ----------------------------------------------------------------------------
  // Get these from your Cloudflare Dashboard (Workers & Pages / D1 SQL):
  // https://dash.cloudflare.com/
  cloudflare: {
    accountId: "951ce610a8f4a49d6227ed151be1fc0b",
    d1DatabaseId: "c7d397e1-86d4-4eeb-83af-911e323f62b5",
    d1DatabaseName: "truesignal-db",
    pagesDomain: "turnkey-attribution-platform.pages.dev"
  },

  // ----------------------------------------------------------------------------
  // 4. SUPABASE CLOUD DATABASE (POSTGRESQL & AUDIT LOGS)
  // ----------------------------------------------------------------------------
  // Create a free project at: https://supabase.com/
  supabase: {
    url: "https://dohytwawbtyepagrvoyt.supabase.co",
    anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvaHl0d2F3YnR5ZXBhZ3J2b3l0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAwMzcyOTYsImV4cCI6MjA1NTYxMzI5Nn0.2vD1r1j1Nq2F6lG3hJ4kL5mN6oP7qR8sT9uV0wX1yZ2"
  },

  // ----------------------------------------------------------------------------
  // 5. BRANDING, AGENCY IDENTITY & THEME
  // ----------------------------------------------------------------------------
  brand: {
    appName: "Turnkey Attribution",
    agencyName: "Turnkey Attribution Platform",
    tagline: "White-Label Multi-Touch Attribution Engine",
    badgeText: "",
    primaryColor: "#4338ca",
    currency: "GBP", // "GBP" | "USD" | "EUR" | "AUD" | "CAD"
    currencySymbol: "£",
    copyrightOwner: "Turnkey Attribution Platform Ltd."
  }
};

// Global export for browser (window) and Node.js environments
if (typeof window !== "undefined") {
  window.PLATFORM_CONFIG = PLATFORM_CONFIG;
  window.CUSTOM_FIREBASE_CONFIG = PLATFORM_CONFIG.firebase;
  window.SUPABASE_CONFIG = PLATFORM_CONFIG.supabase;
}
if (typeof module !== "undefined" && module.exports) {
  module.exports = PLATFORM_CONFIG;
}
