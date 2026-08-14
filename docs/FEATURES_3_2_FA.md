# ContactFlow Personal Ultimate 3.2

نسخه `3.2.0` قابلیت‌های مدیریت مخاطب را برای PWA، Windows، Android و Telegram Mini App یکسان می‌کند. خروجی‌های Desktop و Android از همان Web Core نسخه PWA ساخته می‌شوند؛ بنابراین Import، پاک‌سازی، Backup و Export رفتار مشترک دارند.

## امکانات Contact Studio

1. Import هم‌زمان CSV، TXT و VCF
2. Paste مستقیم از Clipboard
3. تبدیل ارقام فارسی و عربی
4. Normalize شماره ایران
5. Normalize استاندارد E.164 بین‌المللی
6. تشخیص شماره نامعتبر
7. ادغام Duplicate بر اساس شماره استاندارد
8. جستجوی زنده
9. فیلتر معتبر و نامعتبر
10. مرتب‌سازی نام، شماره و زمان
11. انتخاب همه نتایج فیلترشده
12. معکوس‌کردن انتخاب
13. نام‌گذاری سریالی گروهی
14. برچسب‌گذاری گروهی
15. ثبت شهر گروهی
16. CSV دارای UTF-8 BOM
17. VCF سازگار با Android، Windows و Telegram contact sync
18. TXT شماره‌ها
19. Backup کامل JSON
20. Restore و Merge بدون بازنویسی کور داده‌ها
21. Web Share به Google Drive و برنامه‌های نصب‌شده
22. کپی شماره‌های فیلترشده
23. ذخیره Local-First
24. دریافت شماره خود کاربر Mini App با تأیید صریح او

## محدودیت واقعی Telegram

Telegram Mini Apps API دسترسی به فهرست کامل مخاطبین حساب را ارائه نمی‌کند. `requestContact` فقط شماره همان کاربری را می‌گیرد که Mini App را باز کرده و درخواست را تأیید می‌کند. ContactFlow 3.2 برای Backup مخاطبین دیگر، Import فایل VCF/CSV و خروجی استاندارد ارائه می‌کند و هیچ نتیجه یا دسترسی ساختگی نمایش نمی‌دهد.
