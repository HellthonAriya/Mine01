#!/usr/bin/env bash
# ===========================================================================
#  کافهٔ دمسا — اسکریپتِ مدیریتِ سرور (منو‌محور)
#  نصب، آپدیت، حذف، تغییرِ رمزِ ادمین، وضعیت، لاگ، SSL و بکاپ — همه از یک منو.
#
#  اجرا (تک‌خطی):
#    curl -fsSL https://raw.githubusercontent.com/HellthonAriya/Mine01/refs/heads/claude/wizardly-feynman-nc1fzn/scripts/manage.sh | sudo bash
#  یا اگر نصب شده:
#    sudo bash /var/www/damsa/scripts/manage.sh
# ===========================================================================
set -uo pipefail

BRANCH="claude/wizardly-feynman-nc1fzn"
RAW="https://raw.githubusercontent.com/HellthonAriya/Mine01/refs/heads/${BRANCH}/scripts"
APP_DIR="/var/www/damsa"
ENV_FILE="/etc/damsa.env"
SITE="damsa"

C_Y="\033[1;33m"; C_G="\033[1;32m"; C_R="\033[1;31m"; C_D="\033[2m"; C_0="\033[0m"
say()  { printf "${C_Y}▸ %s${C_0}\n" "$*"; }
ok()   { printf "${C_G}✓ %s${C_0}\n" "$*"; }
err()  { printf "${C_R}✗ %s${C_0}\n" "$*"; }

# خواندنِ ورودی از ترمینال (حتی وقتی اسکریپت از طریقِ curl|bash اجرا شده).
# اگر ترمینالِ تعاملی نباشد، read با شکست برمی‌گردد و حلقه امن خاتمه می‌یابد.
ask() { printf "%s" "$1" >/dev/tty 2>/dev/null; IFS= read -r "$2" </dev/tty; }
pause() { printf "\n${C_D}— Enter برای بازگشت به منو —${C_0}" >/dev/tty 2>/dev/null; IFS= read -r _ </dev/tty 2>/dev/null || true; }

if [ "$(id -u)" -ne 0 ]; then
  err "این اسکریپت باید با sudo/root اجرا شود."
  exit 1
fi

if ! { : </dev/tty; } 2>/dev/null; then
  err "ترمینالِ تعاملی در دسترس نیست. این اسکریپت را در یک ترمینالِ واقعی اجرا کن:"
  echo "   sudo bash /var/www/damsa/scripts/manage.sh"
  exit 1
fi

installed() { [ -f "/etc/systemd/system/damsa.service" ]; }

show_urls() {
  local ip; ip="$(hostname -I 2>/dev/null | awk '{print $1}')"
  echo "   سایت:  http://${ip:-<IP>}/"
  echo "   پنل:   http://${ip:-<IP>}/admin"
  if [ -f "${ENV_FILE}" ]; then
    echo "   رمزِ پنل: $(grep '^DAMSA_PASSWORD=' "${ENV_FILE}" | cut -d= -f2-)"
  fi
}

# ---------------------------------------------------------------------------
do_install() {
  say "نصب / استقرار"
  local DOMAIN EMAIL PASS
  ask "دامنه (خالی بگذار اگر فقط با IP می‌خواهی): " DOMAIN
  ask "ایمیل (برای گواهیِ SSL، اختیاری): " EMAIL
  ask "رمزِ پنلِ ادمین (خالی = پیش‌فرضِ damsa-admin): " PASS
  say "در حالِ اجرای استقرار…"
  curl -fsSL "${RAW}/deploy.sh" | bash -s -- "${DOMAIN}" "${EMAIL}" "${PASS}" \
    && ok "نصب/به‌روزرسانیِ استقرار انجام شد." || err "استقرار با خطا مواجه شد."
}

do_update() {
  say "آپدیتِ سایت به آخرین نسخه…"
  curl -fsSL "${RAW}/update.sh" | bash \
    && ok "آپدیت شد." || err "آپدیت ناموفق بود."
}

do_password() {
  installed || { err "هنوز نصب نشده. اول گزینهٔ ۱ را بزن."; return; }
  local NP
  ask "رمزِ جدیدِ پنلِ ادمین: " NP
  [ -z "${NP}" ] && { err "رمز خالی بود؛ تغییری اعمال نشد."; return; }
  if grep -q '^DAMSA_PASSWORD=' "${ENV_FILE}" 2>/dev/null; then
    sed -i "s|^DAMSA_PASSWORD=.*|DAMSA_PASSWORD=${NP}|" "${ENV_FILE}"
  else
    echo "DAMSA_PASSWORD=${NP}" >> "${ENV_FILE}"
  fi
  systemctl restart damsa && ok "رمز عوض شد و سرویس ری‌استارت شد." || err "ری‌استارتِ سرویس ناموفق."
}

do_status() {
  say "وضعیتِ سرویس‌ها"
  systemctl is-active damsa >/dev/null 2>&1 && ok "سرویسِ damsa: فعال" || err "سرویسِ damsa: غیرفعال"
  systemctl is-active nginx >/dev/null 2>&1 && ok "Nginx: فعال" || err "Nginx: غیرفعال"
  echo; nginx -t 2>&1 | sed 's/^/   /'
  echo; show_urls
}

do_restart() {
  say "ری‌استارتِ سایت…"
  systemctl restart damsa 2>/dev/null && ok "سرویسِ سایت ری‌استارت شد." || err "ری‌استارتِ damsa ناموفق."
  nginx -t >/dev/null 2>&1 && systemctl reload nginx && ok "Nginx بارگذاری شد." || err "بارگذاریِ Nginx ناموفق."
}

do_logs() {
  say "آخرین ۶۰ خطِ لاگِ سرویس (q برای خروج اگر باز ماند):"
  journalctl -u damsa -n 60 --no-pager 2>/dev/null || err "لاگی یافت نشد."
}

do_ssl() {
  local D E
  ask "دامنه (مثلاً cafe.example.com): " D
  [ -z "${D}" ] && { err "دامنه لازم است."; return; }
  ask "ایمیل (اختیاری): " E
  say "گرفتنِ گواهیِ SSL و پیکربندیِ دامنه…"
  curl -fsSL "${RAW}/deploy.sh" | bash -s -- "${D}" "${E}" \
    && ok "اگر DNS درست به این سرور اشاره کند، SSL فعال شد." || err "ناموفق."
}

do_backup() {
  installed || { err "هنوز نصب نشده."; return; }
  local ts out; ts="$(date +%Y%m%d-%H%M%S)"; out="/root/damsa-backup-${ts}.tgz"
  ( cd "${APP_DIR}" && tar -czf "${out}" content.json uploads 2>/dev/null )
  [ -f "${out}" ] && ok "بکاپِ محتوا و عکس‌ها ساخته شد: ${out}" || err "چیزی برای بکاپ نبود."
}

do_uninstall() {
  installed || { err "چیزی برای حذف نیست."; return; }
  local c
  ask "مطمئنی می‌خواهی سایت را حذف کنی؟ تایپ کن yes: " c
  [ "${c}" = "yes" ] || { say "لغو شد."; return; }
  say "توقف و حذفِ سرویس…"
  systemctl stop damsa 2>/dev/null || true
  systemctl disable damsa 2>/dev/null || true
  rm -f /etc/systemd/system/damsa.service
  systemctl daemon-reload
  rm -f "/etc/nginx/sites-enabled/${SITE}" "/etc/nginx/sites-available/${SITE}"
  nginx -t >/dev/null 2>&1 && systemctl reload nginx 2>/dev/null || true
  ok "سرویس و پیکربندیِ Nginx حذف شد. (Node و Nginx روی سرور باقی ماندند.)"
  local c2
  ask "فایل‌های سایت و داده‌ها (${APP_DIR}, ${ENV_FILE}) هم پاک شوند؟ yes/no: " c2
  if [ "${c2}" = "yes" ]; then
    local ts out; ts="$(date +%Y%m%d-%H%M%S)"; out="/root/damsa-backup-${ts}.tgz"
    ( cd "${APP_DIR}" 2>/dev/null && tar -czf "${out}" content.json uploads 2>/dev/null ) || true
    [ -f "${out}" ] && say "یک بکاپِ ایمنی ساخته شد: ${out}"
    rm -rf "${APP_DIR}" "${ENV_FILE}"
    ok "همه‌چیز پاک شد."
  else
    say "فایل‌ها و داده‌ها نگه داشته شدند."
  fi
}

menu() {
  printf "\n${C_Y}══════════════════════════════════════${C_0}\n"
  printf   "        ☕  مدیریتِ کافهٔ دمسا\n"
  printf   "${C_Y}══════════════════════════════════════${C_0}\n"
  if installed; then printf "  وضعیت: ${C_G}نصب‌شده${C_0}\n"; else printf "  وضعیت: ${C_D}نصب‌نشده${C_0}\n"; fi
  echo
  echo "  1) نصب / استقرار (با IP یا دامنه + SSL)"
  echo "  2) آپدیت به آخرین نسخه"
  echo "  3) تغییرِ رمزِ پنلِ ادمین"
  echo "  4) وضعیتِ سرویس‌ها و آدرس‌ها"
  echo "  5) ری‌استارتِ سایت"
  echo "  6) مشاهدهٔ لاگِ سرویس"
  echo "  7) گرفتن/تنظیمِ SSL برای دامنه"
  echo "  8) بکاپ از محتوا و عکس‌ها"
  echo "  9) حذفِ کاملِ سایت (Uninstall)"
  echo "  0) خروج"
  echo
}

while true; do
  menu >/dev/tty
  CH=""
  ask "انتخاب کن [0-9]: " CH || { echo; say "خروج."; exit 0; }
  case "${CH}" in
    1) do_install ;;
    2) do_update ;;
    3) do_password ;;
    4) do_status ;;
    5) do_restart ;;
    6) do_logs ;;
    7) do_ssl ;;
    8) do_backup ;;
    9) do_uninstall ;;
    0) say "خداحافظ ☕"; exit 0 ;;
    *) err "گزینهٔ نامعتبر." ;;
  esac
  pause
done
