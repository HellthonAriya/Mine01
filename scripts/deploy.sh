#!/usr/bin/env bash
# ===========================================================================
#  کافهٔ دمسا — اسکریپت استقرار (Ubuntu/Debian)
#  نصبِ Node + Nginx، اجرای سرورِ سایت (server.js) به‌صورتِ سرویس و قراردادنِ
#  Nginx به‌عنوانِ reverse-proxy روی پورت ۸۰ (و SSL برای دامنه).
#  سایت با IP بالا می‌آید و پنلِ مدیریت روی /admin در دسترس است.
#
#  استفاده:
#    sudo bash deploy.sh                                 # فقط با IP
#    sudo bash deploy.sh example.com                     # دامنه + SSL
#    sudo bash deploy.sh example.com you@mail            # + ایمیل
#    sudo bash deploy.sh example.com you@mail رمزِ‌ادمین  # + رمزِ پنل
#
#  نکته: پیکربندیِ Nginx را خودِ این اسکریپت می‌سازد (certonly) تا دسترسی با
#  IP روی HTTP حفظ شود و دامنه روی HTTPS برود — حتی بعد از گرفتنِ گواهی.
# ===========================================================================
set -euo pipefail

REPO_URL="https://github.com/HellthonAriya/Mine01.git"
BRANCH="claude/wizardly-feynman-nc1fzn"
APP_DIR="/var/www/damsa"
SITE="damsa"
PORT="3000"
ENV_FILE="/etc/damsa.env"
DOMAIN="${1:-}"
EMAIL="${2:-}"
PASS_ARG="${3:-}"

# اگر دامنه پاس داده نشده (مثلاً اجرای خودکار/self-heal از طریقِ update.sh)،
# اگر قبلاً برای یک دامنه گواهیِ SSL گرفته شده، همان را نگه دار تا با اجرای
# بدونِ‌دامنه‌ی این اسکریپت، تنظیماتِ HTTPSِ موجود پاک/بازنویسی نشود.
if [ -z "${DOMAIN}" ]; then
  EXISTING_DOMAIN="$(find /etc/letsencrypt/live -mindepth 1 -maxdepth 1 -type d ! -name 'README' -printf '%f\n' 2>/dev/null | head -n1)"
  if [ -n "${EXISTING_DOMAIN}" ]; then
    DOMAIN="${EXISTING_DOMAIN}"
  fi
fi

say() { printf "\033[1;33m▸ %s\033[0m\n" "$*"; }

if [ "$(id -u)" -ne 0 ]; then
  echo "این اسکریپت باید با sudo/root اجرا شود." >&2
  exit 1
fi

say "نصب پیش‌نیازها (nginx, git, curl)…"
export DEBIAN_FRONTEND=noninteractive
apt-get update -y -qq
apt-get install -y -qq nginx git curl ca-certificates

# --- Node: اگر نبود یا خیلی قدیمی بود (EOL)، از NodeSource نسخهٔ LTS نصب کن ---
# دیستروهای قدیمیِ Ubuntu/Debian معمولاً Node v12 (که از سال ۲۰۲۲ پشتیبانی نمی‌شود)
# را با apt نصب می‌کنند؛ همین نسخهٔ خیلی قدیمی باعثِ ناپایداریِ سرویس می‌شود.
NODE_BIN="$(command -v node || command -v nodejs || true)"
NODE_MAJOR=0
if [ -n "${NODE_BIN}" ]; then
  NODE_MAJOR="$(${NODE_BIN} -v 2>/dev/null | sed -E 's/^v([0-9]+).*/\1/')"
fi
case "${NODE_MAJOR}" in ''|*[!0-9]*) NODE_MAJOR=0 ;; esac
if [ -z "${NODE_BIN}" ] || [ "${NODE_MAJOR}" -lt 18 ]; then
  say "نصب/ارتقاءِ Node به نسخهٔ LTS (۲۰.x) از NodeSource…"
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash - >/dev/null 2>&1
  apt-get install -y -qq nodejs
  NODE_BIN="$(command -v node || command -v nodejs)"
fi
say "Node: ${NODE_BIN} ($(${NODE_BIN} -v 2>/dev/null || echo '?'))"

say "دریافت سورس سایت در ${APP_DIR}…"
git config --global --add safe.directory "${APP_DIR}" 2>/dev/null || true
if [ -d "${APP_DIR}/.git" ]; then
  git -C "${APP_DIR}" fetch origin "${BRANCH}" --quiet
  git -C "${APP_DIR}" reset --hard "origin/${BRANCH}" --quiet
else
  rm -rf "${APP_DIR}"
  git clone --quiet -b "${BRANCH}" "${REPO_URL}" "${APP_DIR}"
fi
chown -R www-data:www-data "${APP_DIR}"

# --- فایلِ پیکربندیِ سرویس (رمزِ پنل اینجا نگه داشته می‌شود) ----------------
if [ -f "${ENV_FILE}" ]; then
  say "فایلِ تنظیماتِ موجود حفظ شد (${ENV_FILE})."
  # شاید کاربر رمزِ جدید داده باشد → به‌روزرسانی
  if [ -n "${PASS_ARG}" ]; then
    sed -i "s|^DAMSA_PASSWORD=.*|DAMSA_PASSWORD=${PASS_ARG}|" "${ENV_FILE}"
    say "رمزِ پنل به‌روزرسانی شد."
  fi
else
  PASS="${PASS_ARG:-damsa-admin}"
  cat > "${ENV_FILE}" <<EOF
DAMSA_PORT=${PORT}
DAMSA_DIR=${APP_DIR}
DAMSA_PASSWORD=${PASS}
EOF
  chmod 600 "${ENV_FILE}"
fi
ADMIN_PASS="$(grep '^DAMSA_PASSWORD=' "${ENV_FILE}" | cut -d= -f2-)"

# --- سرویسِ systemd --------------------------------------------------------
say "ساختِ سرویسِ damsa…"
cat > "/etc/systemd/system/damsa.service" <<EOF
[Unit]
Description=Damsa Cafe site (Node)
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=${APP_DIR}
EnvironmentFile=${ENV_FILE}
ExecStart=${NODE_BIN} ${APP_DIR}/server.js
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF
systemctl daemon-reload
systemctl enable damsa >/dev/null 2>&1 || true
systemctl restart damsa

# --- بررسی سلامتِ سرویس پیش از دست‌زدن به Nginx ----------------------------
# تا اگر Node بالا نیامد، Nginx دست‌نخورده بماند و سایتِ فعلی پایین نیاید (502).
say "بررسی سلامتِ سرویس روی 127.0.0.1:${PORT}…"
HEALTHY=0
for _ in $(seq 1 20); do
  if (exec 3<>/dev/tcp/127.0.0.1/${PORT}) 2>/dev/null; then exec 3>&- 3<&- 2>/dev/null || true; HEALTHY=1; break; fi
  sleep 1
done
if [ "${HEALTHY}" -ne 1 ]; then
  say "خطا: سرویسِ damsa روی پورت ${PORT} پاسخ نداد؛ Nginx تغییر نکرد تا سایت پایین نیاید."
  echo "   ── ۳۰ خطِ آخرِ لاگ ──"
  journalctl -u damsa -n 30 --no-pager 2>/dev/null || true
  echo "   پس از رفعِ مشکل، دوباره اجرا کن:  sudo bash ${APP_DIR}/scripts/deploy.sh"
  exit 1
fi
say "سرویس سالم است ✓"

# --- بدنهٔ مشترکِ Nginx (reverse-proxy به Node) -----------------------------
read -r -d '' SITE_BODY <<EOF || true
    location / {
        proxy_pass http://127.0.0.1:${PORT};
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    gzip on;
    gzip_comp_level 5;
    gzip_proxied any;
    gzip_types text/css application/javascript image/svg+xml application/json;
EOF

write_http_only() {
  cat > "/etc/nginx/sites-available/${SITE}" <<EOF
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;
${SITE_BODY}
}
EOF
}

write_https() {
  local names="$1"
  cat > "/etc/nginx/sites-available/${SITE}" <<EOF
server {
    listen 443 ssl;
    listen [::]:443 ssl;
    server_name ${names};

    ssl_certificate /etc/letsencrypt/live/${DOMAIN}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${DOMAIN}/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1d;
${SITE_BODY}
}

server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;

    if (\$host ~* ^(www\.)?${DOMAIN//./\\.}\$) { return 301 https://${DOMAIN}\$request_uri; }
${SITE_BODY}
}
EOF
}

say "ساختِ پیکربندیِ Nginx…"
write_http_only
ln -sf "/etc/nginx/sites-available/${SITE}" "/etc/nginx/sites-enabled/${SITE}"
rm -f /etc/nginx/sites-enabled/default
rm -f /etc/nginx/sites-enabled/damsa-fix-http /etc/nginx/sites-available/damsa-fix-http
rm -f /etc/nginx/sites-enabled/damsa-ip /etc/nginx/sites-available/damsa-ip

say "بازکردن پورت‌ها در فایروال (در صورت فعال‌بودن)…"
ufw allow 'Nginx Full' >/dev/null 2>&1 || true
ufw allow 80/tcp        >/dev/null 2>&1 || true
ufw allow 443/tcp       >/dev/null 2>&1 || true

say "اعتبارسنجی و بارگذاری Nginx…"
nginx -t
systemctl enable nginx >/dev/null 2>&1 || true
systemctl restart nginx

if [ -n "${DOMAIN}" ]; then
  say "نصبِ Certbot و گرفتنِ گواهیِ SSL برای ${DOMAIN}…"
  apt-get install -y -qq certbot python3-certbot-nginx || true
  CERT_PATH="/etc/letsencrypt/live/${DOMAIN}/fullchain.pem"
  if [ ! -f "${CERT_PATH}" ]; then
    EMAIL_ARG="--register-unsafely-without-email"
    [ -n "${EMAIL}" ] && EMAIL_ARG="--email ${EMAIL}"
    SSL_NAMES="${DOMAIN}"
    if certbot certonly --nginx -d "${DOMAIN}" -d "www.${DOMAIN}" \
         --non-interactive --agree-tos ${EMAIL_ARG} 2>/dev/null; then
      SSL_NAMES="${DOMAIN} www.${DOMAIN}"
    elif certbot certonly --nginx -d "${DOMAIN}" \
         --non-interactive --agree-tos ${EMAIL_ARG} 2>/dev/null; then
      say "گواهیِ www گرفته نشد (DNSِ www تنظیم نیست)؛ فقط ${DOMAIN} روی SSL رفت."
    else
      say "هشدار: SSL گرفته نشد. مطمئن شو رکورد A دامنه به IP این سرور اشاره می‌کند، سپس دوباره اجرا کن."
    fi
  else
    say "گواهیِ SSL موجود است — certbot دوباره اجرا نمی‌شود."
    SSL_NAMES="${DOMAIN}"
  fi
  if [ -f "${CERT_PATH}" ]; then
    say "نوشتنِ پیکربندیِ نهاییِ HTTPS…"
    write_https "${SSL_NAMES}"
    nginx -t && systemctl restart nginx
    systemctl enable certbot.timer >/dev/null 2>&1 || true
  fi
fi

echo
say "نصب کامل شد ✓"
IP="$(hostname -I 2>/dev/null | awk '{print $1}')"
if [ -n "${DOMAIN}" ] && [ -f "/etc/letsencrypt/live/${DOMAIN}/fullchain.pem" ]; then
  BASE="https://${DOMAIN}"
  echo "   دامنه:  ${BASE}"
  echo "   با IP:  http://${IP:-<IP-سرور>}"
else
  BASE="http://${IP:-<IP-سرور>}"
  echo "   آدرس:  ${BASE}"
fi
echo "   صفحهٔ انتخابِ قالب:  ${BASE}/"
echo "   کافه:      ${BASE}/cafe/        · پنل: ${BASE}/cafe/admin"
echo "   رستوران:   ${BASE}/restaurant/  · پنل: ${BASE}/restaurant/admin"
echo "   کیهان:     ${BASE}/cosmos/      · پنل: ${BASE}/cosmos/admin"
echo "   رمزِ هر دو پنل:  ${ADMIN_PASS}"
echo "   (رمز در ${ENV_FILE} ذخیره شده؛ برای تغییر، آن را ویرایش و سرویس را restart کن.)"
echo "   برای آپدیت بعدی:  sudo bash ${APP_DIR}/scripts/update.sh"
