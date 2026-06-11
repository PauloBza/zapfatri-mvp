import crypto from "crypto";
import { UAParser } from "ua-parser-js";

export function normalizeSlug(value = "") {
  return String(value)
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function isValidPhone(phone = "") {
  return /^\d{10,15}$/.test(String(phone));
}

export function isValidHttpUrl(value = "") {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length > 0) {
    return forwarded.split(",")[0].trim();
  }
  return req.socket.remoteAddress || "";
}

export function hashIp(ip = "") {
  const salt = process.env.IP_HASH_SALT || process.env.APP_SECRET || "zapfatri-dev-salt";
  return crypto
    .createHash("sha256")
    .update(`${ip}|${salt}`)
    .digest("hex");
}

export function parseUserAgent(userAgent = "") {
  const parser = new UAParser(userAgent || "");
  const result = parser.getResult();

  const deviceType =
    result.device?.type ||
    (userAgent.toLowerCase().includes("mobile") ? "mobile" : "desktop");

  return {
    device_type: deviceType,
    browser: result.browser?.name || null,
    os: result.os?.name || null
  };
}

export function isLikelyBot(userAgent = "") {
  const ua = String(userAgent || "").toLowerCase();
  return /bot|crawler|spider|preview|facebookexternalhit|whatsapp|telegrambot|slackbot|discordbot|linkedinbot|twitterbot|curl|wget|python-requests|go-http-client/.test(ua);
}

export function buildWhatsAppUrl(phone, message = "") {
  const base = `https://wa.me/${phone}`;
  if (!message) return base;
  return `${base}?text=${encodeURIComponent(message)}`;
}

export function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function csvEscape(value) {
  if (value === null || value === undefined) return "";
  const s = String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replaceAll('"', '""')}"`;
  return s;
}

export function createSessionToken() {
  const secret = process.env.APP_SECRET || process.env.ADMIN_PASSWORD || "zapfatri-dev";
  return crypto.createHmac("sha256", secret).update("zapfatri-admin").digest("hex");
}

export function requireAdmin(req, res, next) {
  const expected = createSessionToken();
  if (req.cookies?.zf_admin === expected) return next();
  return res.redirect("/login");
}
