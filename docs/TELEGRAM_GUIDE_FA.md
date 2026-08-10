# راهنمای کامل Telegram در ContactFlow Professional 1.2

> این راهنما برای راه‌اندازی **Telegram Mini App + Bot + Telegram Business Connection** در ContactFlow نوشته شده است.

---

## نقشه کلی

ContactFlow در بخش Telegram سه جزء دارد:

1. **Bot** — برای اتصال رسمی به Telegram، دریافت Updateها و باز کردن Mini App.
2. **Mini App** — همان پنل ContactFlow که داخل خود Telegram باز می‌شود.
3. **Business Connection** — برای مدیریت و پاسخ/ارسال در Private Chatهای موجود از طرف حساب Telegram Business متصل، بدون گرفتن رمز یا Session اکانت.

نکته مهم: Business Connection برای چت‌هایی است که Telegram در همان اتصال در اختیار Bot قرار داده است؛ ContactFlow برای ساخت لیست شماره‌های تصادفی، کشف اکانت‌های Telegram یا ارسال سرد به شماره‌های ناشناس طراحی نشده است.

---

# بخش 1 — پیش‌نیازها

قبل از Telegram این موارد را آماده کنید:

- یک دامنه HTTPS برای ContactFlow Server/PWA، مثل `https://contact.example.com`
- Bot Token
- Telegram Numeric Admin ID
- حساب ContactFlow ساخته‌شده و Login موفق

برای نسخه Windows، آدرس `127.0.0.1` فقط رابط محلی برنامه است و **نباید** به‌عنوان Cloud Server حساب/Sync وارد شود. حساب چنددستگاهی و Telegram به یک Server مرکزی HTTPS نیاز دارند.

---

# بخش 2 — ساخت Bot با BotFather

1. Telegram را باز کنید.
2. وارد BotFather رسمی شوید.
3. دستور `/newbot` را ارسال کنید.
4. یک نام نمایشی برای Bot انتخاب کنید.
5. یک Username که به `bot` ختم شود انتخاب کنید.
6. BotFather یک **Bot Token** می‌دهد.
7. Token را محرمانه نگه دارید؛ آن را در کانال، گروه، GitHub یا فایل عمومی قرار ندهید.

نمونه ساختار Token:

```text
1234567890:AAExampleToken...
```

در ContactFlow، Token فقط از فرم Telegram به Server ارسال می‌شود و نباید در فایل‌های Frontend ذخیره شود.

---

# بخش 3 — Admin ID عددی

فیلد **Admin Numeric ID** یعنی شناسه عددی حساب Telegram خودتان، نه Username و نه شماره تلفن.

نمونه:

```text
123456789
```

Admin ID را فقط برای حساب مدیر وارد کنید. اگر چند مدیر لازم دارید، بهتر است بعداً سیستم Role/Permission جداگانه تعریف شود؛ یک Token مشترک را بین افراد پخش نکنید.

---

# بخش 4 — تنظیم Mini App

Mini App باید روی HTTPS در دسترس باشد.

نمونه:

```text
https://contact.example.com
```

در ContactFlow وارد صفحه **تلگرام** شوید و این سه فیلد را پر کنید:

- Bot Token
- Admin Numeric ID
- URL عمومی Mini App

سپس **ذخیره/اتصال** را بزنید.

اگر URL Mini App صحیح باشد، ContactFlow تلاش می‌کند Menu Button مدیر را به Mini App متصل کند.

### تنظیم از BotFather

برای Main Mini App نیز می‌توانید از تنظیمات BotFather استفاده کنید و URL HTTPS برنامه را معرفی کنید. بعد از آن در پروفایل Bot دکمه Launch App قابل نمایش است.

---

# بخش 5 — امنیت Mini App

ContactFlow باید داده `Telegram.WebApp.initData` را به Server بفرستد و Server آن را اعتبارسنجی کند.

به `initDataUnsafe` به‌تنهایی اعتماد نکنید. Admin access باید فقط پس از تأیید Server-side داده Telegram داده شود.

در عمل یعنی:

```text
Telegram Client
      ↓
Mini App
      ↓ initData
ContactFlow Server
      ↓ validation
Admin Session
```

---

# بخش 6 — اتصال Telegram Business

این قسمت برای حالتی است که می‌خواهید عملیات Private Chat از طرف **حساب Business متصل** انجام شود، نه اینکه پیام با نام Bot دیده شود.

مراحل کلی:

1. در Telegram وارد تنظیمات Business شوید.
2. بخش مربوط به Chatbot/Connected Bot را باز کنید.
3. Bot ساخته‌شده را به حساب خود متصل کنید.
4. دسترسی‌های لازم برای مدیریت پیام‌های Private را مشخص کنید.
5. به ContactFlow برگردید.
6. در صفحه Telegram روی **بروزرسانی/Sync Updates** بزنید.
7. در جدول **Telegram Business Connectionها** باید Connection جدید دیده شود.

ContactFlow `connection_id` را ثبت می‌کند و برای ارسال پیام از طرف حساب Business، آن را به Telegram API می‌فرستد.

---

# بخش 7 — دریافت Private Chatهای Business

بعد از ثبت Connection:

1. در پنل Telegram، از بخش **Telegram Business Connectionها** Connection موردنظر را انتخاب کنید.
2. **دریافت چت‌های موجود** را بزنید.
3. جدول Chat ID، نام، Username و آخرین تعامل ثبت‌شده نمایش داده می‌شود.
4. چت‌های موردنظر را انتخاب کنید.
5. متن پیام را بنویسید.
6. در صورت نیاز متن و URL دکمه را وارد کنید.
7. **ارسال از طرف حساب Business به چت‌های انتخاب‌شده** را بزنید.

این مسیر فقط روی چت‌هایی کار می‌کند که در Business Connection موجود و مجاز هستند.

---

# بخش 8 — Campaign Bot / رضایت دریافت

بخش Campaign Bot برای کاربرانی است که دریافت پیام از Bot را پذیرفته‌اند.

دکمه‌های قابل استفاده در پیام می‌توانند شامل موارد زیر باشند:

- مشاهده تبلیغ
- دیگر تبلیغ نده
- من هم تبلیغ می‌خواهم

اگر کاربر **دیگر تبلیغ نده** را انتخاب کند، در Suppression List ثبت می‌شود. تا زمانی که Admin صریحاً او را فعال نکند، کمپین‌های بعدی نباید برایش ارسال شوند.

---

# بخش 9 — عضویت کانال/گروه موردنیاز

در فیلد Required Chats می‌توانید Username چت‌های لازم را با کاما جدا کنید:

```text
@channel_one,@channel_two
```

برای بررسی عضویت کاربران، Bot باید دسترسی لازم به چت موردنظر داشته باشد. اگر بررسی عضویت خطا می‌دهد، ابتدا Admin بودن Bot و Username/Chat ID را بررسی کنید.

---

# بخش 10 — خطاهای رایج

## HTTP 404 هنگام Login یا Telegram

اگر در Windows آدرس زیر را برای Server گذاشته باشید:

```text
http://127.0.0.1:17654
```

این آدرس فقط UI محلی است و API حساب مرکزی نیست.

راه‌حل:

- `config.js` را روی URL سرور HTTPS مرکزی تنظیم کنید.
- Server را Deploy و سپس Health Check کنید.

نمونه:

```js
window.CONTACTFLOW_CONFIG = {
  apiBase: "https://contact.example.com"
};
```

## Bot Token معتبر نیست

- Token را دوباره از BotFather بررسی کنید.
- فاصله ابتدا/انتهای Token را حذف کنید.
- اگر Token لو رفته، آن را revoke و Token جدید بسازید.

## Mini App باز نمی‌شود

- URL باید HTTPS باشد.
- Certificate دامنه باید معتبر باشد.
- `index.html` باید بدون 404 باز شود.
- Server باید فایل‌های `app.js`, `pro.js`, `styles.css` را نیز سرو کند.

## Business Connection نمایش داده نمی‌شود

- Bot را واقعاً در Telegram Business به حساب متصل کنید.
- Updateها را Sync کنید.
- Token همان Bot متصل را در ContactFlow وارد کنید.
- Permissionهای اتصال Business را بررسی کنید.

## پیام Business ارسال نمی‌شود

- Connection باید فعال باشد.
- Chat باید در لیست همان Connection وجود داشته باشد.
- Business Bot Rights باید اجازه عملیات موردنظر را بدهد.

---

# بخش 11 — چک‌لیست نهایی Telegram

- [ ] Bot ساخته شده
- [ ] Bot Token محرمانه است
- [ ] Admin Numeric ID صحیح است
- [ ] ContactFlow Server روی HTTPS اجرا می‌شود
- [ ] Mini App URL باز می‌شود
- [ ] Bot Menu/Main Mini App تنظیم شده
- [ ] `initData` سمت Server اعتبارسنجی می‌شود
- [ ] Business Bot به حساب متصل شده
- [ ] Business Connection در ContactFlow دیده می‌شود
- [ ] Private Chatهای موجود Sync شده‌اند
- [ ] ارسال آزمایشی به یک Chat مجاز موفق است
- [ ] Suppression/Opt-out تست شده
- [ ] Backup و Sync حساب تست شده

---

## پیشنهاد تست اولیه

قبل از استفاده جدی، فقط با حساب خودتان و یک چت آزمایشی مسیر کامل را تست کنید:

```text
Login → Telegram Config → Mini App → Business Connection
→ Sync Updates → Load Chats → Send Test → Verify Result
```

بعد از موفقیت این مسیر، استفاده روزمره را شروع کنید.
