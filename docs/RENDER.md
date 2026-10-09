# Render’da Tahlilchi AI

Repositorydagi `render.yaml` bitta **Free Docker Web Service** yaratadi.
Next.js frontend image ichida yig‘iladi va FastAPI bilan bir manzildan beriladi.
Render `PORT` va `RENDER_EXTERNAL_URL`ni beradi; ilova HTTPS origin, Secure cookie,
Google callback va ruxsat etilgan hostni shu manzil asosida sozlaydi.

## Hisobni ulash va deploy

Render CLI orqali `render login` bajaring va ochilgan Render sahifasida
**Authorize CLI**ni bosing. Credentialni chatga yoki repositoryga yozmang.

Dashboard orqali Blueprint yaratish uchun:

<https://dashboard.render.com/select-repo?type=blueprint>

`Umrzoq-backend-ai/Tahlilchi-Ai` repositorysini, `main` branchni va ildizdagi
`render.yaml`ni tanlang. Tarif `Free` ekanini tekshiring. Ilk sozlashda quyidagilar
maxfiy qiymatlar sifatida so‘raladi:

- `GEMINI_API_KEY`: mavjud lokal `.env`dagi API kaliti.
- `ANALYST_BOOTSTRAP_USERNAME`: birinchi administrator logini (3..64 belgi).
- `ANALYST_BOOTSTRAP_PASSWORD`: administrator paroli (12..128 belgi).

Free xizmatda lokal disk yo‘qolgach administrator qayta yaratilishi uchun bootstrap
qiymatlari Render’da qolishi kerak. Start script ularni Uvicorn processining
environmentidan olib tashlaydi. Doimiy diskli tarifga o‘tilsa, admin yaratilgach
bootstrap qiymatlarini Render’dan ham o‘chiring.

Google loginni yoqish uchun Render service’ning Environment bo‘limiga
`ANALYST_GOOGLE_CLIENT_ID` va `ANALYST_GOOGLE_CLIENT_SECRET`ni kiriting. Google
Cloud OAuth Client uchun redirect URI:

```text
https://<render-service-host>/api/v1/auth/google/callback
```

Custom domain ulansa, `ANALYST_PUBLIC_ORIGIN`ni yangi HTTPS origin bilan sozlang.

## Tekshirish

1. Deploy `Live` bo‘lsin va `/api/v1/health` HTTP 200 hamda `mode: server` qaytarsin.
2. Login, namuna yuklash va tayyor oylik tahlilni tekshiring: mart — `3 400 000`.
3. Gemini savolini yuboring va yakuniy run holatini tekshiring. Bubblewrap
   ishlamasa xizmat AI kodini hostda bajarmaydi; agent xato holatini qaytaradi.
   Health endpointdagi `agent_enabled` faqat model sozlanganini bildiradi,
   sandbox ishlashini tasdiqlamaydi.
4. Chiqish, qayta kirish va foydalanuvchilar fayllari ajratilganini tekshiring.

## Free tarifning ma’lumot saqlash chegarasi

Render Free 15 daqiqa trafik bo‘lmasa uxlaydi. Sleep, restart va redeployda
`/data`dagi SQLite, yangi hisoblar, yuklangan fayllar va tahlillar yo‘qoladi.
Bu konfiguratsiya portfolio/demo uchun. Doimiy saqlash uchun Render’dagi pullik
service’ga `/data` persistent disk ulang yoki bazani va fayllarni tashqi saqlashga
ko‘chiring. Bepul tarifga persistent disk qo‘shib bo‘lmaydi.

Rasmiy manbalar: [Free xizmatlar](https://render.com/docs/free),
[Docker](https://render.com/docs/docker),
[Render CLI](https://render.com/docs/cli).
