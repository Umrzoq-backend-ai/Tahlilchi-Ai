# Kompaniya pilot serveriga o‘rnatish

Bu yo‘riqnoma bitta Linux server, bitta Uvicorn worker va SQLite uchun. Login va foydalanuvchi egaligi bor; ommaviy SaaS uchun alohida worker/VM, parser izolyatsiyasi, resurs kvotalari va mustaqil xavfsizlik tekshiruvi hali kerak. Hozirgi xizmatni avval kompaniyaning nazorat qilinadigan pilot muhitida sinang.

## 1. Runtime va kataloglar

Python 3.12, Node.js 20.9+, `python3.12-venv`, Bubblewrap, systemd va Caddy kerak. Node faqat frontend build uchun kerak; ish vaqti FastAPI tayyor Next.js fayllarini beradi. AI sandbox `/usr/bin/python3.12` bilan ishlaydi; venv ham shu Python versiyasida yaratilishi kerak. Hostda unprivileged user namespaces ishlashi shart. Kernel/AppArmor ruxsat bermasa agent to‘xtaydi; hostda generated kodni ishlatish fallbacki yo‘q.

Loyihani `/opt/data-analyst`ga joylashtiring. Runtime kodini xizmat foydalanuvchisi o‘zgartira olmasin. Alohida OS foydalanuvchisi va ma’lumot katalogini yarating:

```bash
sudo useradd --system --home-dir /var/lib/data-analyst --shell /usr/sbin/nologin analyst
sudo install -d -m 0700 -o analyst -g analyst /var/lib/data-analyst
cd /opt/data-analyst
npm ci --prefix frontend
npm run build --prefix frontend
python3.12 -m venv .venv
.venv/bin/python -m pip install -r backend/requirements.lock
.venv/bin/python -m pip install --no-deps -e ./backend
cp -n .env.example .env
```

Frontenddagi har o‘zgarishdan so‘ng shu buildni qayta ishga tushiring va systemd xizmatini restart qiling (CSP skript hashlarini qayta hisoblaydi).

`.env`ni lokal tahrirlang; mavjud Gemini kalitini saqlang. Google orqali login kerak bo‘lsa, [Google OAuth yo‘riqnomasi](GOOGLE_LOGIN.md) bo‘yicha HTTPS callback URI’ni ro‘yxatdan o‘tkazing:

```dotenv
ANALYST_DATA_DIR=/var/lib/data-analyst
ANALYST_PUBLIC_ORIGIN=https://analyst.company.uz
ANALYST_SESSION_HOURS=12
```

`ANALYST_PUBLIC_ORIGIN` HTTPS origin bo‘lsin, yo‘l qo‘shmang. Bu sozlama cookie uchun `Secure`ni yoqadi, ruxsat etilgan Host/Originni belgilaydi va brauzer orqali birinchi administrator yaratishni o‘chiradi.

```bash
sudo chown root:analyst /opt/data-analyst/.env
sudo chmod 0640 /opt/data-analyst/.env
sudo -u analyst /opt/data-analyst/.venv/bin/python /opt/data-analyst/scripts/manage_users.py create-admin admin
```

Parol terminalda yashirin so‘raladi; argumentga yoki shell tarixiga kiritmang. Oldingi lokal bazani ko‘chirsangiz, serverni to‘xtatib butun `.data` katalogini (SQLite, WAL/SHM va uploads) birga ko‘chiring. Faqat eski egasiz datasetlarni birinchi adminga berish kerak bo‘lsa `create-admin admin --claim-legacy` ishlating. Mavjud egali fayllar o‘zgarmaydi.

## 2. Systemd va HTTPS

`deploy/analyst.service` `/opt/data-analyst` va `/var/lib/data-analyst` yo‘llarini kutadi. Uvicorn faqat `127.0.0.1:8000`da eshitadi; public kirish Caddy orqali bo‘ladi. Bir nechta worker ishlatmang: agent bajarilishi bitta processga tegishli.

```bash
sudo cp deploy/analyst.service /etc/systemd/system/analyst.service
sudo systemd-analyze verify /etc/systemd/system/analyst.service
sudo systemctl daemon-reload
sudo systemctl enable --now analyst
sudo systemctl status analyst
```

User namespaces Bubblewrap uchun zarur. `RestrictNamespaces=true` kabi izolyatsiyani buzadigan qo‘shimcha sozlamalarni tekshirmasdan qo‘shmang. Xizmat ichida sandbox ishga tushishini sintetik dataset bilan AI savoli orqali tekshiring.

`deploy/Caddyfile`dagi `analyst.example.com`ni `.env`dagi domen bilan almashtiring. DNS serverga yo‘naltirilgan, HTTPS uchun 80/443 portlar ochiq bo‘lishi kerak. Mavjud Caddy konfiguratsiyasiga ushbu sayt blokini qo‘shing; boshqa sayt sozlamalarini almashtirmang.

```bash
sudo caddy validate --config /etc/caddy/Caddyfile
sudo systemctl reload caddy
```

Caddy [reverse proxy](https://caddyserver.com/docs/caddyfile/directives/reverse_proxy) orqali HTTP va WebSocketni uzatadi. [Request body limiti](https://caddyserver.com/docs/caddyfile/directives/request_body) 22 020 096 bayt (21 MiB): 20 MiB fayl va multipart uchun zaxira. Upload limitini oshirsangiz bu limitni ham moslang. systemd katalog va fayl ruxsatlari [rasmiy hujjatda](https://www.freedesktop.org/software/systemd/man/latest/systemd.exec.html) berilgan.

## 3. Qabul qilish tekshiruvi

- HTTPS sahifada yaratilgan admin bilan kiring; ikkinchi xodim hisobini oching.
- Har bir hisobga alohida sintetik fayl yuklang; boshqa hisobda fayl va natija ko‘rinmasin.
- Savdo namunasi uchun oylik tahlil: mart `3 400 000`.
- Gemini bilan shu savolni berib, reja/kod/tekshiruv tugashini tekshiring.
- Chiqib qayta kiring; server restartdan keyin hisob va dataset saqlansin.
- Service logida API kaliti, parol yoki xom fayl qatorlari bo‘lmasin.

Konfiguratsiya shablonlari repoda tayyorlangan. Muayyan serverda Caddy TLS, DNS, systemd va namespace sozlamalari alohida tekshirilishi kerak; bu fayllarning o‘zi deployment amalga oshirilganini bildirmaydi.

## Hisoblarni boshqarish va saqlash

Administrator interfeysdan oddiy xodim hisobini ochadi. Administrator ham boshqa foydalanuvchi datasetini o‘qiy olmaydi. CLI OS server administratori uchun:

```bash
sudo -u analyst /opt/data-analyst/.venv/bin/python /opt/data-analyst/scripts/manage_users.py create-user employee
sudo -u analyst /opt/data-analyst/.venv/bin/python /opt/data-analyst/scripts/manage_users.py reset-password employee
```

Parolni tiklash shu foydalanuvchining barcha sessiyalarini bekor qiladi. Default sessiya 12 soat; logout faqat joriy sessiyani yopadi. Muvaffaqiyatsiz login urinishlari hisob va IP bo‘yicha 15 daqiqalik oynada cheklanadi. MFA, email orqali parol tiklash va hisobni o‘chirish interfeysi hozir yo‘q.

Backupni xizmat to‘xtaganida butun `/var/lib/data-analyst` katalogidan oling; `.env`ni alohida maxfiy saqlang. Backup ham foydalanuvchi fayllari va parol hashlarini saqlaydi. Tiklashni alohida katalog/serverda sinang. Fayllar TTL bilan avtomatik o‘chmaydi, disk hajmini kuzating.
