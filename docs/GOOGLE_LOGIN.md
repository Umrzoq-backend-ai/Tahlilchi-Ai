# Google hisob bilan kirish

Gemini API kaliti Google login uchun ishlamaydi. Login uchun Google Cloud Console’dan alohida **OAuth 2.0 Client (Web application)** kerak. Server Google’dan kelgan bir martalik authorization code’ni token bilan almashtiradi va ID tokenning imzosi, audience, issuer, amal qilish muddati va `nonce`ni tekshiradi. Google ID tokenidagi o‘zgarmas `sub` foydalanuvchi identifikatori; email faqat ko‘rsatish uchun saqlanadi.

## Lokal sozlash

1. [Google Cloud Console — OAuth clients](https://console.cloud.google.com/auth/clients)da loyiha tanlang. Kerak bo‘lsa [OAuth consent screen / Branding](https://console.cloud.google.com/auth/branding)ni to‘ldiring. Ilova Testing holatida bo‘lsa, sinab ko‘radigan Google hisobingizni Test users ro‘yxatiga kiriting.
2. **Create client → Web application** tanlang. **Authorized redirect URI**ga sahifani qaysi manzilda ochayotgan bo‘lsangiz, aynan shuni kiriting:

   `http://127.0.0.1:8000/api/v1/auth/google/callback`

   Agar brauzerda `localhost:8000` ochsangiz, alohida `http://localhost:8000/api/v1/auth/google/callback` URI ham kiriting. Port boshqacha bo‘lsa, portni ham o‘zgartiring. Google URI sxema, host, port va yo‘lni aynan solishtiradi.
3. `.env`ga quyidagini lokal kiriting; Secretni chatga, Gitga yoki frontend kodiga yozmang:

   ```dotenv
   ANALYST_GOOGLE_CLIENT_ID=...apps.googleusercontent.com
   ANALYST_GOOGLE_CLIENT_SECRET=...
   ```

4. `bash scripts/run.sh` bilan serverni qayta ishga tushiring, sahifani yangilang. **Google orqali kirish** tugmasi faol bo‘ladi. `.env`ga ikkala qiymat kiritilmaguncha tugma nofaol ko‘rinadi.

Google Cloud Console’da `redirect_uri_mismatch` chiqsa, brauzer adresidagi host va port bilan 2-qadamdagi URI bir xil ekanini tekshiring. Bu serverda kirish uchun faqat `openid email` scope so‘raladi; Google Drive yoki boshqa ma’lumotlarga ruxsat olinmaydi.

## Mavjud fayllarni saqlash

Google hisob bilan birinchi kirish yangi bo‘sh ish maydoni yaratadi. Eski lokal hisob fayllari email o‘xshashligi bilan boshqa hisobga o‘tkazilmaydi. Eski hisob fayllari kerak bo‘lsa:

1. Eski login/parol bilan kiring.
2. Yon paneldan **Google hisobini bog‘lash**ni bosing va Google hisobingizni tasdiqlang.
3. Keyingi safar **Google orqali kirish** shu ish maydonini ochadi.

Eski parol esdan chiqqan bo‘lsa, loyiha papkasida terminal orqali `.venv/bin/python scripts/manage_users.py reset-password LOGIN` buyrug‘ini ishlating; parol terminalda yashirin so‘raladi. Bu amal barcha eski sessiyalarni bekor qiladi. Google orqali yangi bo‘sh hisob allaqachon ochilgan bo‘lsa, eski hisobdan **Google hisobini bog‘lash** bosilganda shu Google kirish bog‘lamasi eski hisobga o‘tkaziladi. Yangi Google hisobiga fayl yuklangan bo‘lsa, ikkita hisob avtomatik birlashtirilmaydi.

## Kompaniya serveri

`ANALYST_PUBLIC_ORIGIN=https://analyst.company.uz` sozlang va shu origin bilan Google Cloud’da `https://analyst.company.uz/api/v1/auth/google/callback` URI’ni ro‘yxatdan o‘tkazing. HTTPS serverda yangi Google hisoblar defaultda yopiq: avval admin lokal hisob yaratadi va foydalanuvchi uni Google’ga bog‘laydi. Faqat nazorat qilinadigan Google Workspace domeni uchun yangi hisoblarni avtomatik ochmoqchi bo‘lsangiz, masalan `ANALYST_GOOGLE_ALLOWED_DOMAIN=company.uz` kiriting. Tekshiruv email tugashiga emas, Google ID tokenidagi tasdiqlangan `hd` claimga asoslanadi. Bu sozlama domen cheklovini **barcha** Google loginlariga qo‘llaydi.

Google OAuth oqimi [Google’ning web-server OAuth qo‘llanmasi](https://developers.google.com/identity/protocols/oauth2/web-server), [OpenID Connect hujjati](https://developers.google.com/identity/openid-connect/openid-connect) va [ID token tekshirish yo‘riqnomasi](https://developers.google.com/identity/gsi/web/guides/verify-google-id-token)ga tayangan.
