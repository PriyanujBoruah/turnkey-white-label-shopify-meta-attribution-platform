export async function onRequest(context) {
  const { request, env = {} } = context;
  const url = new URL(request.url);
  const pathname = url.pathname;

  // Handle CORS Preflight (OPTIONS)
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "*",
        "Access-Control-Max-Age": "86400",
      },
    });
  }

  // Helper for JSON error response
  const jsonError = (status, msg) => {
    return new Response(JSON.stringify({ error: true, message: msg }), {
      status,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  };

  try {
    // 1. Shopify API
    if (pathname === "/api/proxy/shopify" && request.method === "POST") {
      const body = await request.json();
      if (body.ping) {
        return new Response(JSON.stringify({ ok: true, message: "pong" }), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        });
      }
      const { shopUrl, accessToken, query, variables } = body;
      if (!shopUrl || !accessToken || !query) {
        return jsonError(400, "Missing shopUrl, accessToken or query in request body.");
      }
      const sanitizedShop = shopUrl.replace(/^(https?:\/\/)?/, "").replace(/\/$/, "");
      const shopifyEndpoint = `https://${sanitizedShop}/admin/api/2026-04/graphql.json`;

      const response = await fetch(shopifyEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": accessToken,
        },
        body: JSON.stringify({ query, variables }),
      });

      const responseBody = await response.text();
      return new Response(responseBody, {
        status: response.status,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    // 1b. Shopify OAuth Proxy (Client Credentials)
    if (pathname === "/api/proxy/shopify/oauth" && request.method === "POST") {
      const body = await request.json();
      const { shopUrl, clientId, clientSecret } = body;
      if (!shopUrl || !clientId || !clientSecret) {
        return jsonError(400, "Missing shopUrl, clientId, or clientSecret in request body.");
      }
      const sanitizedShop = shopUrl.replace(/^(https?:\/\/)?/, "").replace(/\/$/, "");
      const shopifyEndpoint = `https://${sanitizedShop}/admin/oauth/access_token`;

      const params = new URLSearchParams({
        grant_type: "client_credentials",
        client_id: clientId,
        client_secret: clientSecret
      });

      const response = await fetch(shopifyEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: params.toString()
      });

      const responseBody = await response.text();
      return new Response(responseBody, {
        status: response.status,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    // 2. Meta Ads Insights
    if (pathname === "/api/proxy/meta" && request.method === "POST") {
      const body = await request.json();
      const { adAccountId, accessToken, timeRange, timeIncrement } = body;
      if (!adAccountId || !accessToken) {
        return jsonError(400, "Missing adAccountId or accessToken in request body.");
      }
      const cleanAcct = adAccountId.startsWith("act_") ? adAccountId : `act_${adAccountId}`;
      const rangeStr = JSON.stringify(timeRange || { since: "2026-03-01", until: "2026-06-24" });
      const increment = timeIncrement || "1";

      const metaUrl = `https://graph.facebook.com/v19.0/${cleanAcct}/insights?` + 
        `fields=date_start,date_stop,campaign_name,spend,impressions,clicks,conversions` +
        `&level=campaign` +
        `&time_increment=${increment}` +
        `&time_range=${encodeURIComponent(rangeStr)}` +
        `&access_token=${accessToken}` +
        `&limit=500`;

      const response = await fetch(metaUrl);
      const responseBody = await response.text();
      return new Response(responseBody, {
        status: response.status,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    // 2.1 Meta Generic
    if (pathname === "/api/proxy/meta/generic" && request.method === "POST") {
      const body = await request.json();
      const { endpoint, fields, params, accessToken } = body;
      if (!endpoint || !accessToken) {
        return jsonError(400, "Missing endpoint or accessToken in request body.");
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

      const response = await fetch(metaUrl);
      const responseBody = await response.text();
      return new Response(responseBody, {
        status: response.status,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    // 2.2 TikTok Ads
    if (pathname === "/api/proxy/tiktok" && request.method === "POST") {
      const body = await request.json();
      const { advertiserId, accessToken, startDate, endDate } = body;
      if (!advertiserId || !accessToken) {
        return jsonError(400, "Missing advertiserId or accessToken in request body.");
      }

      const queryParams = new URLSearchParams({
        advertiser_id: advertiserId,
        report_type: "BASIC",
        data_level: "AUCTION_CAMPAIGN",
        dimensions: JSON.stringify(["stat_time_day"]),
        metrics: JSON.stringify(["spend", "impressions", "clicks"]),
        start_date: startDate || "2026-03-01",
        end_date: endDate || "2026-06-24",
        page_size: "100",
        page: "1"
      });

      const tiktokUrl = `https://business-api.tiktok.com/open_api/v1.3/report/integrated/get/?${queryParams.toString()}`;
      const response = await fetch(tiktokUrl, {
        method: "GET",
        headers: {
          "Access-Token": accessToken,
          "Content-Type": "application/json"
        }
      });

      const responseBody = await response.text();
      return new Response(responseBody, {
        status: response.status,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    // 2.3 Google Ads
    if (pathname === "/api/proxy/google" && request.method === "POST") {
      const body = await request.json();
      const { customerId, developerToken, accessToken, query } = body;
      if (!customerId || !developerToken || !accessToken || !query) {
        return jsonError(400, "Missing customerId, developerToken, accessToken or query.");
      }

      const cleanCustomerId = customerId.replace(/-/g, "");
      const googleUrl = `https://googleads.googleapis.com/v16/customers/${cleanCustomerId}/googleAds:search`;

      const response = await fetch(googleUrl, {
        method: "POST",
        headers: {
          "developer-token": developerToken,
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ query })
      });

      const responseBody = await response.text();
      return new Response(responseBody, {
        status: response.status,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    // 2.5 Mistral AI Chat
    if (pathname === "/api/proxy/mistral" && request.method === "POST") {
      const body = await request.json();
      const { messages, model } = body;
      if (!messages) {
        return jsonError(400, "Missing messages array in request body.");
      }

      const mistralUrl = "https://api.mistral.ai/v1/chat/completions";
      const authHeader = request.headers.get("Authorization") || "";
      const clientKey = (authHeader.startsWith("Bearer ") ? authHeader.replace(/^Bearer\s+/i, "") : "") || body.apiKey || "";
      const mistralKey = env.MISTRAL_API_KEY || clientKey || "";

      const response = await fetch(mistralUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${mistralKey}`
        },
        body: JSON.stringify({
          model: model || "mistral-small-2506",
          messages: messages,
          temperature: 0.2
        })
      });

      const responseBody = await response.text();
      return new Response(responseBody, {
        status: response.status,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    // 5. Cloudflare D1 Query Proxy
    if (pathname === "/api/proxy/d1" && request.method === "POST") {
      const body = await request.json();
      const { accountId, databaseId, apiToken, sql, params } = body;

      if (!sql) {
        return jsonError(400, "Missing sql in request body.");
      }

      // Priority 1: Native Cloudflare Pages / Workers D1 binding (env.DB)
      if (env.DB) {
        try {
          const stmt = env.DB.prepare(sql);
          const bound = params && Array.isArray(params) && params.length ? stmt.bind(...params) : stmt;
          const queryResult = await bound.all();
          return new Response(JSON.stringify({
            success: true,
            result: [{
              results: queryResult.results || [],
              success: true,
              meta: queryResult.meta || {}
            }],
            errors: [],
            messages: []
          }), {
            status: 200,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
            },
          });
        } catch (err) {
          return new Response(JSON.stringify({
            success: false,
            errors: [{ message: err.message || "D1 binding execution failed" }]
          }), {
            status: 400,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
            },
          });
        }
      }

      // Priority 2: Fallback to Cloudflare REST API
      const effectiveAccountId = accountId || env.CLOUDFLARE_ACCOUNT_ID || "951ce610a8f4a49d6227ed151be1fc0b";
      const effectiveDbId = databaseId || env.D1_DATABASE_ID || "c7d397e1-86d4-4eeb-83af-911e323f62b5";
      const effectiveToken = apiToken || env.CLOUDFLARE_API_TOKEN || env.D1_API_TOKEN;

      if (!effectiveAccountId || !effectiveDbId || !effectiveToken) {
        return jsonError(400, "Missing accountId, databaseId, or apiToken for D1 REST API query.");
      }

      const cfEndpoint = `https://api.cloudflare.com/client/v4/accounts/${effectiveAccountId}/d1/database/${effectiveDbId}/query`;
      const response = await fetch(cfEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${effectiveToken}`
        },
        body: JSON.stringify({ sql, params: params || [] })
      });

      const responseBody = await response.text();
      return new Response(responseBody, {
        status: response.status,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    // Proxy health check status
    if (pathname === "/api/proxy/status" && request.method === "GET") {
      return new Response(JSON.stringify({ status: "online" }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    return jsonError(404, "Endpoint not found on the proxy function router.");

  } catch (err) {
    return jsonError(500, `Internal Server Error: ${err.message}`);
  }
}
