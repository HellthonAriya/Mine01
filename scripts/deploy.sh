#!/usr/bin/env bash
# ===========================================================================
#  کافهٔ دمسا — اسکریپت استقرار (Ubuntu/Debian)
#  نصبِ Nginx، انتشارِ سایت روی پورت ۸۰ (فقط با IP) و در صورت دادنِ دامین، SSL.
#
#  استفاده:
#    sudo bash deploy.sh                      # فقط با IP سرور
#    sudo bash deploy.sh example.com          # دامنه + SSL (بدون ایمیل)
#    sudo bash deploy.sh example.com you@mail # دامنه + SSL + ایمیل
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
if [ -d "${APP_DIR}/.git" ]; then
  git -C "${APP_DIR}" fetch origin "${BRANCH}" --quiet
  git -C "${APP_DIR}" reset --hard "origin/${BRANCH}" --quiet
else
  rm -rf "${APP_DIR}"
  git clone --quiet -b "${BRANCH}" "${REPO_URL}" "${APP_DIR}"
fi
chown -R www-data:www-data "${APP_DIR}"

say "ساخت پیکربندی Nginx…"
SERVER_NAME="_"
[ -n "${DOMAIN}" ] && SERVER_NAME="${DOMAIN} www.${DOMAIN}"

cat > "/etc/nginx/sites-available/${SITE}" <<EOF
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name ${SERVER_NAME};

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
}
EOF

ln -sf "/etc/nginx/sites-available/${SITE}" "/etc/nginx/sites-enabled/${SITE}"
rm -f /etc/nginx/sites-enabled/default

say "بازکردن پورت‌ها در فایروال (در صورت فعال‌بودن)…"
ufw allow 'Nginx Full' >/dev/null 2>&1 || true

say "اعتبارسنجی و بارگذاری Nginx…"
nginx -t
systemctl enable nginx >/dev/null 2>&1 || true
systemctl reload nginx

if [ -n "${DOMAIN}" ]; then
  say "نصب Certbot و گرفتن گواهی SSL برای ${DOMAIN}…"
  apt-get install -y -qq certbot python3-certbot-nginx
  EMAIL_ARG="--register-unsafely-without-email"
  [ -n "${EMAIL}" ] && EMAIL_ARG="--email ${EMAIL}"
  # ابتدا با www؛ اگر DNSِ www تنظیم نباشد، فقط دامنهٔ اصلی.
  if ! certbot --nginx -d "${DOMAIN}" -d "www.${DOMAIN}" --non-interactive --agree-tos --redirect ${EMAIL_ARG}; then
    say "گرفتن گواهی برای www ناموفق بود؛ تلاش فقط برای ${DOMAIN}…"
    certbot --nginx -d "${DOMAIN}" --non-interactive --agree-tos --redirect ${EMAIL_ARG} \
      || say "هشدار: SSL گرفته نشد. مطمئن شو رکورد A دامنه به IP این سرور اشاره می‌کند، سپس دوباره اجرا کن."
  fi
  # تمدیدِ خودکار با تایمر سیستم‌دی فعال است.
  systemctl enable certbot.timer >/dev/null 2>&1 || true
fi

echo
say "نصب کامل شد ✓"
if [ -n "${DOMAIN}" ]; then
  echo "   آدرس: https://${DOMAIN}"
else
  IP="$(hostname -I 2>/dev/null | awk '{print $1}')"
  echo "   آدرس: http://${IP:-<IP-سرور>}"
fi
echo "   برای آپدیت بعدی:  sudo bash ${APP_DIR}/scripts/update.sh"
