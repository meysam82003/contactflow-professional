# ContactFlow Studio PWA — Deploy

نسخه 0.3.0 یک Static PWA است و Build Step ندارد.

## نیاز اصلی

- HTTPS برای نصب PWA و Service Worker در Production
- Entry point: `index.html`
- فایل‌ها باید با همان ساختار پوشه منتشر شوند.

## Vercel

پروژه را از Git repository به Vercel Import کنید. پس از Deploy یک URL با پسوند `.vercel.app` دریافت می‌شود.

برای دامنه اختصاصی:

1. Project > Settings > Domains
2. Add Domain
3. رکوردهای DNS پیشنهادی Vercel را در DNS Provider اعمال کنید.

## فایل‌های ضروری

- index.html
- app.js
- styles.css
- manifest.webmanifest
- sw.js
- icons/icon.svg
- icons/icon-192.png
- icons/icon-512.png
- icons/apple-touch-icon.png

## Telegram Production

PWA -> private HTTPS gateway -> Telegram Bot API

Bot token باید فقط در secret store/environment سمت Gateway قرار بگیرد و هرگز در frontend source یا localStorage ذخیره نشود.
