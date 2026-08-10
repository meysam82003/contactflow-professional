# آموزش کامل ContactFlow Studio PWA

نسخه: 0.3.0

## 1) PWA چیست؟

PWA در اصل یک وب‌اپ است که از یک کد واحد در مرورگر اجرا می‌شود و در سیستم‌عامل‌های پشتیبانی‌شده می‌تواند مانند یک اپ نصب شود. در ContactFlow، هسته مدیریت مخاطبین داخل مرورگر اجرا می‌شود.

## 2) مهم‌ترین نکته قبل از نصب

برای اینکه Service Worker و نصب واقعی PWA فعال شوند، برنامه باید از HTTPS یا محیط توسعه localhost/127.0.0.1 باز شود.

اگر `index.html` را مستقیم با `file://` باز کنید، می‌توانید بخش‌هایی از هسته را تست کنید، اما نصب PWA و Offline Service Worker فعال نمی‌شوند.

## 3) ساده‌ترین روش استفاده پیشنهادی

1. پوشه ContactFlow را روی یک Static Hosting دارای HTTPS منتشر کنید.
2. لینک HTTPS برنامه را روی کامپیوتر و گوشی باز کنید.
3. از منوی مرورگر، برنامه را Install/Add to Home Screen کنید.
4. از آن پس از آیکون ContactFlow وارد شوید.

این پروژه Build Step ندارد. فایل شروع `index.html` است.

## 4) نصب روی Windows / macOS / Linux با Chrome

1. لینک HTTPS برنامه را در Chrome باز کنید.
2. منوی سه‌نقطه را باز کنید.
3. وارد `Cast, save, and share` شوید.
4. `Install page as app...` را انتخاب کنید.
5. Install را تأیید کنید.

در بعضی صفحات، دکمه Install مستقیماً در نوار آدرس نمایش داده می‌شود.

## 5) نصب روی Windows با Microsoft Edge

1. لینک HTTPS برنامه را در Edge باز کنید.
2. اگر Edge برنامه را Installable تشخیص دهد، آیکون `App available` در نوار آدرس ظاهر می‌شود.
3. روی آن کلیک کنید.
4. `Install` را بزنید.

بعد از نصب، PWA در Windows مانند سایر برنامه‌ها از Start/Apps قابل اجرا و مدیریت است.

## 6) نصب روی Android با Chrome

1. لینک برنامه را در Chrome باز کنید.
2. منوی سه‌نقطه کنار نوار آدرس را بزنید.
3. `Add to home screen` را انتخاب کنید.
4. `Install` را بزنید.
5. آیکون ContactFlow روی Home Screen اضافه می‌شود.

## 7) نصب روی iPhone / iPad

1. برنامه را با Safari باز کنید.
2. دکمه Share را بزنید.
3. `Add to Home Screen` را انتخاب کنید.
4. گزینه `Open as Web App` را روشن کنید.
5. `Add` را بزنید.

آیکون برنامه روی Home Screen اضافه می‌شود و با حالت اپ اجرا خواهد شد.

## 8) انتشار روی Vercel

ContactFlow یک سایت Static است و Build Step لازم ندارد. یک روش مناسب این است که فایل‌ها را در یک Git repository قرار دهید و پروژه را در Vercel Import کنید.

بعد از اولین Deploy، Vercel یک آدرس با پسوند `.vercel.app` می‌دهد. برای دامنه اختصاصی، در پروژه به `Settings > Domains` بروید و دامنه را اضافه کنید؛ Vercel رکورد DNS لازم را نمایش می‌دهد.

ساختار فایل‌هایی که باید در ریشه سایت باشند:

```text
index.html
app.js
styles.css
manifest.webmanifest
sw.js
icons/
  icon.svg
  icon-192.png
  icon-512.png
  apple-touch-icon.png
```

## 9) اگر دکمه Install نمایش داده نشد

موارد زیر را بررسی کنید:

- URL با `https://` باز شده باشد.
- `manifest.webmanifest` بدون خطا Load شود.
- آیکون‌های 192x192 و 512x512 قابل دسترسی باشند.
- Service Worker (`sw.js`) ثبت شده باشد.
- برنامه قبلاً روی همان مرورگر نصب نشده باشد.
- صفحه را بعد از Deploy یک‌بار Reload کنید.

در Chrome/Edge می‌توانید DevTools را باز کنید و از بخش Application، Manifest و Service Workers را بررسی کنید.

## 10) داده‌های مخاطبین کجا ذخیره می‌شوند؟

نسخه فعلی داده‌ها را در IndexedDB همان Browser Profile و همان دستگاه ذخیره می‌کند.

بنابراین:

- نصب PWA روی کامپیوتر و گوشی به معنی Sync خودکار دیتابیس نیست.
- پاک کردن Site Data/Browser Data ممکن است دیتابیس محلی را پاک کند.
- برای Production، اضافه کردن Backup/Restore کامل و سپس Sync رمزگذاری‌شده بین دستگاه‌ها توصیه می‌شود.

## 11) بهترین Workflow برای یک میلیون شماره

برای فایل‌های بسیار حجیم:

1. Import اولیه روی PC/Laptop انجام شود.
2. تا حد امکان از CSV استفاده شود، چون Streaming آن کم‌حافظه‌تر از XLSX است.
3. Dedup و Naming روی کامپیوتر انجام شود.
4. خروجی VCF/CSV به صورت Chunked ساخته شود.
5. موبایل بیشتر برای مشاهده، مدیریت سبک و کارهای روزمره استفاده شود.

## 12) Telegram

Bot Token نباید داخل JavaScript سایت عمومی قرار بگیرد. معماری Production باید این‌گونه باشد:

```text
ContactFlow PWA
      ↓ HTTPS
Private Telegram Gateway
      ↓
Telegram Bot API
```

Token اصلی فقط روی Backend/Secret Store نگه‌داری شود.

## 13) فایل‌های این نسخه

- `index.html`: رابط اصلی
- `app.js`: موتور مخاطبین و UI
- `styles.css`: رابط RTL و Responsive
- `manifest.webmanifest`: تنظیمات نصب PWA
- `sw.js`: Offline Cache
- `icons/`: آیکون‌های نصب
- `README_FA.md`: معرفی پروژه
- `DEPLOY.md`: خلاصه انتشار
- `PWA_TUTORIAL_FA.md`: همین آموزش

