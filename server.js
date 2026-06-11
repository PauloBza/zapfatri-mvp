import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { supabase } from "./lib/supabase.js";
import {
  normalizeSlug,
  isValidPhone,
  isValidHttpUrl,
  getClientIp,
  hashIp,
  parseUserAgent,
  isLikelyBot,
  buildWhatsAppUrl,
  escapeHtml,
  csvEscape,
  createSessionToken,
  requireAdmin
} from "./lib/utils.js";

const app = express();
const PORT = process.env.PORT || 3000;
const PUBLIC_GO_BASE_URL = (process.env.PUBLIC_GO_BASE_URL || `http://localhost:${PORT}`).replace(/\/$/, "");

app.use(helmet({
  contentSecurityPolicy: false
}));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

function layout(title, body) {
  const logoUrl = process.env.BRAND_LOGO_URL || "https://agenda-lives-pbza.onrender.com/fatri-logo.png";

  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)} | ZapFatri</title>
  <style>
    :root {
      --azul-900: #0b234f;
      --azul-800: #12366f;
      --azul-700: #173f86;
      --azul-600: #214da1;
      --dourado-700: #b88912;
      --dourado-600: #d0a428;
      --dourado-400: #efd26d;
      --creme: #f5f1e8;
      --creme-2: #fbf8f1;
      --branco: #ffffff;
      --texto: #17223b;
      --texto-suave: #647089;
      --linha: rgba(23, 34, 59, .10);
      --sombra: 0 18px 45px rgba(11, 35, 79, .12);
      --sombra-suave: 0 8px 24px rgba(11, 35, 79, .08);
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif;
      color: var(--texto);
      background: radial-gradient(circle at top left, rgba(212,166,42,.18), transparent 32rem), linear-gradient(180deg, var(--creme-2), #eef2f7 46%, #f7f7f3);
    }

    * { box-sizing: border-box; }

    body {
      margin: 0;
      min-height: 100vh;
      color: var(--texto);
    }

    body::before {
      content: "";
      position: fixed;
      inset: 0;
      pointer-events: none;
      background:
        radial-gradient(circle at 92% 4%, rgba(212, 166, 42, .22), transparent 22rem),
        radial-gradient(circle at 8% 12%, rgba(23, 63, 134, .13), transparent 24rem);
      z-index: -1;
    }

    header {
      width: min(1480px, calc(100% - 32px));
      margin: 18px auto 0;
      padding: 18px 22px;
      border: 1px solid rgba(255, 255, 255, .82);
      border-radius: 28px;
      background: rgba(255, 255, 255, .90);
      box-shadow: var(--sombra);
      backdrop-filter: blur(10px);
      display: grid;
      grid-template-columns: minmax(250px, 1fr) auto;
      align-items: center;
      gap: 18px;
    }

    .brand {
      display: flex;
      align-items: center;
      min-width: 0;
      gap: 18px;
    }

    .brand-logo {
      width: clamp(156px, 18vw, 245px);
      max-height: 72px;
      object-fit: contain;
      background: white;
      padding: 9px 16px;
      border-radius: 20px;
      box-shadow: inset 0 0 0 1px rgba(23, 34, 59, .08);
    }

    .brand-copy { min-width: 0; }

    .brand-title {
      font-size: clamp(26px, 3vw, 42px);
      line-height: 1;
      letter-spacing: -.04em;
      font-weight: 900;
      color: var(--azul-900);
      white-space: nowrap;
    }

    .brand-subtitle {
      margin-top: 7px;
      color: var(--texto-suave);
      font-weight: 800;
      letter-spacing: .14em;
      text-transform: uppercase;
      font-size: 12px;
    }

    nav {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      flex-wrap: wrap;
      align-items: center;
    }

    header a {
      color: var(--azul-900);
      text-decoration: none;
      font-weight: 800;
      font-size: 14px;
      padding: 11px 15px;
      border-radius: 999px;
      background: rgba(23, 63, 134, .08);
      border: 1px solid rgba(23, 63, 134, .08);
      transition: transform .15s ease, box-shadow .15s ease, background .15s ease;
      white-space: nowrap;
    }

    header a:hover {
      transform: translateY(-1px);
      background: rgba(23, 63, 134, .14);
      box-shadow: var(--sombra-suave);
    }

    header a:first-of-type {
      color: #fff;
      background: linear-gradient(135deg, var(--azul-700), var(--azul-900));
      box-shadow: 0 12px 26px rgba(23, 63, 134, .22);
    }

    header a[href="/logout"] {
      color: #fff;
      background: linear-gradient(135deg, var(--dourado-600), var(--dourado-700));
      box-shadow: 0 12px 26px rgba(184, 137, 18, .20);
    }

    main {
      width: min(1480px, calc(100% - 32px));
      margin: 26px auto 46px;
      padding: 0;
    }

    h1, h2, h3 {
      color: var(--azul-900);
      letter-spacing: -.035em;
      line-height: 1.05;
    }

    h1 { font-size: clamp(30px, 3vw, 44px); margin: 8px 0 18px; }
    h2 { font-size: clamp(22px, 2vw, 30px); margin: 8px 0 18px; }

    .card {
      background: rgba(255, 255, 255, .94);
      border: 1px solid rgba(255,255,255,.86);
      border-radius: 22px;
      padding: 22px;
      box-shadow: var(--sombra-suave);
      margin-bottom: 18px;
      overflow: hidden;
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(235px, 1fr));
      gap: 14px;
      margin-bottom: 18px;
    }

    .grid > .card {
      min-height: 128px;
      color: white;
      background:
        linear-gradient(135deg, rgba(255,255,255,.16), transparent 42%),
        linear-gradient(135deg, var(--azul-700), var(--azul-900));
      border: 1px solid rgba(255, 255, 255, .22);
      box-shadow: 0 18px 42px rgba(11, 35, 79, .18);
      display: flex;
      flex-direction: column;
      justify-content: center;
    }

    .grid > .card:nth-child(2) {
      background:
        linear-gradient(135deg, rgba(255,255,255,.16), transparent 42%),
        linear-gradient(135deg, #294d87, #102d62);
    }

    .grid > .card:nth-child(3) {
      background:
        linear-gradient(135deg, rgba(255,255,255,.16), transparent 42%),
        linear-gradient(135deg, #315c9d, #173f86);
    }

    .grid > .card:nth-child(4) {
      background:
        linear-gradient(135deg, rgba(255,255,255,.16), transparent 42%),
        linear-gradient(135deg, #b88912, #d0a428);
      color: #fff;
    }

    .grid > .card .muted {
      color: rgba(255,255,255,.84);
      font-weight: 800;
      letter-spacing: .02em;
    }

    .metric {
      margin-top: 6px;
      font-size: clamp(30px, 3.2vw, 44px);
      line-height: 1;
      font-weight: 950;
      letter-spacing: -.04em;
      word-break: break-word;
    }

    label {
      display: block;
      font-weight: 850;
      margin: 14px 0 7px;
      color: var(--azul-900);
    }

    input, select, textarea {
      width: 100%;
      box-sizing: border-box;
      padding: 12px 13px;
      border: 1px solid rgba(23, 34, 59, .16);
      border-radius: 14px;
      font-size: 14px;
      background: rgba(255,255,255,.92);
      color: var(--texto);
      outline: none;
      transition: border .15s ease, box-shadow .15s ease;
    }

    input:focus, select:focus, textarea:focus {
      border-color: rgba(23, 63, 134, .55);
      box-shadow: 0 0 0 4px rgba(23, 63, 134, .10);
    }

    button, .btn {
      background: linear-gradient(135deg, var(--azul-700), var(--azul-900));
      color: white;
      border: 0;
      border-radius: 14px;
      padding: 11px 16px;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      cursor: pointer;
      font-weight: 850;
      box-shadow: 0 12px 22px rgba(23, 63, 134, .16);
      transition: transform .15s ease, box-shadow .15s ease, filter .15s ease;
      white-space: nowrap;
    }

    button:hover, .btn:hover {
      transform: translateY(-1px);
      filter: brightness(1.03);
      box-shadow: 0 14px 28px rgba(23, 63, 134, .22);
    }

    .btn.secondary, button.secondary {
      background: linear-gradient(135deg, #385a91, #173f86);
    }

    .btn.light {
      background: #edf1f7;
      color: var(--azul-900);
      box-shadow: none;
      border: 1px solid rgba(23, 34, 59, .08);
    }

    .table-scroll {
      overflow-x: auto;
      width: 100%;
      padding-bottom: 6px;
      border-radius: 16px;
    }

    table {
      width: max-content;
      min-width: 100%;
      border-collapse: separate;
      border-spacing: 0;
      font-size: 13px;
    }

    th, td {
      padding: 11px 10px;
      border-bottom: 1px solid var(--linha);
      text-align: left;
      vertical-align: top;
      white-space: nowrap;
    }

    th {
      background: linear-gradient(180deg, #f8fafc, #eef2f8);
      color: var(--azul-900);
      font-weight: 900;
      position: sticky;
      top: 0;
      z-index: 1;
    }

    tbody tr:hover td {
      background: rgba(23, 63, 134, .035);
    }

    td { max-width: none; }

    code {
      background: rgba(23, 63, 134, .08);
      color: #102d62;
      padding: 3px 7px;
      border-radius: 7px;
      white-space: nowrap;
      border: 1px solid rgba(23, 63, 134, .06);
    }

    a { color: var(--azul-700); font-weight: 800; }

    .cell {
      display: block;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      max-width: 140px;
      cursor: copy;
    }

    .cell.xs { max-width: 72px; }
    .cell.sm { max-width: 105px; }
    .cell.md { max-width: 160px; }
    .cell.lg { max-width: 240px; }
    .cell.xl { max-width: 360px; }
    .cell.empty { color: #9ca3af; cursor: default; }

    .cell:hover {
      background: rgba(23, 63, 134, .08);
      border-radius: 6px;
    }

    .copy-toast {
      position: fixed;
      right: 18px;
      bottom: 18px;
      background: linear-gradient(135deg, var(--azul-700), var(--azul-900));
      color: white;
      padding: 12px 15px;
      border-radius: 14px;
      opacity: 0;
      transform: translateY(10px);
      transition: .18s;
      pointer-events: none;
      z-index: 9999;
      box-shadow: var(--sombra);
      font-weight: 800;
    }

    .copy-toast.show { opacity: 1; transform: translateY(0); }

    .legend { font-size: 12px; color: var(--texto-suave); margin-top: 8px; }
    .muted { color: var(--texto-suave); font-size: 13px; }
    .row-actions { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }
    .danger { color: #b91c1c; font-weight: 800; }

    .pill {
      display: inline-block;
      background: rgba(208, 164, 40, .16);
      color: #8b650d;
      border: 1px solid rgba(208, 164, 40, .28);
      border-radius: 999px;
      padding: 3px 9px;
      font-size: 12px;
      font-weight: 850;
    }

    .nowrap { white-space: nowrap; }

    @media (max-width: 980px) {
      header {
        grid-template-columns: 1fr;
        border-radius: 22px;
      }

      nav {
        justify-content: flex-start;
      }

      .brand {
        align-items: flex-start;
      }

      .brand-logo {
        width: 148px;
      }

      .brand-title {
        white-space: normal;
      }
    }

    @media (max-width: 620px) {
      header, main { width: calc(100% - 20px); }
      header { margin-top: 10px; padding: 14px; }
      .brand { flex-direction: column; gap: 10px; }
      .brand-logo { width: 100%; max-width: 260px; }
      header a { width: 100%; justify-content: center; text-align: center; }
      nav { width: 100%; }
      .card { padding: 16px; border-radius: 18px; }
    }
  </style>
</head>
<body>
  <header>
    <div class="brand">
      <img class="brand-logo" src="${escapeHtml(logoUrl)}" alt="Faculdades Trilógicas">
      <div class="brand-copy">
        <div class="brand-title">ZapFatri</div>
        <div class="brand-subtitle">Rastreamento de links e WhatsApp</div>
      </div>
    </div>
    <nav aria-label="Navegação principal">
      <a href="/admin">Dashboard</a>
      <a href="/admin/links">Links</a>
      <a href="/admin/clicks">Cliques</a>
      <a href="/admin/reports/weekly">Relatório semanal</a>
      <a href="/admin/reports/monthly">Relatório mensal</a>
      <a href="/logout">Sair</a>
    </nav>
  </header>
  <main>${body}</main>
  <div id="copyToast" class="copy-toast">Copiado</div>
  <script>
    document.addEventListener("click", async (event) => {
      const el = event.target.closest("[data-copy]");
      if (!el) return;
      const value = el.getAttribute("data-copy") || "";
      if (!value) return;
      try {
        await navigator.clipboard.writeText(value);
        const toast = document.getElementById("copyToast");
        if (toast) {
          toast.classList.add("show");
          setTimeout(() => toast.classList.remove("show"), 900);
        }
      } catch {}
    });
  </script>
</body>
</html>`;
}

function loginPage(error = "") {
  const logoUrl = process.env.BRAND_LOGO_URL || "https://agenda-lives-pbza.onrender.com/fatri-logo.png";

  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Login | ZapFatri</title>
  <style>
    :root {
      --azul-900: #0b234f;
      --azul-700: #173f86;
      --dourado-600: #d0a428;
      --dourado-700: #b88912;
      --creme: #f5f1e8;
      --texto: #17223b;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif;
    }

    * { box-sizing: border-box; }

    body {
      min-height: 100vh;
      margin: 0;
      display: grid;
      place-items: center;
      padding: 20px;
      background:
        radial-gradient(circle at 14% 12%, rgba(208, 164, 40, .24), transparent 28rem),
        radial-gradient(circle at 86% 8%, rgba(23, 63, 134, .24), transparent 28rem),
        linear-gradient(145deg, #f9f5ec, #eef2f7 48%, #f5f1e8);
      color: var(--texto);
    }

    .login-shell {
      width: min(980px, 96vw);
      display: grid;
      grid-template-columns: minmax(280px, 1fr) minmax(320px, 430px);
      gap: 18px;
      align-items: stretch;
    }

    .hero {
      color: white;
      border-radius: 30px;
      padding: clamp(26px, 4vw, 46px);
      background:
        linear-gradient(135deg, rgba(255,255,255,.12), transparent 42%),
        linear-gradient(135deg, var(--azul-700), var(--azul-900));
      box-shadow: 0 22px 58px rgba(11, 35, 79, .20);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      min-height: 430px;
    }

    .hero img {
      width: min(310px, 100%);
      background: white;
      border-radius: 22px;
      padding: 12px 18px;
      box-shadow: inset 0 0 0 1px rgba(255,255,255,.35);
    }

    .eyebrow {
      margin-top: 34px;
      color: rgba(255,255,255,.72);
      font-weight: 900;
      letter-spacing: .16em;
      text-transform: uppercase;
      font-size: 12px;
    }

    h1 {
      margin: 12px 0 0;
      font-size: clamp(42px, 7vw, 74px);
      line-height: .92;
      letter-spacing: -.06em;
    }

    .hero p {
      max-width: 620px;
      margin: 20px 0 0;
      color: rgba(255,255,255,.86);
      font-size: 17px;
      line-height: 1.55;
    }

    form {
      background: rgba(255,255,255,.94);
      border: 1px solid rgba(255,255,255,.82);
      width: 100%;
      padding: clamp(24px, 4vw, 38px);
      border-radius: 30px;
      box-shadow: 0 22px 58px rgba(11, 35, 79, .16);
      display: flex;
      flex-direction: column;
      justify-content: center;
    }

    form h2 {
      margin: 0 0 8px;
      color: var(--azul-900);
      font-size: 30px;
      letter-spacing: -.04em;
    }

    form p {
      color: #657089;
      margin: 0 0 22px;
      line-height: 1.45;
    }

    label {
      display: block;
      font-weight: 850;
      color: var(--azul-900);
      margin-bottom: 8px;
    }

    input {
      width: 100%;
      box-sizing: border-box;
      padding: 14px;
      border: 1px solid rgba(23, 34, 59, .16);
      border-radius: 16px;
      font-size: 16px;
      outline: none;
      background: #fff;
    }

    input:focus {
      border-color: rgba(23, 63, 134, .55);
      box-shadow: 0 0 0 4px rgba(23, 63, 134, .10);
    }

    button {
      width: 100%;
      margin-top: 16px;
      background: linear-gradient(135deg, var(--dourado-600), var(--dourado-700));
      color: white;
      border: 0;
      padding: 14px;
      border-radius: 16px;
      font-size: 16px;
      font-weight: 900;
      cursor: pointer;
      box-shadow: 0 14px 28px rgba(184, 137, 18, .22);
    }

    .error {
      color: #b91c1c;
      background: #fff1f2;
      border: 1px solid #fecdd3;
      padding: 10px 12px;
      border-radius: 14px;
      font-weight: 800;
      margin-bottom: 14px;
    }

    @media (max-width: 860px) {
      .login-shell { grid-template-columns: 1fr; }
      .hero { min-height: auto; }
    }
  </style>
</head>
<body>
  <div class="login-shell">
    <section class="hero">
      <div>
        <img src="${escapeHtml(logoUrl)}" alt="Faculdades Trilógicas">
        <div class="eyebrow">Painel administrativo</div>
        <h1>ZapFatri</h1>
        <p>Controle links rastreáveis, cliques, origens e relatórios de WhatsApp com leitura rápida para a operação.</p>
      </div>
    </section>

    <form method="post" action="/login">
      <h2>Entrar</h2>
      <p>Use sua senha administrativa para acessar o painel.</p>
      ${error ? `<div class="error">${escapeHtml(error)}</div>` : ""}
      <label>Senha admin</label>
      <input type="password" name="password" autofocus required>
      <button type="submit">Acessar painel</button>
    </form>
  </div>
</body>
</html>`;
}

app.get("/login", (req, res) => {
  res.send(loginPage());
});

app.post("/login", (req, res) => {
  const password = req.body.password || "";
  if (!process.env.ADMIN_PASSWORD || password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).send(loginPage("Senha incorreta."));
  }

  res.cookie("zf_admin", createSessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 1000 * 60 * 60 * 24 * 7
  });

  return res.redirect("/admin");
});

app.get("/logout", (req, res) => {
  res.clearCookie("zf_admin");
  res.redirect("/login");
});

app.get("/", (req, res) => {
  res.redirect("/admin");
});

app.get("/health", (req, res) => {
  res.json({ ok: true, app: "zapfatri" });
});

app.get("/admin", requireAdmin, async (req, res) => {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [
    linksResult,
    totalClicksResult,
    monthClicksResult,
    topLinksResult
  ] = await Promise.all([
    supabase.from("tracked_links").select("id", { count: "exact", head: true }),
    supabase.from("click_events").select("id", { count: "exact", head: true }),
    supabase.from("click_events").select("id", { count: "exact", head: true }).gte("clicked_at", startOfMonth.toISOString()),
    supabase.from("report_by_link").select("*").order("total_clicks", { ascending: false }).limit(10)
  ]);

  const body = `
    <div class="grid">
      <div class="card"><div class="muted">Links cadastrados</div><div class="metric">${linksResult.count || 0}</div></div>
      <div class="card"><div class="muted">Cliques totais</div><div class="metric">${totalClicksResult.count || 0}</div></div>
      <div class="card"><div class="muted">Cliques neste mês</div><div class="metric">${monthClicksResult.count || 0}</div></div>
      <div class="card"><div class="muted">Base de links</div><div class="metric">${escapeHtml(PUBLIC_GO_BASE_URL.replace(/^https?:\/\//, ""))}</div></div>
    </div>

    <div class="card">
      <div class="row-actions" style="justify-content:space-between; align-items:center;">
        <h2>Top links</h2>
        <a class="btn" href="/admin/links/new">Criar link</a>
      </div>
      <table>
        <thead><tr><th>Nome</th><th>Link ZapFatri</th><th>Tipo</th><th>Cliques</th><th>Humanos</th><th>Bots</th></tr></thead>
        <tbody>
          ${(topLinksResult.data || []).map(row => `
            <tr>
              <td><a href="/admin/links/${row.link_id}">${escapeHtml(row.name)}</a></td>
              <td><code>${escapeHtml(`${PUBLIC_GO_BASE_URL}/${row.slug}`)}</code></td>
              <td>${escapeHtml(row.link_type)}</td>
              <td>${row.total_clicks || 0}</td>
              <td>${row.human_clicks || 0}</td>
              <td>${row.bot_clicks || 0}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
  res.send(layout("Dashboard", body));
});

app.get("/admin/links", requireAdmin, async (req, res) => {
  const { data, error } = await supabase
    .from("report_by_link")
    .select("*")
    .order("last_click", { ascending: false, nullsFirst: false });

  if (error) return res.status(500).send(layout("Erro", `<div class="card danger">${escapeHtml(error.message)}</div>`));

  const body = `
    <div class="card">
      <div class="row-actions" style="justify-content:space-between; align-items:center;">
        <h1>Links</h1>
        <a class="btn" href="/admin/links/new">Novo link rastreável</a>
      </div>
      <table>
        <thead>
          <tr><th>Nome</th><th>Link ZapFatri</th><th>Destino</th><th>Tipo</th><th>Campanha</th><th>Cliques</th><th>Status</th><th>Ações</th></tr>
        </thead>
        <tbody>
          ${(data || []).map(row => {
            const dest = row.link_type === "whatsapp" ? `wa.me/${row.whatsapp_phone}` : row.destination_url;
            return `
              <tr>
                <td><a href="/admin/links/${row.link_id}">${escapeHtml(row.name)}</a></td>
                <td><code>${escapeHtml(`${PUBLIC_GO_BASE_URL}/${row.slug}`)}</code></td>
                <td>${escapeHtml(dest || "")}</td>
                <td>${escapeHtml(row.link_type)}</td>
                <td>${escapeHtml(row.campaign || "")}</td>
                <td>${row.total_clicks || 0}</td>
                <td>${row.active ? "Ativo" : "Inativo"}</td>
                <td><a class="btn light" href="/admin/links/${row.link_id}/edit">Editar</a></td>
              </tr>`;
          }).join("")}
        </tbody>
      </table>
    </div>
  `;
  res.send(layout("Links", body));
});


function renderLinkForm({ title, action, link = {}, submitLabel = "Salvar" }) {
  const isEdit = Boolean(link.id);
  const linkType = link.link_type || "whatsapp";
  const isActive = link.active !== false;

  return `
    <div class="card">
      <h1>${escapeHtml(title)}</h1>
      <form method="post" action="${escapeHtml(action)}">
        <label>Nome do link</label>
        <input name="name" value="${escapeHtml(link.name || "")}" placeholder="Ex: WhatsApp Paulo - Vídeo LED" required>

        <label>Tipo</label>
        <select name="link_type" required>
          <option value="whatsapp" ${linkType === "whatsapp" ? "selected" : ""}>WhatsApp</option>
          <option value="url" ${linkType === "url" ? "selected" : ""}>Link comum</option>
        </select>

        <label>Slug / caminho público</label>
        <input name="slug" value="${escapeHtml(link.slug || "")}" placeholder="Ex: 5511930757733 ou portfolio-pbza">
        <div class="muted">Para WhatsApp, recomendo usar só números, sem traço: 5511930757733.</div>

        <label>Número WhatsApp</label>
        <input name="whatsapp_phone" value="${escapeHtml(link.whatsapp_phone || "")}" placeholder="Ex: 5511930757733">

        <label>Mensagem padrão do WhatsApp</label>
        <textarea name="whatsapp_message" rows="3" placeholder="Ex: Olá, vim pelo vídeo no YouTube.">${escapeHtml(link.whatsapp_message || "")}</textarea>

        <label>URL de destino, se for link comum</label>
        <input name="destination_url" value="${escapeHtml(link.destination_url || "")}" placeholder="https://...">

        <label>Cliente</label>
        <input name="client" value="${escapeHtml(link.client || "")}" placeholder="Ex: PBZA">

        <label>Campanha</label>
        <input name="campaign" value="${escapeHtml(link.campaign || "")}" placeholder="Ex: youtube-junho-2026">

        <label>Origem padrão</label>
        <input name="default_source" value="${escapeHtml(link.default_source || "")}" placeholder="Ex: youtube, instagram, qrcode">

        ${isEdit ? `
          <label>Status</label>
          <select name="active">
            <option value="true" ${isActive ? "selected" : ""}>Ativo</option>
            <option value="false" ${!isActive ? "selected" : ""}>Inativo</option>
          </select>
        ` : ""}

        <br><br>
        <div class="row-actions">
          <button type="submit">${escapeHtml(submitLabel)}</button>
          <a class="btn light" href="${isEdit ? `/admin/links/${encodeURIComponent(link.id)}` : "/admin/links"}">Cancelar</a>
        </div>
      </form>
    </div>
  `;
}


function buildTrackedLinkPayloadFromBody(body, existing = null) {
  const {
    name,
    link_type,
    destination_url,
    whatsapp_phone,
    whatsapp_message,
    client,
    campaign,
    default_source
  } = body;

  const baseSlug = body.slug || (link_type === "whatsapp" ? whatsapp_phone : name);
  const slug = normalizeSlug(baseSlug);

  if (!name || !["whatsapp", "url"].includes(link_type)) {
    return { error: "Nome e tipo são obrigatórios." };
  }

  if (!slug) {
    return { error: "Slug inválido." };
  }

  if (link_type === "whatsapp" && !isValidPhone(whatsapp_phone)) {
    return { error: "Número de WhatsApp inválido. Use apenas dígitos com DDI e DDD." };
  }

  if (link_type === "url" && !isValidHttpUrl(destination_url)) {
    return { error: "URL de destino inválida. Use http ou https." };
  }

  const payload = {
    name,
    slug,
    link_type,
    destination_url: link_type === "url" ? destination_url : null,
    whatsapp_phone: link_type === "whatsapp" ? whatsapp_phone : null,
    whatsapp_message: link_type === "whatsapp" ? whatsapp_message || null : null,
    client: client || null,
    campaign: campaign || null,
    default_source: default_source || null
  };

  if (existing) {
    payload.active = body.active === "false" ? false : true;
  }

  return { payload };
}

app.get("/admin/links/new", requireAdmin, (req, res) => {
  const body = renderLinkForm({
    title: "Novo link rastreável",
    action: "/admin/links",
    submitLabel: "Criar link"
  });
  res.send(layout("Novo link", body));
});

app.post("/admin/links", requireAdmin, async (req, res) => {
  const result = buildTrackedLinkPayloadFromBody(req.body);

  if (result.error) {
    return res.status(400).send(layout("Erro", `<div class="card danger">${escapeHtml(result.error)}</div>`));
  }

  const { error } = await supabase.from("tracked_links").insert(result.payload);
  if (error) {
    return res.status(500).send(layout("Erro", `<div class="card danger">${escapeHtml(error.message)}</div>`));
  }

  res.redirect("/admin/links");
});

app.get("/admin/links/:id/edit", requireAdmin, async (req, res) => {
  const { id } = req.params;

  const { data: link, error } = await supabase
    .from("tracked_links")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !link) {
    return res.status(404).send(layout("Erro", `<div class="card danger">Link não encontrado.</div>`));
  }

  const body = renderLinkForm({
    title: `Editar ${link.name}`,
    action: `/admin/links/${encodeURIComponent(link.id)}/update`,
    link,
    submitLabel: "Salvar alterações"
  });

  res.send(layout(`Editar ${link.name}`, body));
});

app.post("/admin/links/:id/update", requireAdmin, async (req, res) => {
  const { id } = req.params;

  const existingResult = await supabase
    .from("tracked_links")
    .select("*")
    .eq("id", id)
    .single();

  if (existingResult.error || !existingResult.data) {
    return res.status(404).send(layout("Erro", `<div class="card danger">Link não encontrado.</div>`));
  }

  const result = buildTrackedLinkPayloadFromBody(req.body, existingResult.data);

  if (result.error) {
    return res.status(400).send(layout("Erro", `<div class="card danger">${escapeHtml(result.error)}</div>`));
  }

  const { error } = await supabase
    .from("tracked_links")
    .update(result.payload)
    .eq("id", id);

  if (error) {
    return res.status(500).send(layout("Erro", `<div class="card danger">${escapeHtml(error.message)}</div>`));
  }

  res.redirect(`/admin/links/${encodeURIComponent(id)}`);
});

app.get("/admin/links/:id", requireAdmin, async (req, res) => {
  const { id } = req.params;

  const [linkResult, clicksResult] = await Promise.all([
    supabase.from("tracked_links").select("*").eq("id", id).single(),
    supabase.from("click_events").select("*").eq("tracked_link_id", id).order("clicked_at", { ascending: false }).limit(200)
  ]);

  if (linkResult.error || !linkResult.data) {
    return res.status(404).send(layout("Erro", `<div class="card danger">Link não encontrado.</div>`));
  }

  const link = linkResult.data;
  const publicLink = `${PUBLIC_GO_BASE_URL}/${link.slug}`;
  const destination = link.link_type === "whatsapp"
    ? buildWhatsAppUrl(link.whatsapp_phone, link.whatsapp_message || "")
    : link.destination_url;

  const body = `
    <div class="card">
      <h1>${escapeHtml(link.name)}</h1>
      <p><strong>Link ZapFatri:</strong> <code>${escapeHtml(publicLink)}</code></p>
      <p><strong>Destino:</strong> <code>${escapeHtml(destination || "")}</code></p>
      <p><strong>Campanha:</strong> ${escapeHtml(link.campaign || "")}</p>
      <p><strong>Origem padrão:</strong> ${escapeHtml(link.default_source || "")}</p>
      <div class="row-actions">
        <a class="btn" href="/admin/links/${encodeURIComponent(link.id)}/edit">Editar link</a>
        <a class="btn light" href="/admin/export/clicks.csv?link_id=${encodeURIComponent(link.id)}">Exportar CSV deste link</a>
        <a class="btn light" href="/admin/clicks?link_id=${encodeURIComponent(link.id)}">Ver todos os cliques</a>
        <a class="btn light" href="/admin/links">Voltar para links</a>
      </div>
    </div>

    <div class="card">
      <h2>Últimos cliques</h2>
      <table>
        <thead><tr><th>Data/hora</th><th>Origem</th><th>Campanha</th><th>Vídeo</th><th>Dispositivo</th><th>Navegador</th><th>Referrer</th><th>Bot</th></tr></thead>
        <tbody>
          ${(clicksResult.data || []).map(c => `
            <tr>
              <td>${escapeHtml(new Date(c.clicked_at).toLocaleString("pt-BR"))}</td>
              <td>${escapeHtml(c.source || "")}</td>
              <td>${escapeHtml(c.campaign || "")}</td>
              <td>${escapeHtml(c.video || "")}</td>
              <td>${escapeHtml([c.city, c.region, c.country].filter(Boolean).join(" / "))}</td>
              <td>${escapeHtml(c.device_type || "")}</td>
              <td>${escapeHtml(c.browser || "")}</td>
              <td>${escapeHtml(c.referrer || "")}</td>
              <td>${c.is_bot ? "Sim" : "Não"}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
  res.send(layout(link.name, body));
});


function formatDateBR(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("pt-BR");
}

function formatTimeBR(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function formatDateTimeBR(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("pt-BR");
}

function isoDate(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

function monthKey(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 7);
}

function weekStartKey(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() - day + 1);
  return d.toISOString().slice(0, 10);
}

function renderLocation(row) {
  return [row.city, row.region, row.country].filter(Boolean).join(" / ");
}

function shortHash(value) {
  if (!value) return "";
  const s = String(value);
  return s.length > 16 ? `${s.slice(0, 16)}…` : s;
}

function compactCell(value, size = "md", options = {}) {
  const raw = value === null || value === undefined ? "" : String(value);
  const display = options.display !== undefined ? String(options.display) : raw;
  const emptyClass = raw ? "" : " empty";
  const className = `cell ${size}${emptyClass}`;
  const title = raw || "";
  if (!raw) return `<span class="${className}">—</span>`;
  const prefix = options.code ? "<code>" : "";
  const suffix = options.code ? "</code>" : "";
  return `<span class="${className}" title="${escapeHtml(title)}" data-copy="${escapeHtml(raw)}">${prefix}${escapeHtml(display)}${suffix}</span>`;
}

function jsonString(value) {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  try { return JSON.stringify(value); } catch { return String(value); }
}

function sheetEscape(value, delimiter = ";") {
  if (value === null || value === undefined) return "";
  const s = String(value);
  const mustQuote = s.includes('"') || s.includes("\n") || s.includes("\r") || s.includes(delimiter);
  return mustQuote ? `"${s.replaceAll('"', '""')}"` : s;
}

// Excel tende a converter telefones/slugs longos para notação científica.
// Para colunas marcadas como excelText, exportamos como fórmula de texto: ="5511930757733".
// A função só deve ser usada em campos controlados de telefone/slug, não em campos livres.
function excelText(value) {
  if (value === null || value === undefined) return "";
  const s = String(value).trim();
  if (!s) return "";
  const safe = s.replaceAll('"', '""');
  return `="${safe}"`;
}

function currentQueryString(req, extra = {}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(req.query || {})) {
    if (value !== undefined && value !== null && String(value) !== "") params.set(key, String(value));
  }
  for (const [key, value] of Object.entries(extra)) {
    if (value === null || value === undefined || String(value) === "") params.delete(key);
    else params.set(key, String(value));
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

function applyClickFilters(query, req) {
  if (req.query.link_id) query = query.eq("tracked_link_id", req.query.link_id);
  if (req.query.source) query = query.eq("source", req.query.source);
  if (req.query.campaign) query = query.eq("campaign", req.query.campaign);
  if (req.query.country) query = query.eq("country", req.query.country);
  if (req.query.city) query = query.ilike("city", `%${String(req.query.city)}%`);
  if (req.query.from) query = query.gte("clicked_at", `${req.query.from}T00:00:00.000Z`);
  if (req.query.to) query = query.lte("clicked_at", `${req.query.to}T23:59:59.999Z`);
  return query;
}


app.get("/admin/clicks", requireAdmin, async (req, res) => {
  let query = supabase
    .from("click_events")
    .select("*, tracked_links(name, slug, link_type, whatsapp_phone, destination_url)")
    .order("clicked_at", { ascending: false })
    .limit(1000);

  query = applyClickFilters(query, req);

  const { data, error } = await query;
  if (error) return res.status(500).send(layout("Erro", `<div class="card danger">${escapeHtml(error.message)}</div>`));

  const exportQs = currentQueryString(req);
  const body = `
    <div class="card">
      <div class="row-actions" style="justify-content:space-between;">
        <div>
          <h1>Cliques</h1>
          <p class="muted">Tabela operacional. Para planilha limpa, use os botões de exportação.</p><p class="legend">Texto longo fica cortado na tela para manter a tabela compacta. Passe o mouse para ver completo ou clique em uma célula para copiar o valor inteiro.</p>
        </div>
        <div class="row-actions">
          <a class="btn light" href="/admin/export/clicks.csv${exportQs}">CSV detalhado</a>
          <a class="btn light" href="/admin/export/weekly.csv">CSV semanal</a>
          <a class="btn light" href="/admin/export/monthly.csv">CSV mensal</a>
        </div>
      </div>

      <form method="get" action="/admin/clicks" class="row-actions" style="margin-top:12px;">
        <input style="max-width:160px" type="date" name="from" value="${escapeHtml(req.query.from || "")}" title="De">
        <input style="max-width:160px" type="date" name="to" value="${escapeHtml(req.query.to || "")}" title="Até">
        <input style="max-width:160px" name="source" placeholder="canal: youtube" value="${escapeHtml(req.query.source || "")}">
        <input style="max-width:190px" name="campaign" placeholder="campanha" value="${escapeHtml(req.query.campaign || "")}">
        <input style="max-width:120px" name="country" placeholder="país: BR" value="${escapeHtml(req.query.country || "")}">
        <input style="max-width:160px" name="city" placeholder="cidade" value="${escapeHtml(req.query.city || "")}">
        <button type="submit">Filtrar</button>
        <a class="btn light" href="/admin/clicks">Limpar</a>
      </form>
    </div>

    <div class="card">
      <div class="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Data</th><th>Hora</th><th>Link</th><th>Slug</th><th>Telefone/Destino</th>
              <th>Canal</th><th>Medium</th><th>Campanha</th><th>Vídeo</th><th>Posição</th>
              <th>País</th><th>Região</th><th>Cidade</th><th>Timezone</th>
              <th>Dispositivo</th><th>Navegador</th><th>OS</th><th>IP hash</th>
              <th>Referrer</th><th>Runtime</th><th>Bot</th>
            </tr>
          </thead>
          <tbody>
            ${(data || []).map(c => `
              <tr>
                <td>${compactCell(formatDateBR(c.clicked_at), "sm")}</td>
                <td>${compactCell(formatTimeBR(c.clicked_at), "sm")}</td>
                <td>${compactCell(c.tracked_links?.name || "", "lg")}</td>
                <td>${compactCell(c.tracked_links?.slug || c.raw_slug || "", "md", { code: true })}</td>
                <td>${compactCell(c.tracked_links?.whatsapp_phone || c.destination_url || c.tracked_links?.destination_url || "", "lg")}</td>
                <td>${compactCell(c.source || "", "md")}</td>
                <td>${compactCell(c.medium || "", "md")}</td>
                <td>${compactCell(c.campaign || "", "lg")}</td>
                <td>${compactCell(c.video || "", "lg")}</td>
                <td>${compactCell(c.placement || "", "md")}</td>
                <td>${compactCell(c.country || "", "xs")}</td>
                <td>${compactCell(c.region || "", "md")}</td>
                <td>${compactCell(c.city || "", "md")}</td>
                <td>${compactCell(c.timezone || "", "lg")}</td>
                <td>${compactCell(c.device_type || "", "sm")}</td>
                <td>${compactCell(c.browser || "", "sm")}</td>
                <td>${compactCell(c.os || "", "sm")}</td>
                <td>${compactCell(c.ip_hash || "", "md", { display: shortHash(c.ip_hash), code: true })}</td>
                <td>${compactCell(c.referrer || "", "xl")}</td>
                <td>${compactCell(c.edge_runtime || "", "md")}</td>
                <td>${compactCell(c.is_bot ? "Sim" : "Não", "xs")}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </div>
  `;
  res.send(layout("Cliques", body));
});

app.get("/admin/reports/weekly", requireAdmin, async (req, res) => {
  let query = supabase
    .from("weekly_report")
    .select("*")
    .order("week_start", { ascending: false })
    .order("total_clicks", { ascending: false });

  if (req.query.week) {
    const start = new Date(`${req.query.week}T00:00:00.000Z`);
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 7);
    query = query.gte("week_start", start.toISOString()).lt("week_start", end.toISOString());
  }

  const { data, error } = await query;
  if (error) return res.status(500).send(layout("Erro", `<div class="card danger">${escapeHtml(error.message)}<br><br>Rode a migration <code>003_reports_exports.sql</code> no Supabase.</div>`));

  const body = `
    <div class="card">
      <h1>Relatório semanal</h1>
      <form method="get" action="/admin/reports/weekly" class="row-actions">
        <input style="max-width:220px" type="date" name="week" value="${escapeHtml(req.query.week || "")}">
        <button type="submit">Filtrar semana</button>
        <a class="btn light" href="/admin/export/weekly.csv${req.query.week ? `?week=${encodeURIComponent(req.query.week)}` : ""}">Exportar CSV limpo</a>
      </form>
      <p class="muted">Dica: escolha a segunda-feira da semana para filtrar com precisão.</p>
    </div>
    <div class="card">
      <div class="table-scroll">
        <table>
          <thead><tr><th>Semana</th><th>Primeiro clique</th><th>Último clique</th><th>Link</th><th>Telefone</th><th>Canal</th><th>Medium</th><th>Campanha</th><th>Vídeo</th><th>País</th><th>Região</th><th>Cidade</th><th>Total</th><th>Humanos</th><th>Bots</th></tr></thead>
          <tbody>
            ${(data || []).map(r => `
              <tr>
                <td>${escapeHtml(isoDate(r.week_start))}</td>
                <td>${escapeHtml(formatDateTimeBR(r.first_click_at))}</td>
                <td>${escapeHtml(formatDateTimeBR(r.last_click_at))}</td>
                <td>${escapeHtml(r.name || "")}<br><code>${escapeHtml(r.slug || "")}</code></td>
                <td>${escapeHtml(r.whatsapp_phone || "")}</td>
                <td>${escapeHtml(r.source || "")}</td>
                <td>${escapeHtml(r.medium || "")}</td>
                <td>${escapeHtml(r.campaign || "")}</td>
                <td>${escapeHtml(r.video || "")}</td>
                <td>${escapeHtml(r.country || "")}</td>
                <td>${escapeHtml(r.region || "")}</td>
                <td>${escapeHtml(r.city || "")}</td>
                <td>${r.total_clicks || 0}</td>
                <td>${r.human_clicks || 0}</td>
                <td>${r.bot_clicks || 0}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </div>
  `;
  res.send(layout("Relatório semanal", body));
});

app.get("/admin/reports/monthly", requireAdmin, async (req, res) => {
  let query = supabase
    .from("monthly_report")
    .select("*")
    .order("month", { ascending: false })
    .order("total_clicks", { ascending: false });

  if (req.query.month) {
    const month = String(req.query.month);
    const start = new Date(`${month}-01T00:00:00.000Z`);
    const end = new Date(start);
    end.setUTCMonth(end.getUTCMonth() + 1);
    query = query.gte("month", start.toISOString()).lt("month", end.toISOString());
  }

  const { data, error } = await query;
  if (error) return res.status(500).send(layout("Erro", `<div class="card danger">${escapeHtml(error.message)}<br><br>Rode a migration <code>003_reports_exports.sql</code> no Supabase.</div>`));

  const body = `
    <div class="card">
      <h1>Relatório mensal</h1>
      <form method="get" action="/admin/reports/monthly" class="row-actions">
        <input style="max-width:220px" type="month" name="month" value="${escapeHtml(req.query.month || "")}">
        <button type="submit">Filtrar</button>
        <a class="btn light" href="/admin/export/monthly.csv${req.query.month ? `?month=${encodeURIComponent(req.query.month)}` : ""}">Exportar CSV limpo</a>
      </form>
    </div>
    <div class="card">
      <div class="table-scroll">
        <table>
          <thead><tr><th>Mês</th><th>Primeiro clique</th><th>Último clique</th><th>Link</th><th>Telefone</th><th>Canal</th><th>Medium</th><th>Campanha</th><th>Vídeo</th><th>País</th><th>Região</th><th>Cidade</th><th>Dispositivo</th><th>Total</th><th>Humanos</th><th>Bots</th></tr></thead>
          <tbody>
            ${(data || []).map(r => `
              <tr>
                <td>${escapeHtml(monthKey(r.month))}</td>
                <td>${escapeHtml(formatDateTimeBR(r.first_click_at))}</td>
                <td>${escapeHtml(formatDateTimeBR(r.last_click_at))}</td>
                <td>${escapeHtml(r.name || "")}<br><code>${escapeHtml(r.slug || "")}</code></td>
                <td>${escapeHtml(r.whatsapp_phone || "")}</td>
                <td>${escapeHtml(r.source || "")}</td>
                <td>${escapeHtml(r.medium || "")}</td>
                <td>${escapeHtml(r.campaign || "")}</td>
                <td>${escapeHtml(r.video || "")}</td>
                <td>${escapeHtml(r.country || "")}</td>
                <td>${escapeHtml(r.region || "")}</td>
                <td>${escapeHtml(r.city || "")}</td>
                <td>${escapeHtml(r.device_type || "")}</td>
                <td>${r.total_clicks || 0}</td>
                <td>${r.human_clicks || 0}</td>
                <td>${r.bot_clicks || 0}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </div>
  `;
  res.send(layout("Relatório mensal", body));
});

async function exportRows(res, filename, rows, columns) {
  const delimiter = ";";
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

  // BOM + sep=; ajuda Excel em português a abrir separado por colunas.
  res.write("\ufeffsep=;\n");
  res.write(columns.map(c => sheetEscape(c.label, delimiter)).join(delimiter) + "\n");

  for (const row of rows || []) {
    res.write(columns.map(c => {
      const value = typeof c.value === "function" ? c.value(row) : row[c.value];
      return sheetEscape(c.excelText ? excelText(value) : value, delimiter);
    }).join(delimiter) + "\n");
  }
  res.end();
}

const detailedClickColumns = [
  { label: "data_hora_iso", value: "clicked_at" },
  { label: "data", value: r => formatDateBR(r.clicked_at) },
  { label: "hora", value: r => formatTimeBR(r.clicked_at) },
  { label: "semana_inicio", value: r => weekStartKey(r.clicked_at) },
  { label: "mes", value: r => monthKey(r.clicked_at) },

  { label: "link_nome", value: r => r.tracked_links?.name },
  { label: "link_slug", value: r => r.tracked_links?.slug || r.raw_slug, excelText: true },
  { label: "raw_slug", value: "raw_slug", excelText: true },
  { label: "tipo_link", value: r => r.tracked_links?.link_type },
  { label: "telefone_whatsapp", value: r => r.tracked_links?.whatsapp_phone, excelText: true },
  { label: "destino_url", value: r => r.destination_url || r.tracked_links?.destination_url },

  { label: "canal_origem", value: "source" },
  { label: "medium", value: "medium" },
  { label: "campanha", value: "campaign" },
  { label: "video", value: "video" },
  { label: "post", value: "post" },
  { label: "posicao", value: "placement" },

  { label: "pais", value: "country" },
  { label: "estado_regiao", value: "region" },
  { label: "cidade", value: "city" },
  { label: "timezone", value: "timezone" },
  { label: "latitude", value: "latitude" },
  { label: "longitude", value: "longitude" },
  { label: "postal_code", value: "postal_code" },
  { label: "colo_cloudflare", value: "colo" },
  { label: "asn", value: "asn" },
  { label: "provedor_as", value: "as_organization" },

  { label: "dispositivo", value: "device_type" },
  { label: "navegador", value: "browser" },
  { label: "sistema", value: "os" },
  { label: "bot", value: r => r.is_bot ? "sim" : "nao" },
  { label: "ip_hash", value: "ip_hash" },
  { label: "referrer", value: "referrer" },
  { label: "runtime", value: "edge_runtime" },
  { label: "user_agent", value: "user_agent" },
  { label: "query_params", value: r => jsonString(r.query_params) }
];

app.get("/admin/export/clicks.csv", requireAdmin, async (req, res) => {
  let query = supabase
    .from("click_events")
    .select("*, tracked_links(name, slug, link_type, whatsapp_phone, destination_url)")
    .order("clicked_at", { ascending: false })
    .limit(100000);

  query = applyClickFilters(query, req);

  const { data, error } = await query;
  if (error) return res.status(500).send(error.message);

  await exportRows(res, "zapfatri-cliques-detalhado.csv", data, detailedClickColumns);
});

app.get("/admin/export/monthly.csv", requireAdmin, async (req, res) => {
  let query = supabase.from("monthly_report").select("*").order("month", { ascending: false });
  if (req.query.month) {
    const month = String(req.query.month);
    const start = new Date(`${month}-01T00:00:00.000Z`);
    const end = new Date(start);
    end.setUTCMonth(end.getUTCMonth() + 1);
    query = query.gte("month", start.toISOString()).lt("month", end.toISOString());
  }
  const { data, error } = await query;
  if (error) return res.status(500).send(error.message);

  await exportRows(res, "zapfatri-relatorio-mensal.csv", data, [
    { label: "mes", value: r => monthKey(r.month) },
    { label: "primeiro_clique_iso", value: "first_click_at" },
    { label: "primeiro_clique_data", value: r => formatDateBR(r.first_click_at) },
    { label: "primeiro_clique_hora", value: r => formatTimeBR(r.first_click_at) },
    { label: "ultimo_clique_iso", value: "last_click_at" },
    { label: "ultimo_clique_data", value: r => formatDateBR(r.last_click_at) },
    { label: "ultimo_clique_hora", value: r => formatTimeBR(r.last_click_at) },
    { label: "link_nome", value: "name" },
    { label: "link_slug", value: "slug", excelText: true },
    { label: "tipo_link", value: "link_type" },
    { label: "telefone_whatsapp", value: "whatsapp_phone", excelText: true },
    { label: "cliente", value: "client" },
    { label: "canal_origem", value: "source" },
    { label: "medium", value: "medium" },
    { label: "campanha", value: "campaign" },
    { label: "video", value: "video" },
    { label: "posicao", value: "placement" },
    { label: "pais", value: "country" },
    { label: "estado_regiao", value: "region" },
    { label: "cidade", value: "city" },
    { label: "dispositivo", value: "device_type" },
    { label: "navegador", value: "browser" },
    { label: "sistema", value: "os" },
    { label: "total_cliques", value: "total_clicks" },
    { label: "cliques_humanos", value: "human_clicks" },
    { label: "cliques_bots", value: "bot_clicks" }
  ]);
});

app.get("/admin/export/weekly.csv", requireAdmin, async (req, res) => {
  let query = supabase.from("weekly_report").select("*").order("week_start", { ascending: false });
  if (req.query.week) {
    const start = new Date(`${req.query.week}T00:00:00.000Z`);
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 7);
    query = query.gte("week_start", start.toISOString()).lt("week_start", end.toISOString());
  }
  const { data, error } = await query;
  if (error) return res.status(500).send(error.message);

  await exportRows(res, "zapfatri-relatorio-semanal.csv", data, [
    { label: "semana_inicio", value: r => isoDate(r.week_start) },
    { label: "primeiro_clique_iso", value: "first_click_at" },
    { label: "primeiro_clique_data", value: r => formatDateBR(r.first_click_at) },
    { label: "primeiro_clique_hora", value: r => formatTimeBR(r.first_click_at) },
    { label: "ultimo_clique_iso", value: "last_click_at" },
    { label: "ultimo_clique_data", value: r => formatDateBR(r.last_click_at) },
    { label: "ultimo_clique_hora", value: r => formatTimeBR(r.last_click_at) },
    { label: "link_nome", value: "name" },
    { label: "link_slug", value: "slug", excelText: true },
    { label: "tipo_link", value: "link_type" },
    { label: "telefone_whatsapp", value: "whatsapp_phone", excelText: true },
    { label: "cliente", value: "client" },
    { label: "canal_origem", value: "source" },
    { label: "medium", value: "medium" },
    { label: "campanha", value: "campaign" },
    { label: "video", value: "video" },
    { label: "posicao", value: "placement" },
    { label: "pais", value: "country" },
    { label: "estado_regiao", value: "region" },
    { label: "cidade", value: "city" },
    { label: "dispositivo", value: "device_type" },
    { label: "navegador", value: "browser" },
    { label: "sistema", value: "os" },
    { label: "total_cliques", value: "total_clicks" },
    { label: "cliques_humanos", value: "human_clicks" },
    { label: "cliques_bots", value: "bot_clicks" }
  ]);
});

// Rota pública de rastreamento. Precisa ficar depois das rotas /admin, /login etc.
app.get("/:slug", async (req, res) => {
  const slug = normalizeSlug(req.params.slug || "");

  if (!slug || ["admin", "login", "logout", "health"].includes(slug)) {
    return res.status(404).send("Link não encontrado.");
  }

  const { data: link, error } = await supabase
    .from("tracked_links")
    .select("*")
    .eq("slug", slug)
    .eq("active", true)
    .single();

  if (error || !link) {
    return res.status(404).send("Link não encontrado.");
  }

  let destination = link.destination_url;

  if (link.link_type === "whatsapp") {
    const message = req.query.text || link.whatsapp_message || "";
    destination = buildWhatsAppUrl(link.whatsapp_phone, message);
  }

  if (!destination || !isValidHttpUrl(destination)) {
    return res.status(500).send("Destino inválido.");
  }

  const userAgent = req.get("user-agent") || "";
  const referrer = req.get("referer") || null;
  const ip = getClientIp(req);
  const ua = parseUserAgent(userAgent);

  // Alguns provedores/CDNs mandam país em cabeçalhos. Se não vier, fica vazio.
  // Em produção, o Cloudflare Worker do go.zapfatri.com costuma preencher melhor estes campos.
  const country = req.get("cf-ipcountry") || req.get("x-vercel-ip-country") || null;
  const region = req.get("x-vercel-ip-country-region") || null;
  const city = req.get("x-vercel-ip-city") || null;
  const timezone = req.get("cf-timezone") || null;

  const clickPayload = {
    tracked_link_id: link.id,
    raw_slug: slug,
    source: req.query.src || link.default_source || null,
    medium: req.query.medium || null,
    campaign: req.query.campaign || link.campaign || null,
    video: req.query.video || null,
    post: req.query.post || null,
    placement: req.query.pos || req.query.placement || null,
    referrer,
    user_agent: userAgent || null,
    ip_hash: ip ? hashIp(ip) : null,
    country,
    region,
    city,
    timezone,
    device_type: ua.device_type,
    browser: ua.browser,
    os: ua.os,
    is_bot: isLikelyBot(userAgent),
    query_params: req.query,
    destination_url: destination,
    edge_runtime: "render"
  };

  // Registro assíncrono: não prende o redirecionamento.
  supabase
    .from("click_events")
    .insert(clickPayload)
    .then(({ error: insertError }) => {
      if (insertError) console.error("Erro ao salvar clique:", insertError.message);
    })
    .catch((insertError) => {
      console.error("Erro ao salvar clique:", insertError.message);
    });

  res.setHeader("Cache-Control", "no-store");
  return res.redirect(302, destination);
});

app.listen(PORT, () => {
  console.log(`ZapFatri rodando na porta ${PORT}`);
});
