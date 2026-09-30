"use client";

import { useCallback, useEffect, useRef, useState, type ChangeEvent, type DragEvent, type FormEvent } from "react";
import { api, jsonBody, setCsrfToken } from "@/lib/api";
import { splitNumberedQuestions } from "@/lib/questions";
import type { AgentRun, AgentStatus, Analysis, AnalysisRequest, Dataset, GoogleStatus, Health, Profile, Session, User } from "@/lib/types";
import { DataTable } from "./Results";
import Results from "./Results";
import { BrandMark, Icon, Navigation, navigation, type View } from "./Design";

const number = new Intl.NumberFormat("uz-UZ", { maximumFractionDigits: 2 });
const shortDate = (value: string) => new Date(value).toLocaleDateString("uz-UZ", { day: "numeric", month: "short", year: "numeric" });
const stages: Record<string, string> = {
  queued: "Navbatda", checking_sandbox: "Xavfsiz muhit tekshirilmoqda", planning: "Savol uchun reja tuzilmoqda",
  reference: "Mustaqil hisoblash bajarilmoqda", generating: "Gemini kod yozmoqda", executing: "Kod izolyatsiyada ishlamoqda",
  validating: "Natijalar solishtirilmoqda", repairing: "Agent xatoni tuzatmoqda", succeeded: "Hisoblash tekshirildi.",
  failed: "Tahlil tugallanmadi", needs_input: "Aniqlik kerak", unsupported: "Hozir qo‘llanmaydi", cancelled: "Bekor qilindi",
  interrupted: "Server qayta ishga tushgan",
};
const examples = ["Oylar bo‘yicha tushum yig‘indisini ko‘rsat.", "Eng ko‘p tushum keltirgan 5 kategoriyani ko‘rsat.", "Jadvalda qaysi ustunlarda bo‘sh qiymatlar bor?"];
const operations: { id: AnalysisRequest["operation"]; icon: string; title: string; description: string }[] = [
  { id: "overview", icon: "▦", title: "Umumiy statistika", description: "Minimum, maksimum, o‘rtacha" },
  { id: "missing", icon: "◌", title: "Bo‘sh qiymatlar", description: "Ma’lumot to‘liqligi" },
  { id: "group", icon: "▥", title: "Guruhlar bo‘yicha", description: "Kategoriyalarni solishtiring" },
  { id: "monthly", icon: "↗", title: "Oylar bo‘yicha", description: "Vaqtdagi o‘zgarishlar" },
];

type AuthMode = "checking" | "setup" | "login" | "ready";

export default function Workspace() {
  const [view, setView] = useState<View>("home");
  const [menuOpen, setMenuOpen] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const [authMode, setAuthMode] = useState<AuthMode>("checking");
  const [user, setUser] = useState<User | null>(null);
  const [googleStatus, setGoogleStatus] = useState<GoogleStatus | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [userMessage, setUserMessage] = useState("");
  const [health, setHealth] = useState<Health | null>(null);
  const [agentStatus, setAgentStatus] = useState<AgentStatus | null>(null);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [history, setHistory] = useState<Analysis[]>([]);
  const [result, setResult] = useState<Analysis | null>(null);
  const [run, setRun] = useState<AgentRun | null>(null);
  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const [batchQuestions, setBatchQuestions] = useState<string[]>([]);
  const [batchRuns, setBatchRuns] = useState<AgentRun[]>([]);
  const [batchStopReason, setBatchStopReason] = useState<string | null>(null);
  const batchQueue = useRef<string[]>([]);
  const batchCursor = useRef(0);
  const [clarificationFor, setClarificationFor] = useState<string | null>(null);
  const [question, setQuestion] = useState("");
  const [operation, setOperation] = useState<AnalysisRequest["operation"]>("overview");
  const [groupColumn, setGroupColumn] = useState("");
  const [valueColumn, setValueColumn] = useState("");
  const [aggregation, setAggregation] = useState<"sum" | "mean" | "count">("sum");
  const [dateFormat, setDateFormat] = useState("ISO8601");
  const [sheet, setSheet] = useState("");
  const [delimiter, setDelimiter] = useState("");
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);
  const selectedId = useRef<string | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (authMode !== "ready") return;
    const frame = requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: "instant" });
      document.getElementById("page-title")?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [view, authMode]);

  const refreshList = useCallback(async () => setDatasets(await api<Dataset[]>("/datasets")), []);

  const openDataset = useCallback(async (id: string) => {
    selectedId.current = id;
    setError(""); setResult(null); setRun(null); setActiveRunId(null); setClarificationFor(null);
    batchQueue.current = []; batchCursor.current = 0; setBatchQuestions([]); setBatchRuns([]); setBatchStopReason(null);
    const [detail, analyses, runs] = await Promise.all([
      api<Dataset>(`/datasets/${id}`), api<Analysis[]>(`/datasets/${id}/analyses`), api<AgentRun[]>(`/datasets/${id}/runs`),
    ]);
    if (selectedId.current !== id) return;
    setDataset(detail); setHistory(analyses); setView("data"); setMenuOpen(false);
    setResult(analyses[0] ?? null);
    const profile = detail.profile;
    if (profile) {
      setSheet(profile.selected_sheet ?? "");
      setGroupColumn(profile.columns.find((c) => c.name === "order_date")?.name ?? profile.columns[0]?.name ?? "");
      setValueColumn(profile.columns.find((c) => c.name === "amount" && c.kind === "number")?.name ?? profile.columns.find((c) => c.kind === "number")?.name ?? "");
    }
    if (runs.length) {
      setRun(runs[0]);
      if (["queued", "running"].includes(runs[0].status)) setActiveRunId(runs[0].id);
      if (runs[0].status === "needs_input") setClarificationFor(runs[0].id);
    }
  }, []);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    (async () => {
      try {
        const [session, google] = await Promise.all([
          api<Session>("/auth/me"), api<GoogleStatus>("/auth/google/status"),
        ]);
        setGoogleStatus(google);
        const googleError = new URLSearchParams(window.location.search).get("google_error");
        if (googleError) {
          const messages: Record<string, string> = {
            denied: "Google kirishi bekor qilindi.",
            link: "Bu Google hisobi boshqa ish maydoniga bog‘langan.",
            setup: "Avval lokal administrator hisobini yarating.",
            failed: "Google kirishi yakunlanmadi. Qayta urinib ko‘ring.",
          };
          setError(messages[googleError] ?? messages.failed);
          window.history.replaceState(null, "", "/");
        }
        if (!session.authenticated) { setAuthMode(session.setup_allowed ? "setup" : "login"); return; }
        setCsrfToken(session.csrf_token); setUser(session.user); setAuthMode("ready");
        const [healthData, agentData, list] = await Promise.all([
          api<Health>("/health"), api<AgentStatus>("/agent/status"), api<Dataset[]>("/datasets"),
        ]);
        setHealth(healthData); setAgentStatus(agentData); setDatasets(list);
      } catch (cause) { setAuthMode("login"); setError(message(cause)); }
    })();
  }, []);

  useEffect(() => {
    if (!activeRunId || !dataset) return;
    let cancelled = false, timer: ReturnType<typeof setTimeout>;
    const id = activeRunId, datasetId = dataset.id;
    async function poll() {
      try {
        const current = await api<AgentRun>(`/runs/${id}`);
        if (cancelled || selectedId.current !== datasetId) return;
        setRun(current);
        if (batchQueue.current.length) setBatchRuns(existing => existing.map(item => item.id === id ? current : item));
        if (["queued", "running"].includes(current.status)) { timer = setTimeout(poll, 750); return; }
        if (current.status === "needs_input") { setClarificationFor(current.id); setQuestion(""); }
        if (current.analysis) setResult(current.analysis);
        if (current.status === "failed" && ["AI_QUOTA", "AI_AUTH", "AI_CONNECTION", "AI_UNAVAILABLE"].includes(current.error?.code ?? "")) {
          batchCursor.current = batchQueue.current.length;
          setBatchStopReason("Gemini cheklovi sabab qolgan savollar yuborilmadi.");
        }
        setHistory(await api<Analysis[]>(`/datasets/${datasetId}/analyses`));
        if (cancelled || selectedId.current !== datasetId) return;
        if (batchCursor.current < batchQueue.current.length) {
          const nextQuestion = batchQueue.current[batchCursor.current];
          const next = await api<AgentRun>(`/datasets/${datasetId}/questions`, jsonBody({
            question: nextQuestion, idempotency_key: crypto.randomUUID(),
          }));
          if (cancelled || selectedId.current !== datasetId) return;
          batchCursor.current += 1;
          setBatchRuns(existing => [...existing, next]);
          setRun(next); setActiveRunId(next.id);
        } else {
          setActiveRunId(null);
        }
      } catch (cause) { if (!cancelled) { setActiveRunId(null); if (batchQueue.current.length) setBatchStopReason("Navbat to‘xtadi; xatoni ko‘ring."); setError(message(cause)); } }
    }
    void poll();
    return () => { cancelled = true; clearTimeout(timer); };
  }, [activeRunId, dataset]);

  async function perform(task: () => Promise<void>) {
    if (busy) return;
    setBusy(true); setError(""); setNotice("");
    try { await task(); } catch (cause) { setError(message(cause)); }
    finally { setBusy(false); }
  }

  async function submitAuth(event: FormEvent) {
    event.preventDefault();
    await perform(async () => {
      const endpoint = authMode === "setup" ? "setup" : "login";
      const session = await api<Session>(`/auth/${endpoint}`, jsonBody({ username, password }));
      setPassword("");
      if (!session.authenticated) throw new Error("Kirish yakunlanmadi.");
      setCsrfToken(session.csrf_token);
      // Reload replaces all state and obtains current datasets through the normal entry path.
      window.location.reload();
    });
  }

  async function startGoogle(link: boolean) {
    await perform(async () => {
      const response = await api<{ url: string }>(
        link ? "/auth/google/link" : "/auth/google/start",
        link ? { method: "POST" } : {},
      );
      const target = new URL(response.url);
      if (target.protocol !== "https:" || target.hostname !== "accounts.google.com") {
        throw new Error("Google kirish manzili noto‘g‘ri.");
      }
      window.location.assign(target.href);
    });
  }

  async function logout() {
    await perform(async () => { await api<null>("/auth/logout", { method: "POST" }); setCsrfToken(""); window.location.reload(); });
  }

  async function addUser(event: FormEvent) {
    event.preventDefault();
    await perform(async () => {
      const created = await api<User>("/auth/users", jsonBody({ username: newUsername, password: newPassword }));
      setNewUsername(""); setNewPassword(""); setUserMessage(`${created.username} hisobi yaratildi.`);
    });
  }

  async function uploadFile(file?: File) {
    if (!file) return;
    await perform(async () => {
      if (!/\.(csv|xlsx)$/i.test(file.name)) throw new Error("Faqat CSV yoki XLSX fayl tanlang.");
      if (health && file.size > health.max_upload_bytes) throw new Error("Fayl yuklash limitidan oshgan.");
      const form = new FormData(); form.append("file", file);
      const query = delimiter ? `?delimiter=${encodeURIComponent(delimiter === "tab" ? "\t" : delimiter)}` : "";
      const created = await api<Dataset>(`/datasets${query}`, { method: "POST", body: form });
      await refreshList(); await openDataset(created.id);
      setNotice("Fayl yuklandi va tuzilishi tekshirildi.");
    });
  }

  function dropFile(event: DragEvent) {
    event.preventDefault(); setDragging(false);
    void uploadFile(event.dataTransfer.files[0]);
  }

  async function loadDemo() {
    await perform(async () => {
      const response = await fetch("/api/v1/demo.csv", { cache: "no-store" });
      if (!response.ok) throw new Error("Namuna faylni olib bo‘lmadi.");
      const blob = await response.blob();
      const form = new FormData(); form.append("file", new File([blob], "sales.csv", { type: "text/csv" }));
      const created = await api<Dataset>("/datasets", { method: "POST", body: form });
      await refreshList(); await openDataset(created.id);
      setNotice("Savdo namunasi ochildi.");
    });
  }

  async function reparse() {
    if (!dataset) return;
    await perform(async () => {
      const created = await api<Dataset>(`/datasets/${dataset.id}/versions`, jsonBody({ sheet }));
      await refreshList(); await openDataset(created.id);
      setNotice("Yangi sheet alohida versiya sifatida ochildi.");
    });
  }

  async function analyze(event: FormEvent) {
    event.preventDefault();
    if (!dataset) return;
    await perform(async () => {
      const payload: AnalysisRequest = { operation };
      if (operation === "group" || operation === "monthly") {
        payload.group_column = groupColumn; payload.aggregation = aggregation;
        if (aggregation !== "count") payload.value_column = valueColumn;
        if (operation === "monthly") payload.date_format = dateFormat;
      }
      const analysis = await api<Analysis>(`/datasets/${dataset.id}/analyses`, jsonBody(payload));
      setResult(analysis); setHistory(await api<Analysis[]>(`/datasets/${dataset.id}/analyses`));
      setView("results"); setNotice("Tahlil tayyor.");
    });
  }

  async function ask(event: FormEvent) {
    event.preventDefault();
    if (!dataset) return;
    await perform(async () => {
      const trimmed = question.trim();
      if (trimmed.length < 3) throw new Error("Savol kamida 3 belgidan iborat bo‘lsin.");
      const questions = clarificationFor ? [trimmed] : splitNumberedQuestions(trimmed);
      const created = await api<AgentRun>(`/datasets/${dataset.id}/questions`, jsonBody({
        question: questions[0], idempotency_key: crypto.randomUUID(), clarification_for: clarificationFor,
      }));
      batchQueue.current = questions.length > 1 ? questions : [];
      batchCursor.current = questions.length > 1 ? 1 : 0;
      setBatchQuestions(batchQueue.current); setBatchRuns(questions.length > 1 ? [created] : []); setBatchStopReason(null);
      setRun(created); setResult(null); setClarificationFor(null); setActiveRunId(created.id);
    });
  }

  async function cancelRun() {
    if (!activeRunId) return;
    await perform(async () => {
      await api<AgentRun>(`/runs/${activeRunId}/cancel`, { method: "POST" });
      batchCursor.current = batchQueue.current.length;
      if (batchQueue.current.length) setBatchStopReason("Qolgan savollar bekor qilindi.");
      setNotice("Joriy savol bekor qilinmoqda; navbatdagi savollar yuborilmaydi.");
    });
  }

  async function deleteDataset() {
    if (!dataset || !window.confirm(`“${dataset.name}” fayli va unga tegishli natijalar o‘chirilsinmi?`)) return;
    await perform(async () => {
      await api<null>(`/datasets/${dataset.id}`, { method: "DELETE" });
      selectedId.current = null; setDataset(null); setResult(null); setHistory([]); setRun(null); setActiveRunId(null);
      batchQueue.current = []; batchCursor.current = 0; setBatchQuestions([]); setBatchRuns([]); setBatchStopReason(null);
      await refreshList(); setView("home"); setNotice("Fayl va tahlillari o‘chirildi.");
    });
  }

  function navigate(next: View) {
    setView(next); setMenuOpen(false);
  }

  if (authMode !== "ready") return <main className="auth-shell"><section id="auth-panel" className="auth-card">
    <div className="auth-brand"><BrandMark/><h1>Tahlilchi Studio</h1><p>Biznes ma’lumotlarini oson va aniq tahlil qilish platformasi</p></div>
    <div className="auth-local"><Icon name="shield"/><span>Hisoblash o‘z serveringizda</span></div>
    <h2>{authMode === "setup" ? "Ish maydonini yarating" : authMode === "checking" ? "Ish maydoni ochilmoqda…" : "Tizimga kirish"}</h2>
    <p className="auth-copy">{authMode === "setup" ? "Birinchi administrator hisobingizni yarating. Mavjud lokal fayllar shu hisobga biriktiriladi." : "Ma’lumotlaringiz bilan ishlashni davom ettiring."}</p>
    {error && <p className="notice error" role="alert">{error}</p>}
    {authMode === "login" && <div className="google-login-area">
      <button id="google-login" type="button" className="google-button" disabled={busy || !googleStatus?.configured} onClick={() => void startGoogle(false)}><GoogleMark/> Google orqali kirish</button>
      {!googleStatus?.configured && <p className="google-hint">Google kirishi hozir sozlanmagan. Login va parol orqali kiring.</p>}
      <div className="auth-divider"><span>yoki login orqali</span></div>
    </div>}
    {authMode !== "checking" && <form id="auth-form" onSubmit={submitAuth} className="form-stack">
      <label htmlFor="auth-username">Login</label><input id="auth-username" value={username} onChange={e => setUsername(e.target.value)} autoComplete="username" pattern="[a-zA-Z0-9_.\-]+" minLength={3} maxLength={64} required placeholder="masalan: aziza"/>
      <label htmlFor="auth-password">Parol</label><div className="password-field"><input id="auth-password" type={passwordVisible ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} autoComplete={authMode === "setup" ? "new-password" : "current-password"} minLength={12} maxLength={128} required placeholder={authMode === "setup" ? "Kamida 12 belgi" : "Parolingizni kiriting"}/><button type="button" aria-label={passwordVisible ? "Parolni yashirish" : "Parolni ko‘rsatish"} aria-pressed={passwordVisible} onClick={() => setPasswordVisible(!passwordVisible)}><Icon name="eye"/></button></div>
      <button id="auth-submit" className="button primary full" type="submit" disabled={busy}>{busy ? "Tekshirilmoqda…" : authMode === "setup" ? "Hisob yaratish" : "Tizimga kirish"}<Icon name="arrow"/></button>
    </form>}
    <p className="auth-note">Savol va ustun nomlari Gemini’ga yuborilishi mumkin. Fayl qatorlari shu serverda hisoblanadi.</p>
  </section><p className="auth-footer">TAHLILCHI STUDIO · MA’LUMOTDAN QARORGACHA</p></main>;

  const profile: Profile | undefined = dataset?.profile;
  const numericColumns = profile?.columns.filter(c => c.kind === "number") ?? [];
  const activeRun = run && ["queued", "running"].includes(run.status);
  const currentRuns = batchQuestions.length ? batchRuns : run ? [run] : [];
  const pageTitle = { home: "Xush kelibsiz!", data: "Ma’lumotlar to‘plami", ai: "Sun’iy intellekt tahlilchisi", results: "Tahlil natijalari", account: "Hisob sozlamalari" }[view];

  return <div className="app-shell">
    <a className="skip-link" href="#main-content">Asosiy mazmunga o‘tish</a>
    <header className="topbar"><button ref={menuButton} id="menu-toggle" className="icon-button mobile-menu-button" aria-label={menuOpen ? "Menyuni yopish" : "Menyuni ochish"} aria-expanded={menuOpen} aria-controls="app-sidebar" onClick={() => setMenuOpen(!menuOpen)}><Icon name={menuOpen ? "close" : "menu"}/></button><div className="breadcrumb"><BrandMark/><span>{navigation.find(item => item.id === view)?.label}</span>{dataset && <><span className="topbar-slash">/</span><span className="breadcrumb-file" title={dataset.name}>{dataset.name}</span></>}</div><div className="topbar-right"><span className="language-label">O‘zbekcha / UZ</span><button className="avatar" aria-label="Hisob sozlamalarini ochish" onClick={() => navigate("account")}>{user?.username[0]?.toUpperCase()}</button></div></header>
    <aside id="app-sidebar" className={`sidebar ${menuOpen ? "is-open" : ""}`} onKeyDown={event => { if (event.key === "Escape") { setMenuOpen(false); menuButton.current?.focus(); } }}>
      <button type="button" className="brand" onClick={() => navigate("home")}><BrandMark/><span>Tahlilchi Studio<small>BIZNES TAHLIL PLATFORMASI</small></span></button>
      <div className="sidebar-section">ASOSIY MENYU</div>
      <Navigation view={view} navigate={navigate} hasDataset={!!dataset}/>
      <div className="sidebar-section"><span>FAYLLARINGIZ</span><span className="count-badge">{datasets.length}</span></div>
      <nav id="dataset-list" aria-label="Yuklangan fayllar" className="dataset-list">{datasets.length === 0 && <p className="sidebar-empty">Hali fayl yuklanmagan.</p>}{datasets.map(item => <button key={item.id} type="button" className={`dataset-item ${item.id === dataset?.id ? "selected" : ""}`} onClick={() => void perform(() => openDataset(item.id))} disabled={busy} title={item.name}><Icon name="file"/><span>{item.name}</span></button>)}</nav>
      <button id="add-file" className="sidebar-add" type="button" onClick={() => navigate("home")}><Icon name="upload"/> Yangi fayl yuklash</button>
      {datasets.length === 0 && <button id="demo-sidebar-button" className="sidebar-demo" type="button" onClick={() => void loadDemo()} disabled={busy}><Icon name="spark"/><span><strong>Namunada sinab ko‘rish</strong><small>Tayyor savdo jadvali</small></span></button>}
      <div className="sidebar-bottom"><div className="secure-note"><Icon name="shield"/><span>Hisoblash shu serverda<small>Fayl qatorlari AIga yuborilmaydi.</small></span></div><button className="workspace-label" onClick={() => navigate("account")}><span className="avatar">{user?.username[0]?.toUpperCase()}</span><span><strong>{user?.google_email ?? user?.username}</strong><small>{user?.role === "admin" ? "Administrator" : "Shaxsiy ish maydoni"}</small></span></button><button id="logout-button" className="logout-button" onClick={() => void logout()} disabled={busy}><Icon name="logout"/> Hisobdan chiqish</button></div>
    </aside>
    <main className="main-area" id="main-content"><div className="content">
      <div className="hero"><div><p className="eyebrow">ANALITIKA ISH MAYDONI</p><h1 id="page-title" tabIndex={-1}>{pageTitle}</h1><p>{{home: "Faylingizni yuklang. Savol bering. Raqamlarni tushuning.", data: "Tahlildan oldin ma’lumotlaringiz tuzilishi va sifatini tekshiring.", ai: "Savolingizdan tekshirilgan hisob-kitobgacha.", results: "Hisoblangan javoblar, diagrammalar va oldingi tahlillar.", account: "Hisobingiz va kirish usullarini boshqaring."}[view]}</p></div><span className="hero-pill"><Icon name="shield"/><span>Ma’lumotlar o‘z serveringizda<small>Hisob-kitoblar faylingiz asosida</small></span></span></div>
      {error && <div className="notice error" role="alert">{error}<button type="button" onClick={() => setError("")} aria-label="Xabarni yopish">×</button></div>}
      {notice && <div className="notice success-notice" role="status">{notice}<button type="button" onClick={() => setNotice("")} aria-label="Xabarni yopish">×</button></div>}
      <div hidden={view !== "home"}>
        <div className="upload-layout"><section id="upload-panel" className="card upload-card"><div id="drop-zone" className={`drop-zone ${dragging ? "dragging" : ""}`} aria-busy={busy} onDragOver={event => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={dropFile}><span className="upload-symbol"><Icon name="upload"/></span><h2>CSV yoki Excel faylni<br/>shu yerga tashlang</h2><p>Ma’lumotlaringiz tuzilishi va sifati<br/>avtomatik tekshiriladi.</p><button type="button" className="button primary" onClick={() => fileInput.current?.click()} disabled={busy}><Icon name="upload"/>{busy ? "Yuklanmoqda…" : "Kompyuterdan fayl tanlash"}</button><input ref={fileInput} id="file-input" type="file" accept=".csv,.xlsx" hidden onChange={(event: ChangeEvent<HTMLInputElement>) => { void uploadFile(event.target.files?.[0]); event.target.value = ""; }}/><div className="file-types"><span><Icon name="check"/> CSV</span><span><Icon name="check"/> XLSX</span></div><small>{health ? number.format(health.max_upload_bytes / 1024 ** 2) : 20} MiB gacha · 100 000 qatorgacha</small></div><div className="upload-foot"><label>CSV ajratgichi <select value={delimiter} onChange={e => setDelimiter(e.target.value)}><option value="">Avtomatik</option><option value=",">Vergul (,)</option><option value=";">Nuqtali vergul (;)</option><option value="tab">Tab</option><option value="|">Vertikal chiziq (|)</option></select></label><span className="muted">Excel uchun sheet tanlash mumkin</span></div></section>
        <section className="card demo-card"><span className="demo-label"><Icon name="spark"/> TEZKOR DEMO</span><h2>Avval namunada<br/>sinab ko‘ring</h2><p>Faylingiz hozir yoningizda emasmi? Tayyor savdo ma’lumotlari bilan platformani o‘rganing.</p><div className="demo-file"><Icon name="file"/><div><strong>sales.csv</strong><small>Sun’iy savdo ma’lumotlari</small></div></div><div className="demo-bars" aria-hidden="true"><i/><i/><i/><i/><i/><i/></div><button id="demo-button" className="button secondary full" onClick={() => void loadDemo()} disabled={busy}>Namunada sinab ko‘rish<Icon name="arrow"/></button><small>Demo fayl ish maydoningizga qo‘shiladi.</small></section></div>
        <div className="section-title"><h2>Tizim qanday ishlaydi?</h2><span>UCHTA ODDIY QADAM</span></div><div className="intro-grid">{[{icon: "upload" as const, title: "Faylni yuklang", text: "CSV yoki Excel jadvalingizni yuklang. Bo‘sh kataklar va takroriy qatorlarni tekshiring."}, {icon: "spark" as const, title: "O‘zbek tilida savol bering", text: "Masalan: “Oylar bo‘yicha jami savdo tushumi qancha?”"}, {icon: "chart" as const, title: "Natijani tushuning", text: "Hisoblangan javob, jadval va grafikni ko‘ring. Natijani yuklab oling."}].map((item, index) => <article key={item.title}><span className="intro-number">0{index + 1}</span><Icon name={item.icon}/><p className="eyebrow">{index + 1}-QADAM</p><h3>{item.title}</h3><p>{item.text}</p></article>)}</div>
        <div className="section-title"><h2>Fayllaringiz</h2><span>{datasets.length} TA FAYL</span></div>{datasets.length ? <div className="home-files">{datasets.map(item => <button className="home-file" key={item.id} onClick={() => void perform(() => openDataset(item.id))} disabled={busy}><Icon name="file"/><span><strong>{item.name}</strong><small>{shortDate(item.created_at)} · {number.format(item.size_bytes / 1024)} KB</small></span><Icon name="arrow"/></button>)}</div> : <div className="card empty-state"><Icon name="file"/><h3>Hozircha fayl yuklanmagan</h3><p>Birinchi faylingizni yuklang yoki tayyor namunani oching.</p></div>}
      </div>
      {dataset && profile && <div id="dataset-panel" className="dataset-view" hidden={view === "home" || view === "account"}>
        <div hidden={view !== "data"}><div className="dataset-heading card"><div><p className="eyebrow">FAOL JADVAL</p><h2 id="dataset-name">{dataset.name}</h2><p className="muted">{number.format(dataset.size_bytes / 1024)} KB · {shortDate(dataset.created_at)}</p></div><div className="dataset-actions"><button className="button primary" onClick={() => navigate("ai")}><Icon name="spark"/>AI Tahlilchiga o‘tish</button><button id="delete-dataset" className="quiet-button danger" onClick={() => void deleteDataset()} disabled={busy}>Faylni o‘chirish</button></div></div>
        <div className="metrics"><article><span>Jami qatorlar <Icon name="file"/></span><strong id="metric-rows">{number.format(profile.row_count)}</strong><small>Jadvaldagi yozuvlar</small></article><article><span>Ustunlar soni <Icon name="chart"/></span><strong id="metric-columns">{number.format(profile.column_count)}</strong><small>Ma’lumot maydonlari</small></article><article><span>Bo‘sh kataklar <Icon name="file"/></span><strong id="metric-missing">{number.format(profile.missing_cells)}</strong><small>{profile.missing_cells ? "Diqqat talab qiladi" : "Bo‘sh kataklar yo‘q"}</small></article><article><span>Takroriy qatorlar <Icon name="check"/></span><strong id="metric-duplicates">{number.format(profile.duplicate_rows)}</strong><small>Avtomatik o‘chirilmaydi</small></article></div>
        {profile.warnings.length > 0 && <div className="warnings">{profile.warnings.map((warning, index) => <p key={index}>{warning}</p>)}</div>}
        {profile.sheets.length > 1 && <div className="sheet-controls"><label>Excel sheet <select value={sheet} onChange={e => setSheet(e.target.value)}>{profile.sheets.map(name => <option key={name} value={name}>{name}</option>)}</select></label><button type="button" className="button secondary" onClick={() => void reparse()} disabled={busy}>Sheetni ochish</button></div>}
        {profile.columns.some(c => c.date_format_hint === "ISO8601") && <div className="date-banner"><Icon name="check"/><div><strong>Sana formati tekshirildi</strong><p>{profile.columns.filter(c => c.date_format_hint === "ISO8601").map(c => c.name).join(", ")} · YYYY-MM-DD</p></div><span className="status-badge">Tasdiqlangan format</span></div>}
        <section className="card preview-card"><div className="card-heading"><div><span className="step-icon"><Icon name="file"/></span><div><p className="eyebrow">MA’LUMOTGA BIR QARASH</p><h2>Jadval ko‘rinishi</h2></div></div><span className="muted">Dastlabki 20 qator</span></div><DataTable table={profile.preview} label="Dataset preview"/><details className="schema-details"><summary>Ustun turlari va sifati</summary><DataTable label="Ustun turlari" table={{ columns: ["Ustun", "Turi", "Bo‘sh", "Noyob qiymatlar", "Sana formati"], rows: profile.columns.map(c => [c.name, c.kind, c.missing, c.unique, c.date_format_hint === "ISO8601" ? "YYYY-MM-DD" : "—"]) }}/></details></section>
<div className="dataset-cta card"><div><h3>Tahlil qilishga tayyormisiz?</h3><p>Savol bering yoki AI kalitisiz tezkor hisoblashdan foydalaning.</p></div><button className="button primary" onClick={() => navigate("ai")}>Tahlilga o‘tish<Icon name="arrow"/></button></div></div>
        <div hidden={view !== "ai"}><div className="agent-stats"><article><span>JAMI SAVOLLAR</span><strong>{batchQuestions.length || currentRuns.length}</strong></article><article><span>HISOBLANGAN</span><strong>{currentRuns.filter(r => r.status === "succeeded").length}</strong></article><article><span>JARAYON / NAVBAT</span><strong>{currentRuns.filter(r => ["queued", "running"].includes(r.status)).length + (batchStopReason ? 0 : Math.max(0, batchQuestions.length - batchRuns.length))}</strong></article><article><span>DIQQAT TALAB</span><strong>{currentRuns.filter(r => ["needs_input", "failed", "unsupported", "interrupted"].includes(r.status)).length}</strong></article></div>
        <section className="card agent-card"><div className="card-heading"><div><span className="step-icon ai"><Icon name="spark"/></span><div><p className="eyebrow">AI YORDAMCHI</p><h2>Savollaringizni o‘zbek tilida yozing</h2></div></div><span className={`agent-badge ${agentStatus?.configured ? "enabled" : ""}`}>{agentStatus?.configured ? `${agentStatus.provider} · ${agentStatus.model}` : "Sozlanmagan"}</span></div>
          <p className="card-description">{agentStatus?.message ?? "Agent reja tuzadi, hisoblaydi va natijani mustaqil tekshiradi."}</p>
          <form onSubmit={ask} className="agent-form"><label htmlFor="question-input">Jadvalingiz haqida savol</label><p className="batch-hint">Bir nechta savol uchun har birini yangi qatorda 1., 2., 3. deb boshlang (ko‘pi bilan 5 ta). Har biri alohida tekshiriladi.</p><textarea id="question-input" value={question} onChange={e => setQuestion(e.target.value)} minLength={3} maxLength={2000} rows={5} required placeholder={clarificationFor ? "Agent savoliga aniqlik kiriting…" : "Masalan, qaysi oyda tushum eng yuqori? Yoki 1., 2., 3. deb savollarni alohida yozing."} disabled={busy || !agentStatus?.configured}/>
            <div className="suggestions">{examples.map(example => <button key={example} type="button" onClick={() => { setQuestion(example); setClarificationFor(null); }}>{example}</button>)}</div>
            {clarificationFor && <button type="button" className="quiet-button reset-question" onClick={() => { setClarificationFor(null); setQuestion(""); }}>Yangi mustaqil savol</button>}
            <div className="card-footer"><p>{agentStatus?.data_policy ?? "Savol va ustun nomlari Gemini’ga yuboriladi; fayl qatorlari yuborilmaydi."}</p><button id="ask-button" className="button primary" type="submit" disabled={busy || !!activeRunId || !agentStatus?.configured}>Savol yuborish →</button></div>
          </form>
          {run && batchQuestions.length === 0 && <div id="agent-progress" className="run-progress" aria-live="polite"><div><span className={activeRun ? "working-dot" : "result-dot"}/><span id="agent-stage">{stages[run.stage] ?? run.stage}</span></div>{activeRun && <button id="cancel-run" type="button" className="quiet-button danger" onClick={() => void cancelRun()} disabled={busy}>Bekor qilish</button>}{!activeRun && <p id="agent-message">{run.analysis?.result.summary ?? run.message ?? run.error?.message ?? stages[run.status] ?? run.status}</p>}{run.plan && <details className="provenance"><summary>Agent savolni qanday talqin qildi?</summary><p>{run.plan.explanation}</p><pre>{run.plan.analysis ? JSON.stringify(run.plan.analysis, null, 2) : ""}</pre></details>}</div>}
          {batchQuestions.length > 0 && <div id="batch-results" className="batch-results" aria-live="polite"><div className="batch-title"><h3>Savollar bo‘yicha natijalar</h3>{activeRun && <button id="cancel-run" type="button" className="quiet-button danger" onClick={() => void cancelRun()} disabled={busy}>Navbatni bekor qilish</button>}</div>{batchQuestions.map((item, index) => {
            const itemRun = batchRuns[index];
            return <article key={`${index}-${item}`} className="batch-item" data-status={itemRun?.status ?? (batchStopReason ? "stopped" : "pending")}><div className="batch-item-head"><strong>{index + 1}. {item}</strong><span className="status-badge">{itemRun ? (stages[itemRun.stage] ?? itemRun.status) : (batchStopReason ?? "Navbatda")}</span></div>
              {itemRun?.analysis && <><p>{itemRun.analysis.result.summary}</p><DataTable table={itemRun.analysis.result.table} label={`${index + 1}-savol natijasi`}/><button type="button" className="quiet-button" onClick={() => { setResult(itemRun.analysis ?? null); navigate("results"); }}>To‘liq natija va grafikni ko‘rish ↗</button></>}
              {itemRun?.status === "needs_input" && <><p>{itemRun.message}</p><button type="button" className="quiet-button" onClick={() => { setClarificationFor(itemRun.id); setQuestion(""); document.getElementById("question-input")?.focus(); }}>Aniqlik kiritish ↗</button></>}
              {itemRun?.status === "unsupported" && <p>{itemRun.message ?? "Bu savol hozir qo‘llanmaydi."}</p>}
              {itemRun?.status === "failed" && <p className="danger">{itemRun.error?.message ?? "Hisoblash tugallanmadi."}</p>}
            </article>;
          })}</div>}
        </section>
{result && <div className="ready-result"><Icon name="check"/><span>Tayyor natijangiz bor</span><button className="button secondary" onClick={() => navigate("results")}>Natijani ko‘rish<Icon name="arrow"/></button></div>}
        <section className="card analysis-card"><div className="card-heading"><div><span className="step-icon">03</span><div><p className="eyebrow">TAYYOR HISOBLASHLAR</p><h2>Tezkor tahlil</h2></div></div><span className="muted">API kalitisiz ishlaydi</span></div><p className="card-description">Hisoblash fayldagi haqiqiy qiymatlar asosida bajariladi.</p><form onSubmit={analyze}><div className="operation-grid">{operations.map(item => <button key={item.id} type="button" data-operation={item.id} className={`operation ${operation === item.id ? "active" : ""}`} aria-pressed={operation === item.id} onClick={() => setOperation(item.id)}><span>{item.icon}</span><strong>{item.title}</strong><small>{item.description}</small></button>)}</div>
          {(operation === "group" || operation === "monthly") && <div className="analysis-options"><label>{operation === "monthly" ? "Sana ustuni" : "Guruhlash ustuni"}<select id="group-column" value={groupColumn} onChange={e => setGroupColumn(e.target.value)}>{profile.columns.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}</select></label><label>Hisoblash usuli<select id="aggregation" value={aggregation} onChange={e => setAggregation(e.target.value as typeof aggregation)}><option value="sum">Yig‘indi</option><option value="mean">O‘rtacha qiymat</option><option value="count">Qatorlar soni</option></select></label>{aggregation !== "count" && <label>Sonli ustun<select id="value-column" value={valueColumn} onChange={e => setValueColumn(e.target.value)}>{numericColumns.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}</select></label>}{operation === "monthly" && <label>Sana formati<select id="date-format" value={dateFormat} onChange={e => setDateFormat(e.target.value)}><option value="ISO8601">YYYY-MM-DD</option><option value="%d/%m/%Y">DD/MM/YYYY</option><option value="%m/%d/%Y">MM/DD/YYYY</option><option value="%d.%m.%Y">DD.MM.YYYY</option></select></label>}</div>}
          <div className="card-footer"><p>Natija jadval, grafik va hisoblash manbasi bilan chiqadi.</p><button id="analyze-button" className="button primary" type="submit" disabled={busy}>{busy ? "Hisoblanmoqda…" : "Tahlil qilish →"}</button></div></form></section>
</div>
        <div hidden={view !== "results"}>{result ? <Results analysis={result}/> : <section className="card empty-state"><Icon name="chart"/><h2>Hali tahlil natijasi yo‘q</h2><p>AIga savol bering yoki tezkor hisoblashni tanlang.</p><button className="button primary" onClick={() => navigate("ai")}>Tahlilni boshlash<Icon name="arrow"/></button></section>}
        {history.length > 0 && <section className="history-panel"><div className="section-title"><h2>Fayl bo‘yicha tahlillar tarixi</h2><span>{history.length} TA NATIJA</span></div><div id="history-list">{history.map(item => <button key={item.id} className={`history-item ${item.id === result?.id ? "selected" : ""}`} type="button" onClick={() => { setResult(item); window.scrollTo({ top: 0, behavior: "instant" }); }}><Icon name="clock"/><span><strong>{operations.find(op => op.id === item.request?.operation)?.title ?? "Tahlil"}</strong><small>{item.result?.summary ?? "Natija"}</small></span><time>{shortDate(item.created_at)}</time><Icon name="arrow"/></button>)}</div></section>}</div>
      </div>}
      <section hidden={view !== "account"} className="card account-card"><div className="account-heading"><span className="avatar">{user?.username[0]?.toUpperCase()}</span><div><h2>{user?.username}</h2><p>{user?.role === "admin" ? "Administrator" : "Foydalanuvchi"}</p></div></div>
        {googleStatus?.configured && <div className="google-link-control">
          {user?.google_email
            ? <p className="google-linked">✓ Google: {user.google_email}</p>
            : <button type="button" className="google-link-button" onClick={() => void startGoogle(true)} disabled={busy}><GoogleMark /> Google hisobini bog‘lash</button>}
        </div>}
        {user?.role === "admin" && <details className="admin-panel"><summary>＋ Xodim hisobi</summary><form onSubmit={addUser} className="form-stack"><label>Login<input value={newUsername} onChange={e => setNewUsername(e.target.value)} minLength={3} maxLength={64} pattern="[a-zA-Z0-9_.\-]+" required /></label><label>Parol<input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} minLength={12} maxLength={128} required /></label><button className="button secondary" type="submit" disabled={busy}>Hisob yaratish</button><p role="status">{userMessage}</p></form></details>}
<p className="account-note">Har bir hisob o‘z fayllari va tahlillari bilan ishlaydi.</p><button className="button secondary" onClick={() => void logout()} disabled={busy}><Icon name="logout"/>Hisobdan chiqish</button></section>
      <footer className="page-footer"><span>Tahlilchi Studio · Ma’lumotga asoslangan qarorlar</span><span>Hisoblash o‘z serveringizda</span></footer>
    </div></main><Navigation view={view} navigate={navigate} hasDataset={!!dataset} mobile/>
  </div>;
}

function message(cause: unknown) { return cause instanceof Error ? cause.message : "So‘rov bajarilmadi. Qayta urinib ko‘ring."; }

function GoogleMark() {
  return <svg viewBox="0 0 48 48" aria-hidden="true" className="google-mark">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.27 5.48-4.79 7.18l7.73 6C44.39 38.03 46.98 31.68 46.98 24.55z"/>
    <path fill="#FBBC05" d="M10.53 28.59A14.41 14.41 0 0 1 9.75 24c0-1.59.27-3.13.76-4.59l-7.97-6.2A23.89 23.89 0 0 0 0 24c0 3.87.93 7.52 2.56 10.79l7.97-6.2z"/>
    <path fill="#34A853" d="M24 48c6.48 0 11.92-2.13 15.89-5.8l-7.73-6c-2.14 1.44-4.88 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.97 6.2C6.51 42.62 14.62 48 24 48z"/>
  </svg>;
}
