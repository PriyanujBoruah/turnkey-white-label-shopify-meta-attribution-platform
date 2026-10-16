/**
 * TrueSignal - Brand & UI Theme Configuration
 * Application metadata, visual styling, regional currency defaults, and footer links.
 */

const BrandConfig = {
  // 1. Core Brand & Agency Identity
  brand: {
    appName: "TrueSignal",                              // Software / Platform Name
    agencyName: "TrueSignal Intelligence",              // Parent Company or Agency Name
    tagline: "Causal Attribution & Creative Engine",    // Sub-header / Tagline
    badgeText: "",                         // Top right pill tag (e.g. "PROPRIETARY ENGINE", "AGENCY PRO", "BETA")
    heroTitleWhite: "Master Creative Attribution &",
    heroTitleGradient: "Concept Intelligence",
    heroSubtitle: "Smartly group ad variations into master creative concepts, measure net profit & POAS per concept family, and scale winning ad assets with zero double-counting.",
    
    // Feature chips displayed on login & hero areas
    featureChips: [
      "🇬🇧 Multi-Currency & VAT Native",
      "🎨 Concept Family Grouping",
      "🛡️ Zero Double-Counting",
      "⚡ 1st-Party Tracking Pixel"
    ],

    trustBadge: "🇬🇧 Built for E-Commerce • GDPR Compliant & 1st-Party Verified"
  },

  // 2. Visual Theme & Styling
  theme: {
    primaryColor: "#4338ca",                           // Deep Royal Purple / Indigo (from screenshot)
    primaryHover: "#3730a3",                           // Hover State
    accentGradient: "linear-gradient(135deg, #4338ca 0%, #6366f1 100%)",
    glowEffect: "rgba(67, 56, 202, 0.15)",
    logoSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="4"/><line x1="8" y1="8" x2="8" y2="8.01"/><line x1="16" y1="8" x2="16" y2="8.01"/><line x1="8" y1="16" x2="8" y2="16.01"/><line x1="16" y1="16" x2="16" y2="16.01"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="12" y1="8" x2="12" y2="16"/></svg>`,
    logoImageUrl: null,                                // Optional: Set to "https://your-domain.com/logo.png" to override SVG
    faviconUrl: null                                   // Optional: URL to custom agency favicon.ico / png
  },

  // 3. Regional, Currency & Tax Defaults
  localization: {
    defaultCurrency: "GBP",                            // "GBP" | "USD" | "EUR" | "AUD" | "CAD" | "INR"
    currencySymbol: "£",                               // "£" | "$" | "€" | "A$" | "C$" | "₹"
    vatMode: "INCLUSIVE",                              // "INCLUSIVE" (e.g. UK 20%) | "EXCLUSIVE" | "NONE"
    defaultTaxRate: 0.20                               // 20%
  },

  // Footer metadata
  footer: {
    copyrightOwner: "TrueSignal Ltd.",
    copyrightYear: new Date().getFullYear(),
    supportEmail: "support@truesignal.ai",
    supportDeskUrl: "https://support.truesignal.ai",
    statusPageUrl: "https://status.truesignal.ai",
    termsUrl: "https://truesignal.ai/terms",
    privacyUrl: "https://truesignal.ai/privacy"
  }
};

(function applyBrandConfig() {
  // Allow localStorage override if configured in dashboard
  try {
    // Override from single master platform.config.js if defined
    if (typeof window !== 'undefined' && window.PLATFORM_CONFIG && window.PLATFORM_CONFIG.brand) {
      const pb = window.PLATFORM_CONFIG.brand;
      if (pb.appName) BrandConfig.brand.appName = pb.appName;
      if (pb.agencyName) BrandConfig.brand.agencyName = pb.agencyName;
      if (pb.tagline) BrandConfig.brand.tagline = pb.tagline;
      if (pb.badgeText) BrandConfig.brand.badgeText = pb.badgeText;
      if (pb.primaryColor) {
        BrandConfig.theme.primaryColor = pb.primaryColor;
        BrandConfig.theme.primaryHover = pb.primaryColor;
      }
      if (pb.currency) BrandConfig.localization.defaultCurrency = pb.currency;
      if (pb.currencySymbol) BrandConfig.localization.currencySymbol = pb.currencySymbol;
    }

    const savedConfig = localStorage.getItem('TRUESIGNAL_BRAND_CONFIG');
    if (savedConfig) {
      const parsed = JSON.parse(savedConfig);
      if (parsed.brand) Object.assign(BrandConfig.brand, parsed.brand);
      if (parsed.theme) Object.assign(BrandConfig.theme, parsed.theme);
      if (parsed.localization) Object.assign(BrandConfig.localization, parsed.localization);
      if (parsed.footer) Object.assign(BrandConfig.footer, parsed.footer);
    }
  } catch (e) {
    console.warn('[BrandConfig] Local storage parse notice:', e);
  }

  // Inject CSS Variables for Dynamic Color Branding
  const root = document.documentElement;
  if (BrandConfig.theme.primaryColor) {
    root.style.setProperty('--primary', BrandConfig.theme.primaryColor);
    root.style.setProperty('--primary-glow', BrandConfig.theme.glowEffect);
  }

  function updateDom() {
    // 1. Update Document Title
    if (BrandConfig.brand.appName) {
      document.title = `${BrandConfig.brand.appName} — ${BrandConfig.brand.tagline}`;
    }

    // 2. Update Favicon if provided
    if (BrandConfig.theme.faviconUrl) {
      let link = document.querySelector("link[rel~='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.getElementsByTagName('head')[0].appendChild(link);
      }
      link.href = BrandConfig.theme.faviconUrl;
    }

    // 3. Update Elements with data-brand attributes
    document.querySelectorAll('[data-brand="appName"]').forEach(el => {
      el.textContent = BrandConfig.brand.appName;
    });

    document.querySelectorAll('[data-brand="agencyName"]').forEach(el => {
      el.textContent = BrandConfig.brand.agencyName;
    });

    document.querySelectorAll('[data-brand="badgeText"]').forEach(el => {
      el.textContent = BrandConfig.brand.badgeText;
    });

    document.querySelectorAll('[data-brand="heroSubtitle"]').forEach(el => {
      el.textContent = BrandConfig.brand.heroSubtitle;
    });

    document.querySelectorAll('[data-brand="trustBadge"]').forEach(el => {
      el.textContent = BrandConfig.brand.trustBadge;
    });

    document.querySelectorAll('[data-brand="copyright"]').forEach(el => {
      el.textContent = `© ${BrandConfig.footer.copyrightYear} ${BrandConfig.footer.copyrightOwner}`;
    });

    // Update logos if custom image is set
    if (BrandConfig.theme.logoImageUrl) {
      document.querySelectorAll('[data-brand="logo"]').forEach(el => {
        el.innerHTML = `<img src="${BrandConfig.theme.logoImageUrl}" alt="${BrandConfig.brand.appName}" style="max-height: 100%; max-width: 100%; object-fit: contain;">`;
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', updateDom);
  } else {
    updateDom();
  }

  // Export globally
  if (typeof window !== 'undefined') {
    window.BrandConfig = BrandConfig;
  }
})();
