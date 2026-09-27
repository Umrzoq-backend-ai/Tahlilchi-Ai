# Biznes savollari bo‘yicha tekshiruv

[`cases.json`](cases.json) 14 ta sun’iy dataset va savol juftligini saqlaydi: 12 ta qo‘llanadigan hisob, noaniq sana formati va bu versiyada qo‘llanmaydigan prognoz. Har bir hisobning kutilgan jadvali oldindan qo‘lda belgilangan. Haqiqiy kompaniya fayllari bu katalogga kiritilmaydi.

Lokal hisoblashni tekshirish:

```bash
.venv/bin/python scripts/evaluate_business.py
.venv/bin/python -m pytest backend/tests/test_business_reference.py -q
```

Ixtiyoriy haqiqiy Gemini **reja** tekshiruvi:

```bash
.venv/bin/python scripts/evaluate_business.py --live-plan --limit 3
.venv/bin/python scripts/evaluate_business.py --live-plan
```

`--live-plan` pullik yoki kvotali API chaqiruvlar qilishi mumkin. Faqat sun’iy savol va ustun nomi/turi yuboriladi; CSV qatorlari va API kaliti yuborilmaydi. Bu rejim agentning kod yozishi, sandboxdagi hisoblash va natija tekshiruvini o‘lchamaydi; ular alohida API/browser testlari bilan tekshiriladi. Kvota yoki ulanish tugasa qolgan savollar `unverified` deb sanaladi. Reja mos kelmasligi tekshirish uchun signal; semantik jihatdan teng, ammo boshqa reja ham bo‘lishi mumkin.

Sun’iy testlar real kompaniya ustunlari, valuta qoidalari va KPI ta’riflarini almashtirmaydi. Pilot uchun ularning anonimlashtirilgan namunalari bilan alohida reference javoblar kerak.
