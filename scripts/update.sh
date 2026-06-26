#!/usr/bin/env bash
# ===========================================================================
#  کافهٔ دمسا — اسکریپت آپدیت
#  آخرین تغییرات را می‌گیرد و Nginx را دوباره بارگذاری می‌کند.
#    sudo bash update.sh
# ===========================================================================
set -euo pipefail

BRANCH="claude/wizardly-feynman-nc1fzn"
APP_DIR="/var/www/damsa"

say() { printf "\033[1;33m▸ %s\033[0m\n" "$*"; }

if [ "$(id -u)" -ne 0 ]; then
  echo "این اسکریپت باید با sudo/root اجرا شود." >&2
  exit 1
fi

if [ ! -d "${APP_DIR}/.git" ]; then
  echo "سایت در ${APP_DIR} نصب نشده. اول deploy.sh را اجرا کن." >&2
  exit 1
fi

say "دریافت آخرین تغییرات…"
git config --global --add safe.directory "${APP_DIR}" 2>/dev/null || true
git -C "${APP_DIR}" fetch origin "${BRANCH}" --quiet
git -C "${APP_DIR}" reset --hard "origin/${BRANCH}" --quiet
chown -R www-data:www-data "${APP_DIR}"

say "بارگذاری مجدد Nginx…"
nginx -t && systemctl reload nginx

say "آپدیت شد ✓"
