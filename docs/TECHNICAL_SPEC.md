# Autonomous Data Analyst Agent — texnik topshiriq

Holati: README asosidagi maqsadli texnik topshiriq. Talablarning bir qismi lokal v0.5 prototipda bajarildi; amaldagi imkoniyat va cheklovlar [README.md](../README.md)da aniq ko‘rsatilgan. Arxitektura va papka rejasi: [PROJECT_ANALYSIS.md](PROJECT_ANALYSIS.md).

## 1. Maqsad va MVP chegarasi

Foydalanuvchi bitta CSV yoki `.xlsx` fayl yuklaydi, jadval previewini ko‘radi va o‘zbek yoki ingliz tilida tahlil savoli beradi. Tizim Python/Pandas orqali hisoblab, matn, natija jadvali va zarur grafikni qaytaradi.

MVPga kiradi: schema/profiling, descriptive statistics, missing qiymatlar, filtr/sort/groupby, top-N, vaqt bo‘yicha agregatsiya, oddiy korrelatsiya, grafiklar, suhbat konteksti, cheklangan self-correction va bajarilgan kodni ko‘rish.

MVPga kirmaydi: forecasting, AutoML, model training, ko‘p faylli join, SQL/BI ulanishlari, PDF/OCR, internetdan ma’lumot yig‘ish, ko‘p agentli tizim, billing. README’dagi keyingi oy prognozi yo‘nalish sifatida saqlanadi va 2-bosqichda bajariladi.

Lokal prototip bitta ishonchli foydalanuvchi uchun bo‘lishi mumkin. Internetga chiqariladigan MVP autentifikatsiya, ownership, kvota va kuchliroq sandbox baholashisiz tayyor hisoblanmaydi.

## 2. Foydalanuvchi oqimi

1. Fayl yuklash va profiling holatini ko‘rish.
2. `.xlsx` bo‘lsa sheetni, zarur bo‘lsa header qatorini tanlash.
3. Preview, ustun turlari, qator soni va sifat ogohlantirishlarini ko‘rish.
4. Savol yuborish; noaniq sana, ustun, valuta yoki hisoblash qoidasi uchun aniqlik kiritish.
5. “Navbatda”, “Tahlil rejalashtirilmoqda”, “Hisoblanmoqda”, “Tekshirilmoqda” holatlarini ko‘rish.
6. Javob, jadval, grafik, ishlatilgan ustunlar, filtrlar va taxminlarni ko‘rish.
7. Keyingi savol berish, bajarilayotgan ishni bekor qilish yoki datasetni o‘chirish.

UI foydalanuvchiga kod tafsilotlarini majburan ko‘rsatmaydi; kodni ko‘rish alohida ochiladigan panel bo‘ladi.

## 3. Boshlang‘ich limitlar

Quyidagilar benchmark natijasi emas, konfiguratsiya orqali o‘zgartiriladigan dastlabki limitlardir.

| Parametr | Taklif |
| --- | --- |
| Fayl formati | `.csv`, `.xlsx`; parolli yoki makrosli fayllar qabul qilinmaydi |
| Upload hajmi | 20 MiB; stream davomida ham limit tekshiriladi |
| Dataset | Tanlangan sheetda 100 000 qator, 100 ustungacha |
| XLSX archive | Ko‘pi bilan 20 sheet, jami expanded hajm 200 MiB |
| Preview | 20 qatorgacha; response hajmi ham cheklanadi |
| Bir execution | 60 soniya, 1 CPU, 1 GiB RAM, 64 processgacha |
| Umumiy run | 180 soniya, queue kutishidan alohida; navbat uchun 5 daqiqa expiry |
| Kod urinishlari | Jami 3: birinchi urinish + 2 tuzatish |
| Chiquvchi fayllar | Run uchun jami 20 MiBgacha, grafiklar soni 5 tagacha |
| Natija previewi | 100 qatorgacha; to‘liq natija cheklangan artifact sifatida |
| Lokal parallellik | Bitta foydalanuvchiga 1 aktiv run; umumiy 2 execution |
| Saqlash | Lokal demo uchun 7 kunlik TTL; foydalanuvchi oldin o‘chira oladi |

Hajm limiti operativ xotira sarfini kafolatlamaydi. Qator/ustun limiti parser ishga tushganda aniqlanadi; parserning o‘zi ham timeout va xotira limitiga ega bo‘ladi. Limit buzilganda faylni jim kesish taqiqlanadi.

## 4. Funksional talablar

### Fayl va schema

- Nom/kengaytmadan tashqari faylning haqiqiy formati va o‘qilishi tekshiriladi.
- CSV uchun UTF-8/UTF-8-BOM dastlabki default; boshqa encoding yoki delimiter aniqlanmasa foydalanuvchiga tanlash imkoniyati beriladi.
- Sana formati noaniq bo‘lsa avtomatik taxmin javob ichida yashirilmaydi.
- Takroriy/bo‘sh ustun nomlari uchun original → normalized mapping saqlanadi.
- Bo‘sh fayl, noto‘g‘ri format va limit buzilishi alohida error kodlariga ega bo‘ladi.
- Excel formulalari bajarilmaydi; cached qiymat yo‘q yoki eskirgan bo‘lishi mumkinligi ko‘rsatiladi.
- Bir suhbat bitta o‘zgarmas dataset versiyasi va tanlangan sheet/parsing konfiguratsiyasiga bog‘lanadi.
- Qayta upload yoki parsingni o‘zgartirish yangi dataset versiyasini yaratadi.

### Agent va natija

- Agent rejasi `question`, `columns`, `filters`, `operations`, `expected_outputs`, `assumptions` maydonlari bilan tekshiriladigan strukturada olinadi.
- Mavjud bo‘lmagan ustun yoki noaniq maqsad bo‘lsa hisoblashdan oldin aniqlashtiriladi.
- Bir suhbatda parallel savollar MVPda rad etiladi yoki navbatga olinadi; kontekst tartibi buzilmaydi.
- Natija sxemasi: `summary`, `tables`, `charts`, `metrics`, `warnings`, `provenance`.
- Sonlar, sanalar va foizlar execution chiqishidan olinadi; LLM qayta o‘ylab topgan sonlar bilan almashtirilmaydi.
- `NaN`/`Infinity`, bo‘sh natija va noto‘g‘ri artifactlar uchun aniq serializatsiya/validation qoidalari bo‘ladi.
- `provenance`: dataset hash/version, parsing parametrlari, bajarilgan kod, dependency image versiyasi, model ID, prompt versiyasi va vaqt.
- Missing qiymatni tashlash, dublikatni o‘chirish va outlierni chiqarish natijada ochiq ko‘rsatiladi. Original fayl o‘zgarmaydi.
- Murakkab hisobotlar uchun faqat JSON schema tekshiruvi semantik to‘g‘rilikni isbotlamaydi; supported amallar reference datasetlar bilan baholanadi.
- Tavsifiy bog‘liqlik sabab-oqibat sifatida berilmaydi.

### Self-correction va xato siyosati

- Syntax/runtime xatolarida qolgan vaqt va attempt budjeti ichida tuzatishga ruxsat beriladi.
- Sandbox policy buzilishi, bekor qilish va umumiy deadline tugashi qayta urinishni to‘xtatadi.
- Resurs limiti buzilganda run tushunarli xato bilan tugaydi; LLMga cheksiz optimizatsiya sikli berilmaydi.
- LLM transport xatolari uchun alohida, cheklangan retry bo‘ladi; u ham umumiy deadline va xarajat limitiga kiradi.
- Har bir attempt alohida yoziladi. Oxirgi urinish tugagach sabab, bajarilgan urinishlar soni va foydalanuvchi bajarishi mumkin bo‘lgan keyingi qadam qaytariladi.

## 5. Sandbox shartlari

- Generated kod API/worker ichidagi `exec()` yoki oddiy host subprocessda bajarilmaydi.
- Bajarish muhitida tarmoq, API key, DB credential va Docker socket mavjud bo‘lmaydi.
- Non-root user, read-only root filesystem, dropped capabilities, `no-new-privileges` va seccomp qo‘llanadi.
- Faqat taskga tegishli dataset read-only ulanadi; output va vaqtinchalik joy hajmi cheklanadi.
- CPU, RAM, PID, disk, stdout/stderr va devor vaqti limitlari amalda tekshiriladi. Runtime kerakli limitni qo‘llamasa task boshlanmaydi.
- Paketlar oldindan imagega o‘rnatiladi; generated kodga `pip install` berilmaydi.
- Runner faqat belgilangan image va mount shablonlaridan foydalanadi; foydalanuvchi raw container parametrlarini bera olmaydi.
- Host runtime vakolati faqat runnerga tegishli. Worker/APIga Docker socket berilmaydi.
- Output manifestidagi yo‘llar traversal/symlink, hajm va tur bo‘yicha tekshiriladi. MVPda PNG/JSON/CSV ruxsat etiladi; generated HTML/JS brauzerda bajarilmaydi.
- Tugash, timeout, cancellation va worker uzilishidan keyin cleanup bajariladi; orphan executionlarni alohida reconciliation tozalaydi.

## 6. Ma’lumotlar modeli

| Entity | Asosiy maydonlar |
| --- | --- |
| User / Principal | `id`, identifikatsiya manbasi; lokal rejimda belgilangan demo principal |
| Dataset | `id`, `owner_id`, `version`, `original_name`, `storage_key`, `sha256`, `format`, `size_bytes`, `status`, `parsing_options`, `created_at`, `expires_at` |
| DatasetProfile | `dataset_id`, `sheet`, `row_count`, `columns`, `dtypes`, `null_counts`, `warnings`, `profile_version` |
| Conversation | `id`, `owner_id`, `dataset_id`, `created_at` |
| Message | `id`, `conversation_id`, `role`, `content`, `run_id`, `created_at` |
| AnalysisRun | `id`, `conversation_id`, `message_id`, `status`, `stage`, `plan`, `result`, `error_code`, `deadline_at`, `heartbeat_at`, `idempotency_key`, `usage`, vaqtlar |
| ExecutionAttempt | `id`, `run_id`, `number`, `code`, `image_version`, `stdout`, `stderr`, `exit_code`, `duration_ms` |
| Artifact | `id`, `run_id`, `kind`, `storage_key`, `mime_type`, `size_bytes`, `created_at` |
| RunEvent | `run_id`, `seq`, `type`, `payload`, `created_at` |

Fayl binarysi va katta jadvallar PostgreSQLga joylanmaydi. Log va error matnlari hajm bo‘yicha cheklanib, maxfiy qiymatlardan tozalanadi.

## 7. API shartnomasi

Barcha endpointlar `/api/v1` prefiksiga ega.

| Method | Endpoint | Vazifa |
| --- | --- | --- |
| POST | `/datasets` | Upload; `202`, `dataset_id`, profiling status |
| GET | `/datasets/{id}` | Holat, schema, sheets va parsing ogohlantirishlari |
| GET | `/datasets/{id}/preview` | Limitlangan preview; ready bo‘lmasa aniq holat |
| POST | `/datasets/{id}/versions` | Sheet/parsing tanlovi bilan yangi versiya va profiling |
| DELETE | `/datasets/{id}` | Kirishni yopish, aktiv ishlarni bekor qilish va o‘chirishni boshlash |
| POST | `/conversations` | Ready datasetga bog‘langan suhbat |
| GET | `/conversations/{id}/messages` | Pagination bilan tarix |
| POST | `/conversations/{id}/messages` | Savol va run yaratish; `202`, `run_id`; idempotency key qabul qiladi |
| GET | `/runs/{id}` | Holat, natija yoki xato |
| POST | `/runs/{id}/clarifications` | `needs_input` holatidagi savolga javob |
| POST | `/runs/{id}/cancel` | Idempotent bekor qilish so‘rovi |
| GET | `/runs/{id}/events?after_seq=N` | Progress tarixini tiklash va polling |
| WS | `/runs/{id}/events/ws` | Real vaqt yangilanishlari |
| GET | `/artifacts/{id}` | Ownership tekshiruvidan keyin yuklab olish |

Standart xato javobi: `error.code`, `error.message`, `error.details`, `request_id`. Credential, xom traceback yoki boshqa foydalanuvchi yo‘llari responsega kirmaydi.

## 8. Holatlar, queue va kuzatuv

Dataset: `uploaded → profiling → ready | needs_input | failed`; o‘chirish: `deleting → deleted`.

Run: `queued → running → succeeded | failed | timed_out`; `running → needs_input → queued`; aktiv holatlar `cancel_requested → cancelled` yo‘lidan o‘tishi mumkin. `needs_input` worker yoki sandboxni band qilib turmaydi; javobdan keyin yangi deadline belgilanadi, attempt/xarajat budjeti saqlanadi.

Running `stage` maydoni: `planning`, `generating`, `executing`, `validating`, `repairing`, `reporting`. Bu foydalanuvchiga ko‘rsatiladigan qisqa jarayon holati; modelning ichki fikrlash zanjiri saqlanmaydi va uzatilmaydi.

- Event: `run_id`, o‘suvchi `seq`, `type`, `timestamp`, kichik `payload`.
- Holatlar va eventlar DBda saqlanadi; Redis notification yo‘qolishi yakuniy natijani yo‘qotmaydi.
- Qayta ulangan UI oxirgi `seq`dan davom etadi; WebSocket ishlamasa REST polling bor.
- DBga yozish bilan queuega yuborish oralig‘idagi nosozlikni reconciliation task qayta tiklaydi.
- Queue yetkazib berishi takrorlanishi mumkin: worker atomic claim/lease oladi, bitta runni ikki marta final qilmaydi.
- Natija yozish va cancel orasidagi poyga atomic holat o‘tishi orqali hal qilinadi; yakunlangan status keyingi task tomonidan o‘zgartirilmaydi.
- Monitoring: queue kutishi, run va attempt davomiyligi, success rate, repair soni, timeout, token sarfi, taxminiy xarajat va cleanup xatolari.

## 9. Maxfiylik va saqlash

- Defaultda LLMga schema va cheklangan, sezgir qiymatlardan tozalangan agregatlar yuboriladi. Katak namunalarini yuborish alohida konfiguratsiya va tushunarli foydalanuvchi roziligiga bog‘lanadi.
- Ustun nomlari ham maxfiy bo‘lishi mumkin; tashqi provayder siyosati shu metadatani ham qamrab oladi.
- Har bir dataset, suhbat, run, artifact va WebSocket obunasi uchun ownership tekshiriladi.
- Dataset o‘chirish aktiv tasklarni to‘xtatadi; raw fayl, profiling, suhbat, kod/loglar va bog‘liq artifactlar ham tozalanadi.
- O‘chirish so‘rovidan boshlab kirish darhol yopiladi; background cleanup tugashi kuzatiladi. Keyinchalik backup bo‘lsa, uning saqlash siyosati ham belgilanadi.
- Fayllar, `.env`, API kalitlar va foydalanuvchi ma’lumotlari Gitga qo‘shilmaydi.
- CSV eksportida spreadsheet formula injectionga qarshi xavfsiz eksport rejimi bo‘ladi; o‘zgartirishlar foydalanuvchiga tushuntiriladi.

## 10. Qabul mezonlari va testlar

| Tekshiruv | Kutilgan natija |
| --- | --- |
| Ma’lum savdo CSVsi | Oylik summa va top-N reference qiymatlar bilan mos; float uchun belgilangan tolerance |
| `.xlsx`da bir nechta sheet | Tanlangan sheet hisoblanadi va provenance ichida ko‘rsatiladi |
| Noaniq ustun/sana | Aniqlik so‘raladi yoki taxmin ochiq ko‘rsatiladi; jim noto‘g‘ri parsing bo‘lmaydi |
| Bo‘sh, yaroqsiz yoki katta fayl | Tushunarli error; API jarayoni resurs bilan band qilinmaydi |
| Generated kodda tuzatiladigan xato | Keyingi attempt muvaffaqiyatli; oldingi xato yozuvi saqlanadi |
| Doimiy kod xatosi | Ko‘pi bilan 3 execution attempt; yakuniy `failed` |
| Infinite loop / RAM limiti | Task to‘xtaydi, resurslar tozalanadi, API ishlashda davom etadi |
| Tarmoq/secret/boshqa faylga kirish | Sandbox va ownership chegaralari kirishni bloklaydi |
| Manifest path traversal/symlink | Artifact rad etiladi; host fayli o‘qilmaydi |
| WebSocket uzilishi | Qayta ulanish yoki polling bilan holat tiklanadi |
| Worker restart / duplicate delivery | Run recovery ishlaydi; ikki yakuniy natija yaratilmaydi |
| Cancel va natija bir paytda | Bitta terminal status; orphan execution qolmaydi |
| Dataset o‘chirish | Barcha bog‘liq obyektlarga kirish yopiladi va cleanup yakunlanadi |
| Soxta LLM natijasi | Hisoblashga mos kelmaydigan structured metric final javobga o‘tmaydi |

Unit testlar: parsing qoidalari, status transitions, retry limiti, output validation. Integratsion testlar: API + DB + queue + sandbox. E2E: upload → savol → progress → natija. CI’da LLM mock/fake bilan deterministik ishlaydi; real model baholashi alohida, xarajati cheklangan suite bo‘ladi.

Qo‘llab-quvvatlanadigan tahlillar uchun kamida 10 ta sintetik dataset/savol jufti bilan reference natijalar saqlanadi. Jadval, JSON, grafikning bo‘sh emasligi va kodning qayta bajarilishi tekshiriladi. Bu testlar har qanday kelajakdagi ixtiyoriy savolga to‘g‘ri javobni kafolatlamaydi.

## 11. Prognoz uchun keyingi bosqich talablari

Forecast qo‘shilishidan oldin vaqt ustuni, target, chastota, horizon, missing periodlar va yetarli tarix mezoni belgilanadi. Baseline sifatida naive yoki seasonal naive ishlatiladi. Baholash vaqt tartibini saqlagan holdout yoki rolling backtest bilan amalga oshiriladi; kelajak ma’lumoti trainingga sizib kirmaydi. Natijada xato metrikasi, backtest davri va imkon bo‘lsa interval beriladi. Ma’lumot yetarli bo‘lmasa tizim prognoz o‘rniga sababini tushuntiradi.
