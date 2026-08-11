# آموزش کامل ContactFlow Personal Ultimate 3.0

## شروع سریع

نسخه 3.0 حساب کاربری ندارد. بعد از باز شدن برنامه مستقیم وارد Dashboard می‌شوید. تمام داده‌های اصلی روی همان دستگاه ذخیره می‌شوند.

---

## داشبورد

Dashboard تعداد کل مخاطبین، شهرها، Importها و وضعیت فضای ذخیره را نشان می‌دهد. از همین صفحه می‌توانید سریع به Import یا Contacts بروید.

## شماره‌ساز

1. وارد «شماره‌ساز» شوید.
2. Prefix را انتخاب یا وارد کنید؛ مثال: `0912`.
3. تعداد را تعیین کنید.
4. حالت را انتخاب کنید:
   - ترتیبی
   - تصادفی
5. City / Section / Source را وارد کنید.
6. Template نام را مشخص کنید؛ مثال:

```text
{city} {n:000000}
```

7. Preview را بررسی کنید.
8. شماره‌ها را به دیتابیس محلی اضافه یا CSV/TXT خروجی بگیرید.

> شماره‌ساز فقط داده تولید می‌کند. تولید شماره به معنی داشتن حساب Telegram یا رضایت برای دریافت پیام نیست.

## Import چندفایلی

ContactFlow می‌تواند چند فایل را همزمان داخل صف Import قرار دهد.

برای هر فایل می‌توانید جداگانه تنظیم کنید:
- City
- Section
- Source
- Name Template
- Sequence Start
- Phone Column

فرمت‌ها:
- CSV
- TSV
- TXT
- XLSX

برای فایل‌های بسیار بزرگ، CSV معمولاً سریع‌تر و کم‌حافظه‌تر است.

## نرمال‌سازی شماره

نمونه‌های زیر به شکل استاندارد تبدیل می‌شوند:

```text
09121234567
989121234567
+989121234567
00989121234567
```

خروجی استاندارد:

```text
+989121234567
```

## Duplicate

کلید اصلی Contact در دیتابیس شماره استاندارد است. شماره تکراری دوباره اضافه نمی‌شود و در گزارش Import به‌عنوان Duplicate ثبت می‌شود.

## Contacts

در صفحه مخاطبین می‌توانید:
- جستجو کنید
- بر اساس City فیلتر کنید
- بر اساس Section فیلتر کنید
- اطلاعات واردشده را مرور کنید

## نام‌ساز و ویرایش گروهی

Templateهای نمونه:

```text
{city} {n}
{city} {n:000000}
{city}-{section}-{n:0000}
```

متغیرهای اصلی:
- `{city}`
- `{n}`
- `{n:000000}`
- `{phone}`
- `{source}`

City / Section / Name را می‌توانید مستقل یا ترکیبی تغییر دهید.

## Export

فرمت‌ها:
- CSV
- VCF

برای حجم بالا مقدار Chunk Size را تعیین کنید. مثال:

```text
10000 contact
chunk size = 1000
```

نتیجه:

```text
contacts_0001.csv
contacts_0002.csv
...
contacts_0010.csv
```

در صورت فعال بودن ZIP، همه قطعات در یک ZIP قرار می‌گیرند.

## Audience

Audience از دیتابیس Contacts جداست و وضعیت ارتباط/رضایت را نگه می‌دارد.

### Opt-in
مخاطبی که رضایت برای دریافت پیام مربوطه دارد.

### Existing Chat
چتی که از قبل در حساب متصل وجود دارد و برای Workflow مجاز در نظر گرفته شده است.

### Suppressed
مخاطبی که نباید تبلیغ دریافت کند.

### Unverified
وضعیت نامشخص؛ این وضعیت نباید به‌طور خودکار به معنی مجاز بودن برای ارسال در نظر گرفته شود.

## Telegram QR

در نسخه Native روی دکمه «اتصال با QR» بزنید.

وقتی Native Connector واقعی آماده باشد:
1. ContactFlow از Telegram Login Token رسمی QR می‌گیرد.
2. QR در ContactFlow نمایش داده می‌شود.
3. در Telegram رسمی بروید:

```text
Settings → Devices → Link Desktop Device / Scan QR
```

4. QR را اسکن و تأیید کنید.
5. Session فقط روی همان دستگاه Native نگه‌داری می‌شود.

اگر Build فاقد TDLib/Credential رسمی باشد، برنامه `QR Setup` نشان می‌دهد. نسخه 3.0 نباید QR ساختگی تولید کند.

## Campaign Composer

Composer برای ساخت Draft و Preview کمپین استفاده می‌شود.

فیلدها:
- عنوان
- Audience
- متن
- پیام مرجع کانال
- لینک اصلی
- لینک «دیگه تبلیغ نبینم»
- لینک «تبلیغ ببینم»
- لینک «می‌خوام برام تبلیغ کنی»
- Media

Media می‌تواند شامل تصویر، ویدیو یا فایل باشد.

### پیام مرجع کانال
می‌توانید لینک یک پیام مرجع کانال را ذخیره کنید تا Native Connector در Workflow مجاز بتواند همان محتوای مرجع را Forward کند.

## Template Library

پیام‌های پرکاربرد را Template کنید و بعداً دوباره بارگذاری کنید.

## درخواست تبلیغ

برای هر درخواست ثبت می‌شود:
- Telegram Numeric ID
- Username
- عنوان
- تعداد درخواست‌شده
- انجام‌شده
- باقی‌مانده
- Status

Statusهای اصلی:
- Pending
- Running
- Completed

## Activity Log

عملیات مهم مانند Import، شماره‌سازی، تغییر Audience، ساخت Campaign و Backup در Log محلی ثبت می‌شوند. Log را می‌توانید CSV خروجی بگیرید.

## Backup دستی

1. به Backup بروید.
2. «ساخت .cfbackup» را بزنید.
3. فایل را در محل مطمئن ذخیره کنید.

Backup شامل Storeهای محلی برنامه است؛ از جمله مخاطبین، تنظیمات، Campaignها، Audience و Activity.

## Restore

1. Backup → Restore
2. فایل `.cfbackup` را انتخاب کنید.
3. تأیید جایگزینی داده‌های محلی را انجام دهید.
4. برنامه داده‌ها را بازیابی و Reload می‌کند.

قبل از Restore مهم، یک Backup جدید بگیرید.

## Google Drive

### Android
هنگام ذخیره Backup، System File Picker می‌تواند Google Drive را به‌عنوان مقصد نشان دهد.

### PWA/Desktop
در صورت تنظیم `googleClientId` رسمی، دکمه Connect Google از Google Identity Services استفاده می‌کند و فایل Backup را با Scope `drive.file` آپلود می‌کند.

## انتقال بین دستگاه‌ها

چون Account Sync حذف شده است، روش استاندارد انتقال:

```text
Device A → Create Backup → Google Drive / File
Device B → Restore Backup
```

این روش ساده‌تر است و هیچ Username/Password مربوط به ContactFlow نیاز ندارد.

## نکات حجم بالا

- برای داده بسیار بزرگ CSV را ترجیح دهید.
- Importهای چندصد هزار رکوردی را در چند Batch منطقی انجام دهید.
- قبل از عملیات بزرگ Backup بگیرید.
- برای Export بزرگ Chunk Size استفاده کنید.
- مرورگر را هنگام Import بزرگ نبندید.

## نکات Telegram

- وضعیت `Suppressed` همیشه باید بر مجاز بودن مقدم باشد.
- شماره تولیدشده به خودی خود Audience مجاز نیست.
- Session Telegram فقط باید در Native Connector نگه‌داری شود.
- PWA نباید Credential یا Session حساس حساب Telegram را ذخیره کند.
- ارسال ناخواسته به غریبه‌ها می‌تواند باعث محدودشدن حساب Telegram شود.
