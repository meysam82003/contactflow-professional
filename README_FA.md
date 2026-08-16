# ContactFlow Personal Ultimate 3.6

ContactFlow یک نرم‌افزار Local‑First برای Import، پاک‌سازی، Merge، Backup، تحلیل شهری و خروجی مخاطبین است. نسخه ۳.۶ از یک هسته آفلاین مشترک برای Telegram Mini App، PWA، Android، Windows، Linux و macOS استفاده می‌کند.

افزونه‌های ضروری همین Release شامل ابزارهای بومی Windows و Android برای تغییرنام ترتیبی فایل‌ها و اپ آفلاین Android برای تفکیک مخاطبین تلگرام، واتساپ، روبیکا، ایتا، بله، سروش و سایر اکشن‌های ثبت‌شده است. جزئیات در [`extensions/README_FA.md`](extensions/README_FA.md) قرار دارد.

## تغییرهای اصلی ۳.۶

- Import پیش‌فرض با یک دکمه تحلیل، Merge، ثبت و راستی‌آزمایی می‌شود؛ «فقط پیش‌نمایش» اختیاری است.
- موتور نام‌گذاری دقیق، تعداد مشخص یا همه ردیف‌ها را در یک Transaction تغییر می‌دهد و از قالب‌های شهر، استان، اپراتور، منبع و شماره پشتیبانی می‌کند.
- مخاطبین فایل رسمی Telegram Desktop بدون API ID/Hash در Mini App/PWA/اپ باز، جستجو، ثبت و VCF/CSV می‌شوند.
- داشبورد «هوش شهری» رتبه شهرها، استان‌ها، اپراتورها، تمرکز داده و امتیاز کیفیت را زنده محاسبه می‌کند.
- جعبه‌ابزار جداگانه V14 تبدیل TXT/CSV/VCF/JSON/Excel، حذف تکراری، Prefix، VCF قطعه‌ای، Hex/Unicode و Image Base64 را یکپارچه می‌کند.
- ذخیره خروجی با System Save As در Android و مرورگرهای پشتیبانی‌شده انجام می‌شود و Download فقط fallback است.
- فاصلهٔ قالب‌های چسبیده مثل `{city}{province}` اصلاح و نام‌های قدیمی مثل `ابرکوهیزد` در اولین اجرا ترمیم می‌شوند.

## تغییرهای اصلی ۳.۵

تشخیص شهر و استان از متن فارسی، انگلیسی و فینگلیش به موتور Import اضافه شده است؛ برای مثال `customers_BandarAbbas.csv` به شهر «بندرعباس» و استان «هرمزگان» می‌رسد. اپراتور اولیه شماره نیز تشخیص داده می‌شود و کاربر می‌تواند یک‌بار قانون منبع را روی حالت خودکار، ثابت یا حفظ منبع فایل قرار دهد.

مرکز کانال‌ها برای Telegram، WhatsApp، Rubika، Bale و Soroush Plus صف رضایت‌محور، قالب پیام، خروجی CSV و VCF و تحویل دستی به اپ فراهم می‌کند. این بخش Session داخلی برنامه‌ها را نمی‌خواند و ارسال بدون تأیید یا دورزدن ضداسپم انجام نمی‌دهد.

## موتور Import/Merge حفظ‌شده از ۳.۴

مرکز «Import و Merge هوشمند» چند فایل CSV/TSV/TXT/VCF/JSON/XLS/XLSX یا ZIP را هم‌زمان تحلیل می‌کند؛ XLS باینری OLE/BIFF نیز با Parser نسخه‌پین‌شده پشتیبانی می‌شود. تشخیص `Qom.txt → قم`، ترانویسی فارسی، E.164، کشور، شهر تلفن ثابت، نوع و اعتبار شماره، تفکیک شرکت، گزارش تکراری شهر/فامیل/دامنه و نمودار شهرها روی دستگاه انجام می‌شود.

Merge در حالت عادی پس از تحلیل به‌صورت اتمیک ثبت و شمارش دیتابیس راستی‌آزمایی می‌شود. حالت Preview-only، انتخاب نسخه قدیمی/جدید/Smart Fill، Undo مستقل هر فایل و Rollback کامل آخرین Merge همچنان وجود دارد. Android دفترچه کامل را فقط با مجوز صریح می‌خواند و OCR کارت ویزیت را محلی اجرا می‌کند. در وب Contact Picker فقط موارد انتخاب‌شده کاربر را تحویل می‌دهد.

## تلگرام بدون API

مسیر اصلی نسخه ۳.۶ فایل رسمی Telegram Desktop است: در Desktop از Settings → Advanced → Export Telegram data فقط Contacts را انتخاب کنید و `result.json` یا HTML را در بخش «تلگرام بدون API» باز کنید. برنامه همه پردازش‌ها را محلی انجام می‌دهد، پیش‌نمایش و جستجو می‌دهد و خروجی VCF/CSV یا ثبت در مخاطبین می‌سازد.

Mini App نمی‌تواند مخفیانه فهرست خصوصی مخاطبین حساب Telegram را بخواند؛ انتخاب فایل توسط کاربر جایگزین امن و قابل‌اتکا است. API ID، API Hash، Session یا QR برای این مسیر لازم نیست.

## ساختار سورس

- `web/` — هسته قابل ممیزی و مشترک همه دستگاه‌ها
- `enhancements/telegram-web-entry.js` — Connector رسمی MTProto/User Session
- `desktop/` — پوسته Go برای Windows/Linux/macOS
- `android/` — پوسته WebView با System Document Picker، دفترچه مجوزمحور و OCR محلی
- `telegram-miniapp/` — Gateway اختیاری Bot/Business و ورودی توسعه
- `scripts/build-miniapp.mjs` — ساخت Mini App کامل از همان `web/`
- `.github/workflows/release-all.yml` — Build و Release همه دستگاه‌ها

موتورهای `web/import-merge.js`، `web/location-operator.js`، `web/name-engine.js`، `web/telegram-export.js` و `web/legacy-tools.js` به‌همراه رابط `web/v36.js` Source of Truth نسخه ۳.۶ هستند.

## اجرای PWA محلی

یک Static Server در ریشه مخزن اجرا کنید و `web/index.html` را باز کنید. استفاده از User Session به HTTPS یا Origin امن نیاز دارد.

## Build Connector

```bash
npm --prefix enhancements install
npm --prefix enhancements run build
cp enhancements/dist/telegram-web.bundle.js web/
```

## تست

```bash
node --test tests/*.test.cjs
node scripts/verify-v36.mjs
```

## Mini App

Release با نام زیر یک بسته Flat و آماده cPanel می‌سازد:

`ContactFlow_Personal_Ultimate_3.6.0_Telegram_MiniApp_cPanel.zip`

محتویات ZIP را روی HTTPS Extract و `https://domain/path/miniapp.html` را در BotFather ثبت کنید. این فایل همان رابط کامل برنامه را بارگذاری می‌کند، نه صفحه Placeholder نسخه قبلی.

## اصول استفاده

- داده‌ها Local‑First هستند.
- مسیر تلگرام بدون API هیچ Session تلگرامی ایجاد یا صادر نمی‌کند.
- Bot یا Mini App برای اسکن پنهانی شماره‌ها استفاده نمی‌شود.
- ارسال تبلیغاتی باید فقط به مخاطب دارای رضایت صریح انجام شود.
- استفاده Flood/Spam می‌تواند باعث محدودیت یا مسدودشدن حساب Telegram شود.

فهرست قابلیت‌ها و مرزهای واقعی پلتفرم‌ها: [FEATURES_3_4_FA.md](docs/FEATURES_3_4_FA.md)، [FEATURES_3_5_FA.md](docs/FEATURES_3_5_FA.md) و [FEATURES_3_6_FA.md](docs/FEATURES_3_6_FA.md)
