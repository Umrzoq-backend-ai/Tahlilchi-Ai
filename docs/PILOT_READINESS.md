# Pilotga tayyorgarlik holati

2026-09-28 holatidagi lokal prototip: hisobga kirish, CSV/XLSX yuklash, profiling, tayyor tahlil, Gemini agent, grafik va tarix ishlaydi. Alohida bo‘sh test bazasida login → namuna upload → oylik hisob → grafik → eksport → tarix → o‘chirish brauzer oqimi o‘tgan. Foydalanuvchining Google hisobidagi `sales.csv` 19 qator va 5 ustun bilan `ready` holatiga kelgan; shu holat tekshirilganda hali tahlil runi yo‘q edi.

14 ta sun’iy dataset/savol juftligidan 12 ta qo‘llanadigan hisobning hand-reference jadvali va 1 ta noaniq sana rad etilishi lokalda to‘g‘ri chiqdi. 14-juftlik — qo‘llanmaydigan prognoz — AI rejasining rad etish siyosatini sinash uchun. Haqiqiy Gemini reja sinovi hali yakunlanmadi: ayrim so‘rovlarda schema/ma’no farqi kuzatildi, keyin API kvotasi tugadi. Reja prompti aniqlashtirildi va baholash endi kvota sabab tekshirilmagan holatlarni xatodan ajratadi; to‘liq live natija hali yo‘q.

Kompaniya pilotidan oldin zarur ishlar: real KPI va ustun ta’riflarini belgilash; anonimlashtirilgan kompaniya savollari uchun reference javoblarni tekshirish; Gemini kvota/xarajatini o‘lchash; uzoq ishlarni server restartida yo‘qotmaydigan queuega ko‘chirish; umumiy jamoa ma’lumotlari va ruxsatlarini loyihalash; parser/sandbox va deploymentni kompaniya muhitida mustahkamlash. Shu sabab hozirgi holat ishlaydigan **lokal demo**, ommaviy production emas.
