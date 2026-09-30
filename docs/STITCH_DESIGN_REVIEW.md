# Stitch dizayni tahlili

Sana: 2026-09-29. Manba: foydalanuvchi yuborgan `stitch_dizayn_tizimi_arxitekturasi.zip`.

## Tekshiruv chegarasi

Arxiv /tmp/stitch-review-20260929 ichiga ochildi. Barcha 10 PNG vizual ko‘rildi, 9 HTML va 2 Markdown hujjat tekshirildi. Mavjud frontend, API endpointlari, profil va hisoblash modellari bilan solishtirildi. HTML ichidagi skriptlar bajarilmadi; inline JavaScript `node --check` bilan sintaksisga tekshirildi. Ushbu bosqichda ilova kodi o‘zgartirilmadi, brauzer yoki backend regressiya testlari qayta bajarilmadi.

Arxivdagi hujjatlar dizayn manbasi sifatida o‘qildi. Ulardagi topshiriq matnlari yangi foydalanuvchi buyrug‘i yoki mavjud funksiyalar ishlashining isboti sifatida qabul qilinmadi.

## Arxiv tarkibi

| Material | Holat |
| --- | --- |
| Login | HTML va PNG |
| Bo‘sh ish maydoni / upload | HTML va PNG |
| Dataset va ma’lumot sifati | HTML va PNG |
| AI savollari va holatlar | HTML va PNG |
| Tahlil natijalari / tarix | HTML va PNG |
| Mobil dataset ekrani | HTML va PNG |
| Mobil natijalar ekrani | HTML va PNG |
| Logo | HTML va PNG |
| Namunaviy menejer portreti | PNG |
| Stitchga prompt kiritilgan eski skrinshot | PNG; mahsulot ekrani emas |
| `tahlilchi_studio_analytics_platform/code.html` | Login HTML bilan baytma-bayt bir xil |
| `design.md` va `tahlilchi_studio/DESIGN.md` | Dastlabki brief va rang/shrift/o‘lcham qoidalari |

Mobil login, mobil bo‘sh holat va mobil AI navbati uchun alohida maket yo‘q. Ular mavjud dizayn qoidalaridan moslashtiriladi.

## Vizual baho

To‘q ko‘k chap menyu, oq ishchi kartalar va teal asosiy tugmalar yaxshi ajralgan. Ma’lumot sifatining to‘rtta ko‘rsatkichi, katta savol maydoni, har bir savolning alohida holati va natija grafigi mahsulot vazifasiga mos. Mobil ekranda 2 ustunli ko‘rsatkichlar va yon tomonga suriladigan jadval qulay yo‘nalish beradi.

Asosiy tokenlar: sidebar `#0B1329`, sidebar karta `#131F3F`, canvas `#FBFBF9`, asosiy rang `#005C55`, teal `#0F766E`, chiziq `#E2E4DE`. Sarlavhalar Space Grotesk, oddiy matn Plus Jakarta Sans. Dizayn hujjatida sovuq fon `#F7F9FB` ham bor: implementatsiyada ikkala fonning vazifasi izchil belgilanadi.

Desktop va mobilni ikkita mustaqil ilova sifatida yaratish shart emas: bitta React komponent tizimi responsive CSS orqali moslashadi. Maket eksporti Tailwind CDN ishlatadi, mavjud loyiha esa oddiy CSS; tashqi CDN kodini ko‘chirish o‘rniga ko‘rinish CSS tokenlariga o‘tkaziladi.

## Ekranlarni real funksiyalarga moslash

| Ekran | Mavjud imkoniyat | Moslash kerak bo‘lgan qism |
| --- | --- | --- |
| Login | Lokal login, dastlabki admin yaratish, Google kirish/bog‘lash | Parolni tiklash va “eslab qolish” uchun tegishli alohida oqim yo‘q; dastlabki setup yo‘qolmasin |
| Upload | CSV/XLSX, drag-and-drop, demo, ajratgich tanlash | `.xls` qo‘llanmaydi. 50 MB o‘rniga health API qaytargan limit ko‘rsatilsin; default 20 MiB |
| Dataset | 4 sifat ko‘rsatkichi, preview, ustun turlari, ISO sana tasdig‘i | Global qidiruv/paginatsiya, katak tahriri, AI bilan to‘ldirish endpointlari yo‘q; preview 20 qatorgacha |
| AI | 1–5 raqamlangan savol, ketma-ket navbat, aniqlashtirish, bekor qilish, xato holatlari | 85% yoki “2 soniya qoldi” kabi taxminiy raqamlar hardcode qilinmasin; haqiqiy stage ko‘rsatilsin |
| Natijalar | Summary, jadval, grafik, warnings, provenance, CSV/JSON, tarix | PDF/public ulashish, rejaga nisbatan KPI, avtomatik ko‘p tahlilli rahbar hisoboti mavjud emas |
| Mobil | Mavjud UI va umumiy API | Pastki navigatsiya, ochiluvchi menyu, uzun fayl nomlari va grafik yorliqlari real viewportda tekshirilishi kerak |

Maketda yo‘q, lekin saqlanishi kerak bo‘lgan mavjud amallar: API kalitisiz tezkor tahlil, Excel sheet tanlash, CSV ajratgichi, faylni o‘chirish, Google hisobini bog‘lash, admin setup, navbatni bekor qilish va aniqlashtirish javobi. Mobil “Profil”, desktop “Sozlamalar”, bildirishnoma va til almashtirish tugmalari real vazifasi bo‘lmasa faol menyu sifatida qo‘shilmaydi.

## Tuzatilishi zarur bo‘lgan topilmalar

1. **Natijalar HTMLida JavaScript sintaksis xatosi bor.** JSON eksportidagi `so'rov:` kaliti qo‘shtirnoqsiz yozilgan. `node --check` ushbu faylda xato qaytardi; shu script blokidagi CSV/JSON va accordion handlerlari ham ro‘yxatdan o‘tmaydi. Boshqa HTMLlardagi inline skriptlar sintaksis tekshiruvidan o‘tdi. Bu ularning amalda ishlashini isbotlamaydi.
2. **Maket APIga ulanmagan.** Upload fayl nomini olib timeoutdan keyin hashni almashtiradi. Eksport oldindan yozilgan namunaviy raqamlarni yuklaydi. Login formasi submitni to‘xtatadi. Ularni hozirgi React/API amallariga ulash zarur.
3. **Tasdiqlanmagan va’dalar bor.** “100% aniq”, “100% xavfsiz”, “TLS 1.3”, “256-bitli shifrlash”, “ISO muvofiqligi” va “gallyutsinatsiyasiz” yozuvlari dalilsiz ko‘rsatilmasin. Hisob mustaqil tekshirilgan bo‘lsa, aynan “Hisoblash tekshirildi” deyiladi; bu savol talqini yoki manba faylning mutlaq to‘g‘riligini kafolatlamaydi.
4. **Ma’lumot uzatish matni aniq bo‘lsin.** Qatorlar modelga yuborilmaydi; savol va ustun metama’lumotlari Gemini’ga yuboriladi. Maketdagi barcha ma’lumot tashqariga chiqmasligi haqidagi umumiy taassurot tuzatilsin.
5. **Tarif va kvota namunalari haqiqiy emas.** “100/100”, oylik limit yangilanish sanasi va “Tariflar va Paketlar” mavjud xizmatdan kelmaydi. Haqiqiy AI_QUOTA xatosi va navbat holati tushuntiriladi; quota va server bandligi avtomatik bir sabab deb ko‘rsatilmaydi.
6. **Hisoblash manbasi Pandas bilan mos bo‘lsin.** Maketdagi SQL/SUMIFS/SUMMA_UZS kodlari namuna. Real provenance va reja ko‘rsatiladi. SQLite metadata saqlanishi tahlil SQL orqali bajarilishini anglatmaydi.
7. **Bo‘sh kataklar yashirincha to‘ldirilmasin.** Maketda bo‘sh kategoriya avtomatik “Boshqalar”ga o‘tkazilgani aytilgan. UI backenddagi haqiqiy missing-value siyosati va warningsni aks ettirishi kerak; ma’lumotni o‘zgartirish alohida funksiyadir.
8. **Barcha raqam va shaxslar namunaviy.** Ismoil Karimov, rol, fayl nomi, vaqt va KPIlar real session/dataset/resultdan olinadi. Portret haqiqiy foydalanuvchi avatari sifatida qo‘yilmaydi. 6 oylik namunaviy summalar 312 400 000 ga yig‘iladi, lekin yanvardagi +12% uchun oldingi oy manbasi, rejadan +8.4% uchun reja ma’lumoti yo‘q. Bunday taqqoslashlar uydirilmaydi.
9. **Demo matni bir xil bo‘lsin.** Bo‘sh ekranda dollar, boshqa ekranda so‘m; mobil maketda 3 ta demo jadval yozilgan, ilovada bitta demo endpoint bor. Valyuta datasetga asosan belgilanadi; har bir son avtomatik pul deb olinmaydi.
10. **Joriy navbat cheklovi saqlansin.** Jo‘natilmagan savollar brauzer xotirasida; sahifa yopilsa navbat davom etishiga va’da berilmaydi. Yuborilgan runlar va tayyor natijalar tarixda saqlanadi.

## Integratsiya tartibi

1. Ranglar, tipografika, logo va umumiy UI komponentlari; desktop sidebar hamda mobil navigatsiya.
2. Login/setup/Google oqimini yangi ko‘rinishga moslashtirish.
3. Upload, demo, dataset sifat kartalari va jadval; parser sozlamalarini saqlash.
4. AI savollari va har birining haqiqiy backend holati; xato, aniqlashtirish va bekor qilish.
5. Natijalar, chart, CSV/JSON, hisoblash tafsilotlari va tarix.
6. TypeScript/build hamda login → upload/demo → tahlil → eksport → tarix oqimi bo‘yicha brauzer tekshiruvi. 390px va 1440px, klaviatura fokusi, jadval scrolli va matn kontrasti alohida tekshiriladi.

Asosiy moslashtirish joylari: `frontend/src/app/globals.css`, `frontend/src/components/Workspace.tsx`, `frontend/src/components/Results.tsx`, `frontend/src/app/layout.tsx`. Katta Workspace komponentini vazifalarga ajratish yangi ekranlarni ulashni yengillashtiradi. Backend shartnomasini oddiy dizayn o‘zgarishi uchun almashtirish talab qilinmaydi.

Xulosa: arxivda redesignni boshlash uchun yetarli vizual material bor. Asosiy ish — maketni mavjud API va holatlar bilan ishlaydigan React interfeysiga aylantirish, namunaviy va qo‘llanmaydigan amallarni moslashtirish. Dizayn tayyorligi mahsulotning funksional tayyorligi bilan teng emas.
