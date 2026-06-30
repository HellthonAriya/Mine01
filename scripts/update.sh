#!/usr/bin/env bash
# ===========================================================================
#  کافهٔ دمسا — اسکریپت آپدیت
#  آخرین تغییرات را می‌گیرد و Nginx را دوباره بارگذاری می‌کند.
#    sudo bash update.sh
# ===========================================================================
set -euo pipefail

BRANCH="claude/wizardly-feynman-nc1fzn"
APP_DIR="/var/www/damsa"
RAW="https://raw.githubusercontent.com/HellthonAriya/Mine01/refs/heads/${BRANCH}/scripts"

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
# content.json (محتوای ادمین) untracked است و با reset حذف نمی‌شود.
git -C "${APP_DIR}" reset --hard "origin/${BRANCH}" --quiet
chown -R www-data:www-data "${APP_DIR}"

say "ری‌استارتِ سرویسِ سایت…"
if systemctl list-unit-files 2>/dev/null | grep -q '^damsa\.service'; then
  systemctl restart damsa || say "هشدار: ری‌استارتِ damsa ناموفق بود؛ لاگ: journalctl -u damsa"
  say "بارگذاری مجدد Nginx…"
  nginx -t && systemctl reload nginx
  say "آپدیت شد ✓"
else
  # نصبِ قدیمی (ایستا، بدونِ سرویسِ Node). به‌جای هشدار، خودکار deploy را اجرا
  # می‌کنیم تا سرویسِ damsa و reverse-proxy ساخته شوند. deploy رمزِ موجود را
  # در /etc/damsa.env حفظ می‌کند و idempotent است.
  say "سرویسِ damsa یافت نشد (نصبِ قدیمی). اجرای خودکارِ deploy برای نصبِ سرویس…"
  if [ -f "${APP_DIR}/scripts/deploy.sh" ]; then
    bash "${APP_DIR}/scripts/deploy.sh"
  else
    curl -fsSL "${RAW}/deploy.sh" | bash
  fi
  # deploy خودش Nginx و سرویس را تنظیم و بارگذاری می‌کند.
  say "آپدیت و ارتقا به نسخهٔ سرویس‌دار انجام شد ✓"
fi
