# Data Analyst — Gemini agenti

CSV yoki Excel jadvaliga oddiy tilda savol bering. Gemini tahlil rejasini va Python kodini yozadi; kod lokal, tarmoqsiz muhitda hisoblaydi. Ko‘rsatiladigan natija mustaqil Pandas hisoblashlari bilan solishtiriladi.

**v0.5 — Next.js/React/TypeScript interfeysi, Gemini agenti, lokal va Google login, foydalanuvchiga tegishli ish maydoni.** Tayyor tahlillar kalitsiz ham ishlaydi. Kompaniya pilot serveri uchun [deployment yo‘riqnomasi](docs/DEPLOYMENT.md) bor; tashqi serverga hali o‘rnatilmagan. Billing va prognoz kiritilmagan.

## Kompaniyaga foydasi

- Savdo va xarajat fayllarida davriy hisobotni tez tayyorlash.
- Hudud/kategoriya kesimida yig‘indi, o‘rtacha, top/bottom guruhlarni solishtirish.
- Bo‘sh qiymat va dublikatlarni aniqlab, ma’lumot sifatini tekshirish.
- Javob bilan birga hisoblash rejasi, dataset hash, kod va parametrlarni saqlash.

Natijaning biznes ma’nosi ustunlar va savolning to‘g‘ri talqiniga bog‘liq. Raqamlarni tekshirish foyda yoki qaror to‘g‘riligini kafolatlamaydi; reja interfeysda ko‘rinadi.

## Ishga tushirish

Python 3.12+, Node.js 20.9+, Linux/WSL va Bubblewrap kerak. Next.js statik build qilinadi; xizmatga alohida Node serveri kerak emas. Frontend fayllari HTML, CSS va JavaScriptga yig‘ilib, FastAPI bilan bitta manzildan beriladi. Ubuntu/Debian’da Bubblewrap alohida `bubblewrap` paketi sifatida o‘rnatiladi. User namespaces yoqilgan bo‘lishi kerak; AI sandbox ishlamasa host executionga o‘tmaydi.

```bash
npm ci --prefix frontend
npm run build --prefix frontend
python3 -m venv .venv
.venv/bin/python -m pip install -r backend/requirements.lock
.venv/bin/python -m pip install --no-deps -e ./backend
# Faqat .env hali mavjud bo‘lmasa:
cp -n .env.example .env
bash scripts/run.sh
```

Brauzer: <http://127.0.0.1:8000> · API: <http://127.0.0.1:8000/docs>

Birinchi ochishda administrator loginini va kamida 12 belgili parolni yarating. Google kirishini yoqish uchun [Google OAuth sozlash yo‘riqnomasi](docs/GOOGLE_LOGIN.md)ga qarang; Gemini API kaliti login credentiali emas. Mavjud lokal fayllar shu birinchi hisobga biriktiriladi. Keyingi xodim hisoblarini yon paneldagi **Xodim hisobi yaratish** bo‘limidan oching. Har bir hisob faqat o‘z fayl va natijalarini ko‘radi.

`.env` avtomatik o‘qiladi; eksport qilingan environment o‘zgaruvchilari undan ustun. `.env`dagi `GEMINI_API_KEY=` qiymatini lokal kiriting. Kalit Gitga, frontendga va loglarga yuborilmaydi. Sozlama o‘zgarsa serverni qayta ishga tushiring. Frontend kodini o‘zgartirsangiz `npm run build --prefix frontend` va server restartini bajaring; CSP yangi Next.js skript hashlarini restartda hisoblaydi.

Port band bo‘lsa: `ANALYST_PORT=8001 bash scripts/run.sh`. Bitta process ishlating; multi-worker rejim hali qo‘llanmaydi. Serverni `Ctrl+C` bilan to‘xtating.

## Gemini sozlamalari

| O‘zgaruvchi | Ma’nosi |
| --- | --- |
| `GEMINI_API_KEY` | Google AI Studio API kaliti |
| `ANALYST_LLM_API_KEY` | Ixtiyoriy alternativ key nomi; berilsa yuqoridagidan ustun |
| `ANALYST_LLM_BASE_URL` | `https://generativelanguage.googleapis.com/v1beta/openai` |
| `ANALYST_LLM_MODEL` | AI Studio loyihangizda mavjud model; `.env.example`da `gemini-2.5-flash` |
| `ANALYST_LLM_ALLOW_REMOTE` | Tashqi provayderga savol/schema yuborish uchun `true` |
| `ANALYST_LLM_JSON_MODE` | `schema`; faqat mos provayder zarur bo‘lsa `json` |
| `ANALYST_DATA_DIR` | Default loyiha ichidagi `.data/` |
| `ANALYST_MAX_UPLOAD_MB` | Default `20` MiB |
| `ANALYST_JOB_TIMEOUT` | Default bitta hisoblashga `60` soniya |
| `ANALYST_PUBLIC_ORIGIN` | Lokal: bo‘sh; server: `https://analyst.company.uz` |
| `ANALYST_SESSION_HOURS` | Sessiya muddati; default `12`, 1..168 soat |
| `ANALYST_GOOGLE_CLIENT_ID` / `ANALYST_GOOGLE_CLIENT_SECRET` | Google OAuth web client credentiallari |
| `ANALYST_GOOGLE_ALLOWED_DOMAIN` | Ixtiyoriy tasdiqlangan Google Workspace domeni |

Kalit [Google AI Studio](https://aistudio.google.com/api-keys) orqali olinadi. Gemini ilovasidagi Pro obunani cheksiz API kvotasi deb qabul qilmang; loyihangizning [API billing va kvotasini](https://ai.google.dev/gemini-api/docs/billing) tekshiring. Adapter Google’ning [rasmiy compatibility API](https://ai.google.dev/gemini-api/docs/openai) shartnomasidan foydalanadi.

Tashqi modelga savol, ustun nomlari/turlari, reja va qayta tuzatish uchun yaratilgan kod yuboriladi. Fayl qatorlari, preview, hisoblangan raqamlar, to‘liq traceback va kalitlar promptga qo‘shilmaydi. Savol va ustun nomlarining o‘zi ham kompaniya ma’lumoti bo‘lishi mumkin.

## Sinab ko‘rish

1. Bo‘sh ish maydonining chap tomonidagi **Namunada sinab ko‘rish**ni (yoki yuklash qismidagi **Savdo namunasini ochish**ni) bosing.
2. **Gemini bilan savol bering** maydoniga quyidagilardan birini yozing:
   - `order_date ustuni YYYY-MM-DD formatida. Har bir oy uchun amount yig‘indisini hisobla va barcha oylarni chiqar.`
   - `city ustuni Toshkent bo‘lgan qatorlardagi amount yig‘indisini hisobla.`
   - `amount yig‘indisi bo‘yicha eng yuqori 5 category guruhini ko‘rsat.`
3. Jarayon holati va natijani kuting. Agent aniqlik so‘rasa, shu maydonda javob yozing.
4. Reja, grafik, jadval va hisoblash manbasini ko‘ring; zarur bo‘lsa JSON yuklab oling.

Namuna uchun eng yuqori oy — **2026-03, 3 400 000**. Toshkent bo‘yicha yig‘indi — **3 280 000**. Datasetda valuta belgilanmagan; tizim valuta qo‘shmaydi.

## Agent ishlash tartibi

1. API `202` bilan saqlangan run qaytaradi; takroriy idempotency key modelni qayta chaqirmaydi.
2. Sandbox mavjudligi tekshiriladi, keyin Gemini strukturali reja tuzadi.
3. Reja schema va ustunlar bo‘yicha tekshiriladi. Noaniqlik `needs_input`, qo‘llanmaydigan reja `unsupported` bo‘ladi.
4. Ishonchli engine rejaning reference natijasini hisoblaydi. Bu qiymatlar modelga berilmaydi.
5. Gemini Python yozadi. Kod policy tekshiruvidan keyin Bubblewrap ichida bajariladi.
6. Natija jadvalidagi ko‘rsatiladigan har bir katak, ustun tartibi va qator soni reference bilan tekshiriladi.
7. Mos bo‘lsa foydalanuvchiga reference asosidagi izoh, jadval va grafik beriladi. LLM o‘ylab topgan biznes xulosasi yakuniy natijaga qo‘shilmaydi.
8. Syntax/runtime yoki natija mos kelmasligida ko‘pi bilan ikki tuzatish; policy, resurs, kvota va bekor qilish holatida to‘xtaydi.

Chegaralar: ikki parallel agent ishi; har run 180 soniya; jami ko‘pi bilan 5 HTTP model chaqiruvi; har chaqiruv 4096 output-token limiti. Vaqtinchalik 5xx/connection xatosiga bitta retry shu umumiy budjet ichida ishlaydi. Sana yoki tip xatolarida tizim jim noto‘g‘ri parsing qilmaydi.

## Qo‘llanadigan tahlillar

`overview`, `missing`, `metric`, `group`, `monthly`; `sum`, `mean`, `count` (qatorlar soni); 5 tagacha AND filter (`eq/ne/gt/gte/lt/lte`); top/bottom N.

Join, OR filter, unique mijozlar soni, foyda formulasi, valuta konvertatsiyasi, korrelatsiya, prognoz va sabab-oqibat tahlili bu versiyaning tasdiqlangan amallari emas. Agentga bitta qo‘llanadigan hisoblash rejasi kerak. Savolning biznes jihatdan to‘g‘ri talqinini avtomatik matematik tekshiruv isbotlamaydi.

## Login va hisoblar

Parollar scrypt hash holida saqlanadi; cookie `HttpOnly` va `SameSite=Strict`, HTTPS server rejimida `Secure`. Sessiya tokenining faqat SHA-256 hashi bazaga yoziladi. Yozuvchi API chaqiruvlari CSRF token talab qiladi. Logout sessiyani bekor qiladi; ochiq WebSocket ham sessiyani qayta tekshiradi. Birinchi hisob yaratish faqat lokal ulanishda va bazada hisob yo‘qligida ishlaydi.

Parol esdan chiqsa, loyiha katalogida:

```bash
.venv/bin/python scripts/manage_users.py reset-password sizning_loginingiz
```

Parol terminalda yashirin so‘raladi. Yangilash foydalanuvchining barcha eski sessiyalarini yopadi.

## API

Google kirishi uchun `GET /api/v1/auth/google/status`, `GET /auth/google/start`, `GET /auth/google/callback` va login sessiyasi bilan `POST /auth/google/link` bor. OAuth javob kodi faqat backendda almashiladi; Google Secret brauzerga yuborilmaydi.

Cookie sessiyasi kerak. `GET /api/v1/auth/me` joriy hisob va `csrf_token`ni qaytaradi; POST/DELETE so‘rovlarida uni `X-CSRF-Token` headeriga qo‘ying. `health`, `demo.csv`, `auth/me`, `auth/login`, lokal birinchi `auth/setup` login talab qilmaydi. Login/setup JSON `{username, password}` qabul qiladi.

| Endpoint | Amal |
| --- | --- |
| `POST /api/v1/auth/setup`, `/auth/login` | Birinchi hisob / kirish |
| `POST /api/v1/auth/logout` | Joriy sessiyani yopish |
| `POST /api/v1/auth/users` | Administrator orqali xodim hisobini yaratish |
| `GET /api/v1/health` | Versiya va umumiy holat |
| `GET /api/v1/agent/status` | AI konfiguratsiyasi; kalit qaytarilmaydi |
| `GET/POST /api/v1/datasets` | Datasetlar / multipart upload |
| `GET /api/v1/datasets/{id}` | Profil, schema va preview |
| `POST /api/v1/datasets/{id}/versions` | Yangi sheet/parsing versiyasi |
| `POST /api/v1/datasets/{id}/questions` | `{question, idempotency_key, clarification_for?}` bilan agent run yaratish |
| `GET /api/v1/datasets/{id}/runs` | Oxirgi 20 agent ishi |
| `GET /api/v1/runs/{id}` | Saqlangan progress, reja, attempts va natija |
| `GET /api/v1/runs/{id}/events?after_seq=N` | Eventlarni qayta olish |
| `WS /api/v1/runs/{id}/events/ws` | Real vaqt progress |
| `POST /api/v1/runs/{id}/cancel` | Bekor qilish so‘rovi |
| `POST/GET /api/v1/datasets/{id}/analyses` | Tayyor tahlil / natijalar tarixi |
| `GET /api/v1/datasets/{id}/analyses/{analysis_id}/export.csv` | Tegishli natijaning ko‘rsatilgan jadvalini xavfsiz CSVga eksport qilish |
| `DELETE /api/v1/datasets/{id}` | Raw fayl, metadata, run va tahlillarni o‘chirish |

Brauzer persisted REST pollingdan foydalanadi; WebSocket API ham mavjud. Refreshdan keyin aktiv run qayta kuzatiladi. Server qayta ishga tushsa tugallanmagan run `INTERRUPTED` bilan tugaydi; model xarajatini takrorlamaslik uchun avtomatik qayta bajarilmaydi. Cancel joriy bloklovchi model/sandbox chaqiruvi tugaganda kuchga kiradi.

## Struktura

```text
backend/app/
  main.py                 # REST, WebSocket, lifecycle
  config.py               # .env va maxfiy sozlamalar
  auth.py                 # Hisob, scrypt, sessiya va dataset egaligi
  schemas.py              # Plan/filter shartnomalari
  services.py, store.py    # Dataset, SQLite, persisted run/events
  analysis/               # CSV/XLSX parsing va ishonchli Pandas hisoblash
  agent/
    provider.py           # Gemini HTTP klienti va token/call budjeti
    prompts.py, models.py # Planner/codegen shartnomalari
    orchestrator.py       # Reja → reference → kod → execution → validation/repair
    policy.py             # AST tekshiruvi (asosiy xavfsizlik chegarasi emas)
    sandbox.py            # Bubblewrap va bounded process IO
    sandbox_runtime.py    # Generated kod faqat shu izolyatsiyada bajariladi
    validator.py          # Reference bilan natija solishtirish
backend/tests/            # Deterministik provider, API, hisoblash va OS sandbox testlari
frontend/src/app/         # Next.js App Router sahifa va CSS
frontend/src/components/  # React, TypeScript interfeys komponentlari
frontend/src/lib/         # Typed API va ma’lumot shartnomalari
frontend/out/             # Build chiqishi (Gitga qo‘shilmaydi)
examples/sales.csv         # Sintetik ma’lumot
scripts/browser_smoke.py   # Ixtiyoriy haqiqiy Gemini/browser testi
```

## Chegaralar

- Foydalanuvchi bo‘yicha egalik bor; tashkilot/team bo‘yicha umumiy dataset, PostgreSQL/Celery, MFA va TTL hali yo‘q. Bitta worker ishlating. `.data/` o‘chirilguncha saqlanadi.
- Generated kod: non-root UID, alohida network/PID/user namespace, read-only runtime/dataset, 32 MiB vaqtinchalik joy, 1.5 GiB virtual xotira, CPU/wall-time va chiqish hajmi limitlari. Host home, `.env`, boshqa datasetlar va credentiallar ulanmaydi. AST tekshiruvi OS izolyatsiyasi o‘rnini bosmaydi.
- Bubblewrap lokal izolyatsiya qatlamidir. Ommaviy, ko‘p mijozli muhit uchun alohida host/VM, seccomp/cgroup siyosati va mustaqil xavfsizlik tekshiruvi kerak; bular hali bajarilmagan.
- Trusted parser/reference worker hozir resurslari cheklangan host process. Generated kod bu yo‘ldan bajarilmaydi; parserni ham namespacega ko‘chirish keyingi mustahkamlash ishidir.
- Upload: 20 MiB, 100 000 qator, 100 ustun; XLSX 20 sheet va 200 MiB expanded hajmgacha. Multipartni framework vaqtincha diskka yozishi mumkin; deployment Caddy shablonida ingress limiti 21 MiB; lokal serverda reverse proxy yo‘q.
- Preview 20 qator, natija 100 qator, grafik 24 guruhgacha. Validator ko‘rsatiladigan kataklar va umumiy o‘lchamlarni tekshiradi. CSV eksport faqat ko‘rsatilgan natija qatorlarini beradi; CSVdagi formula sifatida talqin qilinishi mumkin bo‘lgan matn boshiga apostrof qo‘shiladi. JSON eksportda provenance ham bor.
- CSV UTF-8/BOM; bo‘sh katak missing, `NA` matni saqlanadi. Sana formati aniq tanlanadi; timezone va lokal decimal avtomatik taxmin qilinmaydi. Excel formulasi bajarilmaydi, cached qiymat o‘qiladi.

## Tekshirish

```bash
.venv/bin/python -m pytest backend/tests -q
.venv/bin/ruff check backend scripts
.venv/bin/ruff format --check backend scripts
npm run typecheck --prefix frontend
npm run build --prefix frontend
```

Unit/integration testlar haqiqiy Gemini chaqirmaydi. Bubblewrap bo‘lsa OS izolyatsiyasi real bajariladi, o‘rnatilmagan bo‘lsa tegishli testlar skip bo‘ladi. Yoqilgan namespace siyosati bo‘lmasa agent fail-closed ishlaydi.

Brauzer testi uchun Playwright o‘rnatilgan Python, `/usr/bin/google-chrome` va ishlayotgan lokal server kerak:

```bash
python3 scripts/browser_smoke.py  # Mavjud test login/paroli terminalda so‘raladi
# Faqat real Gemini chaqiruvi va uning API xarajatiga tayyor bo‘lganda:
ANALYST_TEST_LIVE_AI=1 python3 scripts/browser_smoke.py
```

Avtomatlashtirishda `ANALYST_TEST_USERNAME` va `ANALYST_TEST_PASSWORD` environment orqali beriladi; qiymatlarni loglamang. Faqat alohida bo‘sh test bazasi uchun `ANALYST_TEST_SETUP=1` vaqtinchalik birinchi hisob yaratadi.

Test Next.js build qilingan serverda sintetik dataset yaratadi va o‘z faylini tozalaydi. Skrinshotlar `/tmp/analyst-screenshots/`ga yoziladi.

Keyingi ishlar: kompaniyaning real ustunlari uchun biznes ta’riflari va reference javoblar; tashkilot/team sharing; durable queue va PostgreSQL; parser izolyatsiyasi; public deployment. Sun’iy reference tekshiruvi [`evaluation/README.md`](evaluation/README.md)da, joriy pilot holati esa [`docs/PILOT_READINESS.md`](docs/PILOT_READINESS.md)da. To‘liq maqsad: [arxitektura](docs/PROJECT_ANALYSIS.md), [texnik topshiriq](docs/TECHNICAL_SPEC.md).
