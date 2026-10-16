// TrueSignal - Local Ingestion & CORS Proxy Server

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const url = require('url');

// Simple .env parser for local dev
(function loadEnv() {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    try {
      const content = fs.readFileSync(envPath, 'utf8');
      content.split(/\r?\n/).forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
          const idx = trimmed.indexOf('=');
          const key = trimmed.substring(0, idx).trim();
          const val = trimmed.substring(idx + 1).trim().replace(/^["']|["']$/g, '');
          if (!process.env[key]) {
            process.env[key] = val;
          }
        }
      });
      console.log('⚡ [Server] Loaded environment configuration from .env');
      try {
        const platConf = require('./platform.config.js');
        if (platConf.mistral?.apiKey && !process.env.MISTRAL_API_KEY) process.env.MISTRAL_API_KEY = platConf.mistral.apiKey;
        if (platConf.firebase?.apiKey && !process.env.FIREBASE_API_KEY) process.env.FIREBASE_API_KEY = platConf.firebase.apiKey;
      } catch (e) {}
    } catch (e) {
      console.warn('[Server] Could not parse .env file:', e.message);
    }
  }
})();

const PORT = parseInt(process.env.PORT || '8000', 10);
const PUBLIC_DIR = __dirname;

const SHOPIFY_CLIENT_ID = process.env.SHOPIFY_CLIENT_ID || '';
const SHOPIFY_CLIENT_SECRET = process.env.SHOPIFY_CLIENT_SECRET || '';
const SHOPIFY_SCOPES = 'read_orders,read_products,read_returns,read_discounts,read_customers,read_fulfillments,read_shipping,read_marketing_events,read_analytics';

const META_APP_ID = process.env.META_APP_ID || '';
const META_APP_SECRET = process.env.META_APP_SECRET || '';
const META_SCOPES = 'ads_read,business_management';

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml'
};

const server = http.createServer((req, res) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // 0. Handle CORS Preflight Options immediately
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Shopify-Access-Token, *',
      'Access-Control-Max-Age': '86400'
    });
    res.end();
    return;
  }

  // 0.1 Proxy health check
  if (pathname === '/api/proxy/status' && req.method === 'GET') {
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({ status: 'online', server: 'TrueSignal Local Proxy Node' }));
    return;
  }

  // 1. Shopify API GraphQL Ingestion Proxy
  if (pathname === '/api/proxy/shopify' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        if (payload.ping) {
          res.writeHead(200, { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          });
          res.end(JSON.stringify({ ok: true, message: 'pong' }));
          return;
        }

        const { shopUrl, accessToken, query, variables } = payload;

        if (!shopUrl || !accessToken || !query) {
          sendJsonError(res, 400, 'Missing shopUrl, accessToken or query in request body.');
          return;
        }

        // Standardize shop domain
        const sanitizedShop = shopUrl.replace(/^(https?:\/\/)?/, '').replace(/\/$/, '');
        const shopifyEndpoint = `https://${sanitizedShop}/admin/api/2026-04/graphql.json`;

        const postData = JSON.stringify({ query, variables });

        const options = {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Access-Token': accessToken,
            'Content-Length': Buffer.byteLength(postData)
          }
        };

        const proxyReq = https.request(shopifyEndpoint, options, (proxyRes) => {
          res.writeHead(proxyRes.statusCode, { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          });
          proxyRes.pipe(res);
        });

        proxyReq.on('error', (err) => {
          sendJsonError(res, 502, `Shopify Proxy Error: ${err.message}`);
        });

        proxyReq.write(postData);
        proxyReq.end();

      } catch (err) {
        sendJsonError(res, 400, `Invalid JSON payload: ${err.message}`);
      }
    });
    return;
  }

  // 1b. Shopify Client Credentials OAuth Proxy
  if (pathname === '/api/proxy/shopify/oauth' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const { shopUrl, clientId, clientSecret } = JSON.parse(body);

        if (!shopUrl || !clientId || !clientSecret) {
          sendJsonError(res, 400, 'Missing shopUrl, clientId, or clientSecret in request body.');
          return;
        }

        const sanitizedShop = shopUrl.replace(/^(https?:\/\/)?/, '').replace(/\/$/, '');
        const shopifyEndpoint = `https://${sanitizedShop}/admin/oauth/access_token`;

        const queryParams = new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: clientId,
          client_secret: clientSecret
        }).toString();

        const options = {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(queryParams)
          }
        };

        const oauthReq = https.request(shopifyEndpoint, options, (oauthRes) => {
          res.writeHead(oauthRes.statusCode, { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          });
          oauthRes.pipe(res);
        });

        oauthReq.on('error', (err) => {
          sendJsonError(res, 502, `Shopify OAuth Error: ${err.message}`);
        });

        oauthReq.write(queryParams);
        oauthReq.end();

      } catch (err) {
        sendJsonError(res, 400, `Invalid JSON payload: ${err.message}`);
      }
    });
    return;
  }

  // 1c. Shopify OAuth 1-Click Authorize Endpoint
  if (pathname === '/api/auth/shopify/authorize' && req.method === 'GET') {
    const rawShop = parsedUrl.query.shop;
    if (!rawShop) {
      sendJsonError(res, 400, 'Missing shop domain in query parameter ?shop=');
      return;
    }
    let sanitizedShop = rawShop.replace(/^(https?:\/\/)?/, '').replace(/\/$/, '').trim();
    if (!sanitizedShop.includes('.')) {
      sanitizedShop += '.myshopify.com';
    }
    const host = req.headers.host || `localhost:${PORT}`;
    const protocol = req.headers['x-forwarded-proto'] || (host.startsWith('localhost') ? 'http' : 'https');
    const redirectUri = `${protocol}://${host}/api/auth/shopify/callback`;
    const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

    const authorizeUrl = `https://${sanitizedShop}/admin/oauth/authorize?client_id=${SHOPIFY_CLIENT_ID}&scope=${SHOPIFY_SCOPES}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`;

    res.writeHead(302, { 
      'Location': authorizeUrl,
      'Access-Control-Allow-Origin': '*'
    });
    res.end();
    return;
  }

  // 1d. Shopify OAuth 1-Click Callback Endpoint
  if (pathname === '/api/auth/shopify/callback' && req.method === 'GET') {
    const { shop, code, state, error, error_description } = parsedUrl.query;

    if (error) {
      console.error(`[Shopify OAuth Error] ${error}: ${error_description}`);
      res.writeHead(302, { 'Location': `/?auth_error=${encodeURIComponent(error_description || error)}` });
      res.end();
      return;
    }

    if (!shop || !code) {
      sendTextError(res, 400, 'Missing required shop or code query parameter.');
      return;
    }

    let sanitizedShop = shop.replace(/^(https?:\/\/)?/, '').replace(/\/$/, '').trim();
    const tokenEndpoint = `https://${sanitizedShop}/admin/oauth/access_token`;

    const postData = JSON.stringify({
      client_id: SHOPIFY_CLIENT_ID,
      client_secret: SHOPIFY_CLIENT_SECRET,
      code: code
    });

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const tokenReq = https.request(tokenEndpoint, options, (tokenRes) => {
      let data = '';
      tokenRes.on('data', chunk => { data += chunk; });
      tokenRes.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (result.access_token || result.scope) {
            console.log(`[Shopify OAuth] ✅ App installed on ${sanitizedShop}. Fetching active client access token...`);
            
            // Perform client_credentials grant to get the active expiring token accepted by GraphQL API
            const ccPostData = JSON.stringify({
              client_id: SHOPIFY_CLIENT_ID,
              client_secret: SHOPIFY_CLIENT_SECRET,
              grant_type: 'client_credentials'
            });

            const ccReq = https.request(tokenEndpoint, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(ccPostData)
              }
            }, (ccRes) => {
              let ccData = '';
              ccRes.on('data', c => { ccData += c; });
              ccRes.on('end', () => {
                try {
                  const ccResult = JSON.parse(ccData);
                  const finalToken = ccResult.access_token || result.access_token;
                  console.log(`[Shopify OAuth] ✅ Final Active Access Token obtained for ${sanitizedShop}`);
                  const redirectBack = `/?connected=shopify&shop=${encodeURIComponent(sanitizedShop)}&token=${encodeURIComponent(finalToken)}&scope=${encodeURIComponent(ccResult.scope || result.scope || '')}`;
                  res.writeHead(302, { 'Location': redirectBack });
                  res.end();
                } catch(e) {
                  const redirectBack = `/?connected=shopify&shop=${encodeURIComponent(sanitizedShop)}&token=${encodeURIComponent(result.access_token)}&scope=${encodeURIComponent(result.scope || '')}`;
                  res.writeHead(302, { 'Location': redirectBack });
                  res.end();
                }
              });
            });
            ccReq.on('error', () => {
              const redirectBack = `/?connected=shopify&shop=${encodeURIComponent(sanitizedShop)}&token=${encodeURIComponent(result.access_token)}&scope=${encodeURIComponent(result.scope || '')}`;
              res.writeHead(302, { 'Location': redirectBack });
              res.end();
            });
            ccReq.write(ccPostData);
            ccReq.end();
          } else {
            console.error('[Shopify OAuth Token Error]', result);
            res.writeHead(302, { 'Location': `/?auth_error=${encodeURIComponent(result.error_description || result.error || 'Token exchange failed')}` });
            res.end();
          }
        } catch (e) {
          console.error('[Shopify OAuth Parse Error]', e.message);
          res.writeHead(302, { 'Location': `/?auth_error=${encodeURIComponent('Failed to parse token response')}` });
          res.end();
        }
      });
    });

    tokenReq.on('error', (err) => {
      console.error('[Shopify OAuth Network Error]', err.message);
      res.writeHead(302, { 'Location': `/?auth_error=${encodeURIComponent(err.message)}` });
      res.end();
    });

    tokenReq.write(postData);
    tokenReq.end();
    return;
  }

  // 2a. Meta OAuth 1-Click Authorize Endpoint
  if (pathname === '/api/auth/meta/authorize' && req.method === 'GET') {
    const host = req.headers.host || `localhost:${PORT}`;
    const protocol = req.headers['x-forwarded-proto'] || (host.startsWith('localhost') ? 'http' : 'https');
    const redirectUri = `${protocol}://${host}/api/auth/meta/callback`;
    const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

    const authorizeUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${META_APP_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(META_SCOPES)}&state=${state}&response_type=code`;

    res.writeHead(302, { 
      'Location': authorizeUrl,
      'Access-Control-Allow-Origin': '*'
    });
    res.end();
    return;
  }

  // 2b. Meta OAuth 1-Click Callback Endpoint
  if (pathname === '/api/auth/meta/callback' && req.method === 'GET') {
    const { code, state, error, error_description, error_reason } = parsedUrl.query;

    if (error) {
      console.error(`[Meta OAuth Error] ${error}: ${error_description || error_reason}`);
      res.writeHead(302, { 'Location': `/?auth_error=${encodeURIComponent(error_description || error_reason || error)}` });
      res.end();
      return;
    }

    if (!code) {
      sendTextError(res, 400, 'Missing required authorization code.');
      return;
    }

    const host = req.headers.host || `localhost:${PORT}`;
    const protocol = req.headers['x-forwarded-proto'] || (host.startsWith('localhost') ? 'http' : 'https');
    const redirectUri = `${protocol}://${host}/api/auth/meta/callback`;

    // Exchange authorization code for initial access token
    const tokenUrl = `https://graph.facebook.com/v19.0/oauth/access_token?client_id=${META_APP_ID}&client_secret=${META_APP_SECRET}&redirect_uri=${encodeURIComponent(redirectUri)}&code=${code}`;

    https.get(tokenUrl, (tokenRes) => {
      let data = '';
      tokenRes.on('data', chunk => { data += chunk; });
      tokenRes.on('end', () => {
        try {
          const tokenJson = JSON.parse(data);
          const shortLivedToken = tokenJson.access_token;
          if (!shortLivedToken) {
            console.error('[Meta OAuth Token Error]', tokenJson);
            res.writeHead(302, { 'Location': `/?auth_error=${encodeURIComponent(tokenJson.error?.message || 'Meta token exchange failed')}` });
            res.end();
            return;
          }

          // Swap short-lived token for 60-day long-lived token
          const longLivedUrl = `https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${META_APP_ID}&client_secret=${META_APP_SECRET}&fb_exchange_token=${shortLivedToken}`;

          https.get(longLivedUrl, (llRes) => {
            let llData = '';
            llRes.on('data', chunk => { llData += chunk; });
            llRes.on('end', () => {
              try {
                const llJson = JSON.parse(llData);
                const longLivedToken = llJson.access_token || shortLivedToken;

                // Fetch user's accessible ad accounts
                const adAccountsUrl = `https://graph.facebook.com/v19.0/me/adaccounts?fields=id,name,account_id,currency,timezone_name,account_status&access_token=${longLivedToken}&limit=50`;

                https.get(adAccountsUrl, (adRes) => {
                  let adData = '';
                  adRes.on('data', chunk => { adData += chunk; });
                  adRes.on('end', () => {
                    let adAccounts = [];
                    try {
                      const adJson = JSON.parse(adData);
                      if (adJson.data && Array.isArray(adJson.data)) {
                        adAccounts = adJson.data.map(acc => ({
                          id: acc.id,
                          name: acc.name || `Ad Account ${acc.account_id || acc.id}`,
                          accountId: acc.account_id ? `act_${acc.account_id}` : acc.id,
                          currency: acc.currency || 'USD'
                        }));
                      }
                    } catch(e) {}

                    console.log(`[Meta OAuth] ✅ Successfully connected Meta user with ${adAccounts.length} Ad Accounts`);
                    const accountsEncoded = encodeURIComponent(JSON.stringify(adAccounts));
                    const redirectBack = `/?connected=meta&token=${encodeURIComponent(longLivedToken)}&accounts=${accountsEncoded}`;
                    res.writeHead(302, { 'Location': redirectBack });
                    res.end();
                  });
                }).on('error', () => {
                  const redirectBack = `/?connected=meta&token=${encodeURIComponent(longLivedToken)}&accounts=[]`;
                  res.writeHead(302, { 'Location': redirectBack });
                  res.end();
                });

              } catch (e) {
                const redirectBack = `/?connected=meta&token=${encodeURIComponent(shortLivedToken)}&accounts=[]`;
                res.writeHead(302, { 'Location': redirectBack });
                res.end();
              }
            });
          }).on('error', () => {
            const redirectBack = `/?connected=meta&token=${encodeURIComponent(shortLivedToken)}&accounts=[]`;
            res.writeHead(302, { 'Location': redirectBack });
            res.end();
          });

        } catch (e) {
          res.writeHead(302, { 'Location': `/?auth_error=${encodeURIComponent('Failed to parse Meta token response')}` });
          res.end();
        }
      });
    }).on('error', (err) => {
      res.writeHead(302, { 'Location': `/?auth_error=${encodeURIComponent(err.message)}` });
      res.end();
    });

    return;
  }

  // 2. Meta Ads Insights API REST Ingestion Proxy
  if (pathname === '/api/proxy/meta' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const { adAccountId, accessToken, timeRange, timeIncrement } = JSON.parse(body);

        if (!adAccountId || !accessToken) {
          sendJsonError(res, 400, 'Missing adAccountId or accessToken in request body.');
          return;
        }

        // Clean ad account format
        const cleanAcct = adAccountId.startsWith('act_') ? adAccountId : `act_${adAccountId}`;
        const rangeStr = JSON.stringify(timeRange || { since: '2026-03-01', until: '2026-06-24' });
        const increment = timeIncrement || '1';

        const metaUrl = `https://graph.facebook.com/v19.0/${cleanAcct}/insights?` + 
          `fields=date_start,date_stop,campaign_name,spend,impressions,clicks,conversions` +
          `&level=campaign` +
          `&time_increment=${increment}` +
          `&time_range=${encodeURIComponent(rangeStr)}` +
          `&access_token=${accessToken}` +
          `&limit=500`;

        const proxyReq = https.get(metaUrl, (proxyRes) => {
          res.writeHead(proxyRes.statusCode, { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          });
          proxyRes.pipe(res);
        });

        proxyReq.on('error', (err) => {
          sendJsonError(res, 502, `Meta Proxy Error: ${err.message}`);
        });

        proxyReq.end();

      } catch (err) {
        sendJsonError(res, 400, `Invalid JSON payload: ${err.message}`);
      }
    });
    return;
  }

  // 2.1. Meta Ads Generic API REST Ingestion Proxy
  if (pathname === '/api/proxy/meta/generic' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const { endpoint, fields, params, accessToken } = JSON.parse(body);

        if (!endpoint || !accessToken) {
          sendJsonError(res, 400, 'Missing endpoint or accessToken in request body.');
          return;
        }

        let metaUrl = `https://graph.facebook.com/v19.0/${endpoint}?access_token=${accessToken}`;
        if (fields) {
          metaUrl += `&fields=${encodeURIComponent(fields)}`;
        }
        let hasLimit = false;
        if (params) {
          for (const [key, value] of Object.entries(params)) {
            if (key === 'limit') hasLimit = true;
            metaUrl += `&${key}=${encodeURIComponent(value)}`;
          }
        }
        if (!hasLimit) {
          metaUrl += `&limit=50`;
        }

        const proxyReq = https.get(metaUrl, (proxyRes) => {
          res.writeHead(proxyRes.statusCode, { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          });
          proxyRes.pipe(res);
        });

        proxyReq.on('error', (err) => {
          sendJsonError(res, 502, `Meta Proxy Error: ${err.message}`);
        });

        proxyReq.end();

      } catch (err) {
        sendJsonError(res, 400, `Invalid JSON payload: ${err.message}`);
      }
    });
    return;
  }

  // 2.2. TikTok Ads API Ingestion Proxy
  if (pathname === '/api/proxy/tiktok' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const { advertiserId, accessToken, startDate, endDate } = JSON.parse(body);

        if (!advertiserId || !accessToken) {
          sendJsonError(res, 400, 'Missing advertiserId or accessToken in request body.');
          return;
        }

        const queryParams = new URLSearchParams({
          advertiser_id: advertiserId,
          report_type: 'BASIC',
          data_level: 'AUCTION_CAMPAIGN',
          dimensions: JSON.stringify(['stat_time_day']),
          metrics: JSON.stringify(['spend', 'impressions', 'clicks']),
          start_date: startDate || '2026-03-01',
          end_date: endDate || '2026-06-24',
          page_size: '100',
          page: '1'
        });

        const tiktokUrl = `https://business-api.tiktok.com/open_api/v1.3/report/integrated/get/?${queryParams.toString()}`;

        const options = {
          method: 'GET',
          headers: {
            'Access-Token': accessToken,
            'Content-Type': 'application/json'
          }
        };

        const proxyReq = https.request(tiktokUrl, options, (proxyRes) => {
          res.writeHead(proxyRes.statusCode, { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          });
          proxyRes.pipe(res);
        });

        proxyReq.on('error', (err) => {
          sendJsonError(res, 502, `TikTok Proxy Error: ${err.message}`);
        });

        proxyReq.end();

      } catch (err) {
        sendJsonError(res, 400, `Invalid JSON payload: ${err.message}`);
      }
    });
    return;
  }

  // 2.3. Google Ads API Ingestion Proxy (GAQL query search)
  if (pathname === '/api/proxy/google' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const { customerId, developerToken, accessToken, query } = JSON.parse(body);

        if (!customerId || !developerToken || !accessToken || !query) {
          sendJsonError(res, 400, 'Missing customerId, developerToken, accessToken or query.');
          return;
        }

        const cleanCustomerId = customerId.replace(/-/g, '');
        const googleUrl = `https://googleads.googleapis.com/v16/customers/${cleanCustomerId}/googleAds:search`;

        const postData = JSON.stringify({ query });

        const options = {
          method: 'POST',
          headers: {
            'developer-token': developerToken,
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
          }
        };

        const proxyReq = https.request(googleUrl, options, (proxyRes) => {
          res.writeHead(proxyRes.statusCode, { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          });
          proxyRes.pipe(res);
        });

        proxyReq.on('error', (err) => {
          sendJsonError(res, 502, `Google Ads Proxy Error: ${err.message}`);
        });

        proxyReq.write(postData);
        proxyReq.end();

      } catch (err) {
        sendJsonError(res, 400, `Invalid JSON payload: ${err.message}`);
      }
    });
    return;
  }

  // 2.5. Mistral AI Chat Completion Proxy
  if (pathname === '/api/proxy/mistral' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        const { messages, model } = payload;

        if (!messages) {
          sendJsonError(res, 400, 'Missing messages array in request body.');
          return;
        }

        const mistralUrl = 'https://api.mistral.ai/v1/chat/completions';
        const mistralKey = process.env.MISTRAL_API_KEY || '';

        const postData = JSON.stringify({
          model: model || 'ministral-8b-2512',
          messages: messages,
          temperature: 0.2
        });

        const options = {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${mistralKey}`,
            'Content-Length': Buffer.byteLength(postData)
          }
        };

        const proxyReq = https.request(mistralUrl, options, (proxyRes) => {
          res.writeHead(proxyRes.statusCode, { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          });
          proxyRes.pipe(res);
        });

        proxyReq.on('error', (err) => {
          sendJsonError(res, 502, `Mistral Proxy Error: ${err.message}`);
        });

        proxyReq.write(postData);
        proxyReq.end();

      } catch (err) {
        sendJsonError(res, 400, `Invalid JSON payload: ${err.message}`);
      }
    });
    return;
  }

  // 3. Static File Server Route
  if (req.method === 'GET') {
    const safePublicDir = path.resolve(PUBLIC_DIR);
    let filePath = path.resolve(path.join(safePublicDir, pathname === '/' ? 'index.html' : pathname));
    
    // Prevent directory traversal attacks (case-insensitive check for Windows drive letter compatibility)
    if (!filePath.toLowerCase().startsWith(safePublicDir.toLowerCase())) {
      sendTextError(res, 403, 'Forbidden');
      return;
    }

    fs.stat(filePath, (err, stats) => {
      if (err || !stats.isFile()) {
        sendTextError(res, 404, 'File Not Found');
        return;
      }

      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';

      res.writeHead(200, { 
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0'
      });
      fs.createReadStream(filePath).pipe(res);
    });
    return;
  }

  // 5. Cloudflare D1 Query Ingestion Proxy
  if (pathname === '/api/proxy/d1' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const { accountId, databaseId, apiToken, sql, params } = JSON.parse(body);

        const effectiveAccountId = accountId || process.env.CLOUDFLARE_ACCOUNT_ID || '951ce610a8f4a49d6227ed151be1fc0b';
        const effectiveDbId = databaseId || process.env.D1_DATABASE_ID || 'c7d397e1-86d4-4eeb-83af-911e323f62b5';
        const effectiveToken = apiToken || process.env.CLOUDFLARE_API_TOKEN || process.env.D1_API_TOKEN;

        if (!effectiveAccountId || !effectiveDbId || !effectiveToken || !sql) {
          sendJsonError(res, 400, 'Missing accountId, databaseId, apiToken or sql in request body.');
          return;
        }

        const cfEndpoint = `https://api.cloudflare.com/client/v4/accounts/${effectiveAccountId}/d1/database/${effectiveDbId}/query`;
        const postData = JSON.stringify({ sql, params: params || [] });

        const options = {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${effectiveToken}`,
            'Content-Length': Buffer.byteLength(postData)
          }
        };

        const proxyReq = https.request(cfEndpoint, options, (proxyRes) => {
          res.writeHead(proxyRes.statusCode, { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          });
          proxyRes.pipe(res);
        });

        proxyReq.on('error', (err) => {
          sendJsonError(res, 502, `Cloudflare D1 Proxy Error: ${err.message}`);
        });

        proxyReq.write(postData);
        proxyReq.end();

      } catch (err) {
        sendJsonError(res, 400, `Invalid JSON payload: ${err.message}`);
      }
    });
    return;
  }

  sendTextError(res, 405, 'Method Not Allowed');
});

// --- HELPER UTILITIES ---

function sendJsonError(res, statusCode, message) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
  res.end(JSON.stringify({ error: true, message }));
}

function sendTextError(res, statusCode, message) {
  res.writeHead(statusCode, { 'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': '*' });
  res.end(message);
}

// Start Server
server.listen(PORT, () => {
  console.log(`TrueSignal Ingestion Proxy Server running at: http://localhost:${PORT}`);
});
