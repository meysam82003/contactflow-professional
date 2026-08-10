# نصب Windows

فایل `ContactFlow_Setup.exe` یک PE64 واقعی Windows است و Python/Node روی کامپیوتر کاربر نمی‌خواهد.

## نصب

1. روی `ContactFlow_Setup.exe` دوبار کلیک کنید.
2. Welcome را تأیید کنید.
3. Install را تأیید کنید.
4. برنامه در `%LOCALAPPDATA%\Programs\ContactFlow Professional` نصب می‌شود.
5. Shortcut روی Desktop و Start Menu ساخته می‌شود.

`ContactFlow.exe` تمام فایل‌های UI را داخل خودش دارد و یک Server محلی فقط روی `127.0.0.1:17654` اجرا می‌کند. سپس Edge یا Chrome را در App Mode باز می‌کند. اگر مرورگر App Mode پیدا نشود، مرورگر پیش‌فرض باز می‌شود.

## حذف

از Windows Apps/Installed Apps یا فایل `Uninstall ContactFlow.exe` در پوشه نصب استفاده کنید. Uninstall عمداً IndexedDB مرورگر را خودکار پاک نمی‌کند تا داده محلی ناخواسته از بین نرود.
