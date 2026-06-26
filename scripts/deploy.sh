#!/usr/bin/env bash
# ===========================================================================
#  کافهٔ دمسا — اسکریپت استقرار (Ubuntu/Debian)
#  نصبِ Nginx، انتشارِ سایت روی پورت ۸۰ (فقط با IP) و در صورت دادنِ دامین، SSL.
#
#  استفاده:
#    sudo bash deploy.sh                      # فقط با IP سرور
#    sudo bash deploy.sh example.com          # دامنه + SSL (بدون ایمیل)
#    sudo bash deploy.sh example.com you@mail # دامنه + SSL + ایمیل
#
#  نکته: پیکربندیِ Nginx را خودِ این اسکریپت می‌سازد و به Certbot اجازهٔ
#  دست‌کاریِ آن را نمی‌دهد (certonly). به‌این‌ترتیب دسترسی با IP روی HTTP
#  حفظ می‌شود و دامنه روی HTTPS بالا می‌آید — حتی بعد از گرفتنِ گواهی.
# ===========================================================================
set -euo pipefail

REPO_URL="https://github.com/HellthonAriya/Mine01.git"
BRANCH="claude/wizardly-feynman-nc1fzn"
APP_DIR="/var/www/damsa"
SITE="damsa"
DOMAIN="${1:-}"
EMAIL="${2:-}"

say() { printf "\033[1;33m▸ %s\033[0m\n" "$*"; }

if [ "$(id -u)" -ne 0 ]; then
  echo "این اسکریپت باید با sudo/root اجرا شود." >&2
  exit 1
fi

say "نصب پیش‌نیازها (nginx, git)…"
export DEBIAN_FRONTEND=noninteractive
apt-get update -y -qq
apt-get install -y -qq nginx git

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

# --- بلوک‌های مشترکِ پیکربندی ----------------------------------------------
read -r -d '' SITE_BODY <<EOF || true
    root ${APP_DIR};
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # کشِ دارایی‌های ایستا
    location ~* \.(css|js|svg|woff2?|ttf|png|jpe?g|webp|ico)\$ {
        expires 7d;
        add_header Cache-Control "public, max-age=604800";
    }

    gzip on;
    gzip_comp_level 5;
    gzip_types text/css application/javascript image/svg+xml application/json;
EOF

# پیکربندیِ HTTP-only (همیشه ساخته می‌شود؛ IP را روی پورت ۸۰ سرو می‌کند)
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

# پیکربندیِ نهاییِ HTTPS: ۴۴۳ برای دامنه + ۸۰ که هم IP را سرو می‌کند هم دامنه را
# به HTTPS هدایت می‌کند. (Certbot به این فایل دست نمی‌زند.)
write_https() {
  local names="$1"   # مثلاً: "example.com www.example.com"
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

    # دامنه را به HTTPS بفرست؛ IP روی HTTP باقی می‌ماند.
    if (\$host ~* ^(www\.)?${DOMAIN//./\\.}\$) { return 301 https://${DOMAIN}\$request_uri; }
${SITE_BODY}
}
EOF
}

say "ساخت پیکربندی Nginx (HTTP)…"
write_http_only
ln -sf "/etc/nginx/sites-available/${SITE}" "/etc/nginx/sites-enabled/${SITE}"
rm -f /etc/nginx/sites-enabled/default

say "بازکردن پورت‌ها در فایروال (در صورت فعال‌بودن)…"
ufw allow 'Nginx Full' >/dev/null 2>&1 || true
ufw allow 80/tcp        >/dev/null 2>&1 || true
ufw allow 443/tcp       >/dev/null 2>&1 || true

say "اعتبارسنجی و بارگذاری Nginx…"
nginx -t
systemctl enable nginx >/dev/null 2>&1 || true
systemctl restart nginx

if [ -n "${DOMAIN}" ]; then
  say "نصب Certbot و گرفتنِ گواهی SSL برای ${DOMAIN}…"
  apt-get install -y -qq certbot python3-certbot-nginx
  EMAIL_ARG="--register-unsafely-without-email"
  [ -n "${EMAIL}" ] && EMAIL_ARG="--email ${EMAIL}"

  # فقط گواهی را می‌گیریم (certonly) و اجازه نمی‌دهیم Certbot پیکربندی را تغییر دهد.
  # ابتدا با www؛ اگر DNSِ www تنظیم نباشد، فقط دامنهٔ اصلی.
  SSL_NAMES="${DOMAIN}"
  if certbot certonly --nginx -d "${DOMAIN}" -d "www.${DOMAIN}" \
       --non-interactive --agree-tos ${EMAIL_ARG} 2>/dev/null; then
    SSL_NAMES="${DOMAIN} www.${DOMAIN}"
  elif certbot certonly --nginx -d "${DOMAIN}" \
       --non-interactive --agree-tos ${EMAIL_ARG}; then
    SSL_NAMES="${DOMAIN}"
    say "گواهیِ www گرفته نشد (DNSِ www تنظیم نیست)؛ فقط ${DOMAIN} روی SSL رفت."
  else
    say "هشدار: SSL گرفته نشد. مطمئن شو رکورد A دامنه به IP این سرور اشاره می‌کند، سپس دوباره اجرا کن."
  fi

  if [ -f "/etc/letsencrypt/live/${DOMAIN}/fullchain.pem" ]; then
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
  echo "   دامنه:  https://${DOMAIN}"
  echo "   با IP:  http://${IP:-<IP-سرور>}"
else
  echo "   آدرس:  http://${IP:-<IP-سرور>}"
fi
echo "   برای آپدیت بعدی:  sudo bash ${APP_DIR}/scripts/update.sh"
