Autonomous Data Analyst Agent (Avtonom Data Tahlilchi Agenti)
Bu loyiha Data Science bilimlaringiz va FastAPI/Django backend qobiliyatingizni to‘liq ko‘rsatib beradi. Foydalanuvchi tizimga ixtiyoriy CSV yoki Excel faylini yuklaydi va chatbotga oddiy tilda savol beradi (masalan: "Mijozlarimiz qaysi oylarda eng ko‘p pul sarflashgan va keyingi oy uchun prognoz qanday?").
Agent qanday ishlaydi: Agent (masalan, LangChain yoki CrewAI yordamida qurilgan) yuklangan faylning strukturasini o‘rganadi, so‘rovga javob topish uchun o‘zi mustaqil ravishda Pandas/Python kodini yozadi, kodni xavfsiz muhitda ishga tushiradi (code interpreter) va natijani grafik (Matplotlib/Seaborn) hamda matn shaklida foydalanuvchiga qaytaradi. Agar yozgan kodida xatolik (Error) chiqsa, agent xatoni o‘zi o‘qib, kodni qaytadan tuzatadi (Self-Correction loop).
Sizning Stack'ingiz uchun afzalligi:
Backend: Fayllarni yuklash, WebSocket orqali real-vaqt rejimida agent statuslarini yuborish (FastAPI).
Data Science: Agent yozadigan kodlar to‘g‘ridan-to‘g‘ri siz School 21 da o‘rgangan EDA (Exploratory Data Analysis) va statistik modellarga tayanadi.

ozing loyihani tz sini tuzib chiqib boshlashimiz kerakda !