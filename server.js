/* ===========================================================================
   کافهٔ دمسا · سرورِ سبک (بدونِ وابستگی)
   - فایل‌های ایستا را سرو می‌کند (سایت + پنلِ ادمین)
   - GET  /api/content      محتوای فعلی (عمومی)
   - POST /api/login        ورودِ ادمین با رمز → توکن
   - PUT  /api/content      ذخیرهٔ محتوا (نیازمندِ توکن)
   فقط با ماژول‌های داخلیِ Node نوشته شده؛ نیازی به npm install نیست.

   پیکربندی از طریقِ متغیرهای محیطی:
     DAMSA_PORT      (پیش‌فرض 3000)
     DAMSA_PASSWORD  رمزِ ورودِ ادمین (پیش‌فرض: damsa-admin)
     DAMSA_DIR       مسیرِ فایل‌های سایت (پیش‌فرض: همین پوشه)
   =========================================================================== */
"use strict";

const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ROOT = process.env.DAMSA_DIR || __dirname;
const PORT = parseInt(process.env.DAMSA_PORT || "3000", 10);
const PASSWORD = process.env.DAMSA_PASSWORD || "damsa-admin";
const CONTENT_FILE = path.join(ROOT, "content.json");
const MAX_BODY = 2 * 1024 * 1024; // ۲ مگابایت سقفِ بدنه

/* ----------------------------- توکن (امضاشده) ----------------------------- */
const SECRET = crypto.createHash("sha256").update("damsa::" + PASSWORD).digest("hex");

function makeToken() {
  const exp = Date.now() + 7 * 24 * 3600 * 1000; // ۷ روز اعتبار
  const payload = "v1." + exp;
  const sig = crypto.createHmac("sha256", SECRET).update(payload).digest("hex").slice(0, 32);
  return payload + "." + sig;
}
function validToken(tok) {
  if (!tok || typeof tok !== "string") return false;
  const parts = tok.split(".");
  if (parts.length !== 3) return false;
  const [v, exp, sig] = parts;
  const payload = v + "." + exp;
  const want = crypto.createHmac("sha256", SECRET).update(payload).digest("hex").slice(0, 32);
  if (sig.length !== want.length) return false;
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(want))) return false;
  return Date.now() < parseInt(exp, 10);
}

/* ----------------------------- کمک‌ها ----------------------------- */
const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
  ".webp": "image/webp", ".ico": "image/x-icon", ".woff": "font/woff",
  ".woff2": "font/woff2", ".ttf": "font/ttf", ".map": "application/json",
};

function send(res, code, body, headers) {
  res.writeHead(code, Object.assign({ "Cache-Control": "no-store" }, headers || {}));
  res.end(body);
}
function sendJson(res, code, obj) {
  send(res, code, JSON.stringify(obj), { "Content-Type": "application/json; charset=utf-8" });
}

function readBody(req, cb) {
  let size = 0; const chunks = [];
  req.on("data", (c) => {
    size += c.length;
    if (size > MAX_BODY) { req.destroy(); return; }
    chunks.push(c);
  });
  req.on("end", () => cb(null, Buffer.concat(chunks).toString("utf8")));
  req.on("error", (e) => cb(e));
}

function bearer(req) {
  const h = req.headers["authorization"] || "";
  return h.startsWith("Bearer ") ? h.slice(7).trim() : "";
}

/* نوشتنِ اتمیک تا فایل خراب نشود */
function writeContentAtomic(text) {
  const tmp = CONTENT_FILE + ".tmp";
  fs.writeFileSync(tmp, text, "utf8");
  fs.renameSync(tmp, CONTENT_FILE);
}

/* جلوگیری از خروج از ریشه */
function safePath(urlPath) {
  const clean = decodeURIComponent(urlPath.split("?")[0]).replace(/\0/g, "");
  let rel = path.normalize(clean).replace(/^(\.\.[/\\])+/, "");
  if (rel === "/" || rel === "") rel = "/index.html";
  const full = path.join(ROOT, rel);
  if (!full.startsWith(ROOT)) return null;
  return full;
}

/* ----------------------------- سرور ----------------------------- */
const server = http.createServer((req, res) => {
  const url = req.url || "/";

  // --- API ---
  if (url === "/api/content" && req.method === "GET") {
    fs.readFile(CONTENT_FILE, "utf8", (err, data) => {
      if (err) return sendJson(res, 200, {}); // هنوز محتوایی ذخیره نشده
      send(res, 200, data, { "Content-Type": "application/json; charset=utf-8" });
    });
    return;
  }

  if (url === "/api/login" && req.method === "POST") {
    readBody(req, (e, body) => {
      if (e) return sendJson(res, 400, { error: "bad_request" });
      let pw = "";
      try { pw = (JSON.parse(body || "{}").password || ""); } catch (_) {}
      const ok = pw.length === PASSWORD.length &&
        crypto.timingSafeEqual(Buffer.from(pw), Buffer.from(PASSWORD));
      if (!ok) return sendJson(res, 401, { error: "wrong_password" });
      sendJson(res, 200, { token: makeToken() });
    });
    return;
  }

  if (url === "/api/content" && req.method === "PUT") {
    if (!validToken(bearer(req))) return sendJson(res, 401, { error: "unauthorized" });
    readBody(req, (e, body) => {
      if (e) return sendJson(res, 400, { error: "bad_request" });
      let obj;
      try { obj = JSON.parse(body); } catch (_) { return sendJson(res, 400, { error: "invalid_json" }); }
      if (!obj || typeof obj !== "object" || Array.isArray(obj)) {
        return sendJson(res, 400, { error: "invalid_shape" });
      }
      try { writeContentAtomic(JSON.stringify(obj, null, 2)); }
      catch (err) { return sendJson(res, 500, { error: "write_failed" }); }
      sendJson(res, 200, { ok: true });
    });
    return;
  }

  if (url.startsWith("/api/")) return sendJson(res, 404, { error: "not_found" });

  // --- مسیرِ پنلِ مدیریت: /admin → admin.html ---
  const pathOnly = url.split("?")[0];
  if (pathOnly === "/admin" || pathOnly === "/admin/") {
    return fs.readFile(path.join(ROOT, "admin.html"), (e, d) =>
      e ? send(res, 404, "Not Found") : send(res, 200, d, { "Content-Type": MIME[".html"] }));
  }

  // --- فایل‌های ایستا ---
  if (req.method !== "GET" && req.method !== "HEAD") {
    return send(res, 405, "Method Not Allowed");
  }
  let file = safePath(url);
  if (!file) return send(res, 403, "Forbidden");

  fs.stat(file, (err, st) => {
    if (!err && st.isDirectory()) file = path.join(file, "index.html");
    fs.readFile(file, (err2, data) => {
      if (err2) {
        // برگشت به index.html برای مسیرهای SPA‌مانند (به‌جز دارایی‌ها)
        if (!path.extname(file)) {
          return fs.readFile(path.join(ROOT, "index.html"), (e3, d3) =>
            e3 ? send(res, 404, "Not Found") : send(res, 200, d3, { "Content-Type": MIME[".html"] }));
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
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`دمسا روی http://127.0.0.1:${PORT} اجرا شد (ریشه: ${ROOT})`);
});
