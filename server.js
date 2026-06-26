/* ===========================================================================
   دمسا · سرورِ سبکِ چندقالبی (بدونِ وابستگی)
   - صفحهٔ انتخابِ قالب در /  (index.html ریشه)
   - هر قالب زیرِ مسیرِ خودش:  /cafe/  و  /restaurant/
   - برای هر قالب جداگانه:
       GET  /<site>/api/content     محتوا (عمومی)
       POST /<site>/api/login       ورود با رمز → توکن
       PUT  /<site>/api/content     ذخیرهٔ محتوا (توکن لازم)
       POST /<site>/api/upload      آپلودِ عکس (توکن لازم)
   فقط با ماژول‌های داخلیِ Node؛ نیازی به npm install نیست.

   پیکربندی (متغیرهای محیطی):
     DAMSA_PORT (3000) · DAMSA_PASSWORD (damsa-admin) · DAMSA_DIR (همین پوشه)
   =========================================================================== */
"use strict";

const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ROOT = process.env.DAMSA_DIR || __dirname;
const PORT = parseInt(process.env.DAMSA_PORT || "3000", 10);
const PASSWORD = process.env.DAMSA_PASSWORD || "damsa-admin";
const MAX_BODY = 2 * 1024 * 1024;     // ۲MB سقفِ JSON
const MAX_UPLOAD = 8 * 1024 * 1024;   // ۸MB سقفِ آپلودِ عکس
const IMG_EXT = { "image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp", "image/gif": ".gif" };

const SITES = { cafe: path.join(ROOT, "cafe"), restaurant: path.join(ROOT, "restaurant") };

/* ----------------------------- توکن (امضاشده) ----------------------------- */
const SECRET = crypto.createHash("sha256").update("damsa::" + PASSWORD).digest("hex");
function makeToken() {
  const exp = Date.now() + 7 * 24 * 3600 * 1000;
  const payload = "v1." + exp;
  const sig = crypto.createHmac("sha256", SECRET).update(payload).digest("hex").slice(0, 32);
  return payload + "." + sig;
}
function validToken(tok) {
  if (!tok || typeof tok !== "string") return false;
  const parts = tok.split("."); if (parts.length !== 3) return false;
  const payload = parts[0] + "." + parts[1];
  const want = crypto.createHmac("sha256", SECRET).update(payload).digest("hex").slice(0, 32);
  if (parts[2].length !== want.length) return false;
  if (!crypto.timingSafeEqual(Buffer.from(parts[2]), Buffer.from(want))) return false;
  return Date.now() < parseInt(parts[1], 10);
}

/* ----------------------------- کمک‌ها ----------------------------- */
const MIME = {
  ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8", ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
  ".webp": "image/webp", ".gif": "image/gif", ".ico": "image/x-icon",
  ".woff": "font/woff", ".woff2": "font/woff2", ".ttf": "font/ttf", ".map": "application/json",
};
function send(res, code, body, headers) {
  res.writeHead(code, Object.assign({ "Cache-Control": "no-store" }, headers || {}));
  res.end(body);
}
function sendJson(res, code, obj) { send(res, code, JSON.stringify(obj), { "Content-Type": "application/json; charset=utf-8" }); }
function bearer(req) { const h = req.headers["authorization"] || ""; return h.startsWith("Bearer ") ? h.slice(7).trim() : ""; }
function readBody(req, cb) {
  let size = 0; const chunks = [];
  req.on("data", (c) => { size += c.length; if (size > MAX_BODY) { req.destroy(); return; } chunks.push(c); });
  req.on("end", () => cb(null, Buffer.concat(chunks).toString("utf8")));
  req.on("error", (e) => cb(e));
}
function writeAtomic(file, text) { const tmp = file + ".tmp"; fs.writeFileSync(tmp, text, "utf8"); fs.renameSync(tmp, file); }
function safeJoin(base, rel) {
  const clean = decodeURIComponent(rel.split("?")[0]).replace(/\0/g, "");
  let r = path.normalize(clean).replace(/^(\.\.[/\\])+/, "");
  if (r === "/" || r === "") r = "/index.html";
  const full = path.join(base, r);
  return full.startsWith(base) ? full : null;
}
function serveStatic(req, res, baseDir, rel, spaFallback) {
  let file = safeJoin(baseDir, rel);
  if (!file) return send(res, 403, "Forbidden");
  fs.stat(file, (err, st) => {
    if (!err && st.isDirectory()) file = path.join(file, "index.html");
    fs.readFile(file, (e2, data) => {
      if (e2) {
        if (!path.extname(file) && spaFallback) {
          return fs.readFile(spaFallback, (e3, d3) => e3 ? send(res, 404, "Not Found") : send(res, 200, d3, { "Content-Type": MIME[".html"] }));
        }
        return send(res, 404, "Not Found");
      }
      const ext = path.extname(file).toLowerCase();
      const type = MIME[ext] || "application/octet-stream";
      const cache = ext === ".html" ? "no-store" : "public, max-age=604800";
      res.writeHead(200, { "Content-Type": type, "Cache-Control": cache });
      res.end(req.method === "HEAD" ? undefined : data);
    });
  });
}

/* ----------------------------- API هر قالب ----------------------------- */
function handleApi(req, res, siteDir, rest) {
  if (rest === "/api/content" && req.method === "GET") {
    return fs.readFile(path.join(siteDir, "content.json"), "utf8", (err, data) =>
      err ? sendJson(res, 200, {}) : send(res, 200, data, { "Content-Type": "application/json; charset=utf-8" }));
  }
  if (rest === "/api/login" && req.method === "POST") {
    return readBody(req, (e, body) => {
      if (e) return sendJson(res, 400, { error: "bad_request" });
      let pw = ""; try { pw = JSON.parse(body || "{}").password || ""; } catch (_) {}
      const ok = pw.length === PASSWORD.length && crypto.timingSafeEqual(Buffer.from(pw), Buffer.from(PASSWORD));
      return ok ? sendJson(res, 200, { token: makeToken() }) : sendJson(res, 401, { error: "wrong_password" });
    });
  }
  if (rest === "/api/content" && req.method === "PUT") {
    if (!validToken(bearer(req))) return sendJson(res, 401, { error: "unauthorized" });
    return readBody(req, (e, body) => {
      if (e) return sendJson(res, 400, { error: "bad_request" });
      let obj; try { obj = JSON.parse(body); } catch (_) { return sendJson(res, 400, { error: "invalid_json" }); }
      if (!obj || typeof obj !== "object" || Array.isArray(obj)) return sendJson(res, 400, { error: "invalid_shape" });
      try { writeAtomic(path.join(siteDir, "content.json"), JSON.stringify(obj, null, 2)); }
      catch (_) { return sendJson(res, 500, { error: "write_failed" }); }
      return sendJson(res, 200, { ok: true });
    });
  }
  if (rest === "/api/upload" && req.method === "POST") {
    if (!validToken(bearer(req))) return sendJson(res, 401, { error: "unauthorized" });
    const ct = (req.headers["content-type"] || "").split(";")[0].trim();
    const ext = IMG_EXT[ct];
    if (!ext) return sendJson(res, 400, { error: "unsupported_type" });
    let size = 0; const chunks = []; let aborted = false;
    req.on("data", (c) => { size += c.length; if (size > MAX_UPLOAD) { aborted = true; req.destroy(); return; } chunks.push(c); });
    req.on("end", () => {
      if (aborted) return;
      const dir = path.join(siteDir, "uploads");
      try { fs.mkdirSync(dir, { recursive: true }); } catch (_) {}
      const name = "img_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8) + ext;
      try { fs.writeFileSync(path.join(dir, name), Buffer.concat(chunks)); }
      catch (_) { return sendJson(res, 500, { error: "write_failed" }); }
      return sendJson(res, 200, { url: "uploads/" + name });   // نسبی تا زیرِ /<site>/ درست شود
    });
    req.on("error", () => { if (!aborted) sendJson(res, 400, { error: "bad_request" }); });
    return;
  }
  return sendJson(res, 404, { error: "not_found" });
}

/* ----------------------------- سرور ----------------------------- */
const server = http.createServer((req, res) => {
  const u = (req.url || "/").split("?")[0];
  const method = req.method || "GET";

  // سازگاریِ عقب‌رو: مسیرهای قدیمیِ تک‌قالبی → کافه
  if (u === "/admin" || u === "/admin/") return send(res, 302, "", { Location: "/cafe/admin" });

  // ریشه: صفحهٔ انتخابِ قالب
  if (u === "/") return serveStatic(req, res, ROOT, "/index.html");

  const seg = u.split("/").filter(Boolean);
  const site = seg[0];
  if (SITES[site]) {
    const siteDir = SITES[site];
    const rest = "/" + seg.slice(1).join("/");
    if (u === "/" + site) return send(res, 301, "", { Location: "/" + site + "/" });
    if (rest.startsWith("/api/")) {
      if (method !== "GET" && method !== "POST" && method !== "PUT") return send(res, 405, "Method Not Allowed");
      return handleApi(req, res, siteDir, rest);
    }
    if (rest === "/admin" || rest === "/admin/") {
      return fs.readFile(path.join(siteDir, "admin.html"), (e, d) =>
        e ? send(res, 404, "Not Found") : send(res, 200, d, { "Content-Type": MIME[".html"] }));
    }
    if (method !== "GET" && method !== "HEAD") return send(res, 405, "Method Not Allowed");
    return serveStatic(req, res, siteDir, rest, path.join(siteDir, "index.html"));
  }

  // فایل‌های ایستای ریشه (دارایی‌های صفحهٔ انتخاب)
  if (method !== "GET" && method !== "HEAD") return send(res, 405, "Method Not Allowed");
  return serveStatic(req, res, ROOT, u);
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`دمسا (چندقالبی) روی http://127.0.0.1:${PORT} اجرا شد — ریشه: ${ROOT}`);
});
