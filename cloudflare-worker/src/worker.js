function sha256Hex(message) {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  return crypto.subtle.digest("SHA-256", data).then((hashBuffer) => {
    return [...new Uint8Array(hashBuffer)]
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  });
}

function getDeviceType(userAgent) {
  const ua = userAgent.toLowerCase();

  if (/bot|crawler|spider|facebookexternalhit|whatsapp|telegrambot|slackbot/.test(ua)) {
    return "bot";
  }

  if (/mobile|android|iphone|ipod/.test(ua)) {
    return "mobile";
  }

  if (/ipad|tablet/.test(ua)) {
    return "tablet";
  }

  return "desktop";
}

function getBrowser(userAgent) {
  if (/edg/i.test(userAgent)) return "Edge";
  if (/opr|opera/i.test(userAgent)) return "Opera";
  if (/chrome/i.test(userAgent)) return "Chrome";
  if (/safari/i.test(userAgent)) return "Safari";
  if (/firefox/i.test(userAgent)) return "Firefox";
  return "Outro";
}

function getOS(userAgent) {
  if (/windows/i.test(userAgent)) return "Windows";
  if (/android/i.test(userAgent)) return "Android";
  if (/iphone|ipad|ipod/i.test(userAgent)) return "iOS";
  if (/mac os/i.test(userAgent)) return "macOS";
  if (/linux/i.test(userAgent)) return "Linux";
  return "Outro";
}

function isBot(userAgent) {
  return /bot|crawler|spider|facebookexternalhit|whatsapp|telegrambot|slackbot|discordbot|preview/i.test(
    userAgent
  );
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const slug = url.pathname.replace(/^\/+|\/+$/g, "");

    if (!slug) {
      return new Response("ZapFatri Worker online", { status: 200 });
    }

    const phoneOnly = slug.replace(/\D/g, "");
    const userAgent = request.headers.get("user-agent") || "";
    const referrer = request.headers.get("referer") || null;

    const ip =
      request.headers.get("cf-connecting-ip") ||
      request.headers.get("x-forwarded-for") ||
      "";

    const ipHash = ip
      ? await sha256Hex(`${ip}:${env.IP_HASH_SALT || "zapfatri"}`)
      : null;

    const source =
      url.searchParams.get("src") ||
      url.searchParams.get("source") ||
      referrer ||
      null;

    const payload = {
      source,
      medium: url.searchParams.get("medium"),
      campaign: url.searchParams.get("campaign"),
      video: url.searchParams.get("video"),
      post: url.searchParams.get("post"),
      placement: url.searchParams.get("pos") || url.searchParams.get("placement"),

      referrer,
      user_agent: userAgent,
      ip_hash: ipHash,

      country: request.cf?.country || request.headers.get("cf-ipcountry") || null,
      region: request.cf?.region || null,
      city: request.cf?.city || null,
      timezone: request.cf?.timezone || null,

      device_type: getDeviceType(userAgent),
      browser: getBrowser(userAgent),
      os: getOS(userAgent),
      is_bot: isBot(userAgent),

      edge_runtime: "cloudflare-worker",
      destination_url: `https://wa.me/${phoneOnly}`,
      query_params: Object.fromEntries(url.searchParams.entries())
    };

    ctx.waitUntil(
      fetch(`${env.SUPABASE_URL}/rest/v1/rpc/zapfatri_log_click_by_slug`, {
        method: "POST",
        headers: {
          apikey: env.SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          p_slug: slug,
          p_payload: payload
        })
      })
    );

    let destination = `https://wa.me/${phoneOnly}`;

    const text = url.searchParams.get("text");
    if (text) {
      destination += `?text=${encodeURIComponent(text)}`;
    }

    return Response.redirect(destination, 302);
  }
};
