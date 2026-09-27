"use client";

import { useCallback, useEffect, useRef, useState, type ChangeEvent, type DragEvent, type FormEvent } from "react";
import { api, jsonBody, setCsrfToken } from "@/lib/api";
import type { AgentRun, AgentStatus, Analysis, AnalysisRequest, Dataset, GoogleStatus, Health, Profile, Session, User } from "@/lib/types";
import { DataTable } from "./Results";
import Results from "./Results";

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
  const [clarificationFor, setClarificationFor] = useState<string | null>(null);
  const [question, setQuestion] = useState("");
  const [operation, setOperation] = useState<AnalysisRequest["operation"]>("overview");
  const [groupColumn, setGroupColumn] = useState("");
  const [valueColumn, setValueColumn] = useState("");
  const [aggregation, setAggregation] = useState<"sum" | "mean" | "count">("sum");
  const [dateFormat, setDateFormat] = useState("ISO8601");
  const [sheet, setSheet] = useState("");
  const [delimiter, setDelimiter] = useState("");
  const [showUpload, setShowUpload] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);
  const selectedId = useRef<string | null>(null);
  const started = useRef(false);

  const refreshList = useCallback(async () => setDatasets(await api<Dataset[]>("/datasets")), []);

  const openDataset = useCallback(async (id: string) => {
    selectedId.current = id;
    setError(""); setShowUpload(false); setResult(null); setRun(null); setActiveRunId(null); setClarificationFor(null);
    const [detail, analyses, runs] = await Promise.all([
      api<Dataset>(`/datasets/${id}`), api<Analysis[]>(`/datasets/${id}/analyses`), api<AgentRun[]>(`/datasets/${id}/runs`),
    ]);
    if (selectedId.current !== id) return;
    setDataset(detail); setHistory(analyses);
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
        if (["queued", "running"].includes(current.status)) { timer = setTimeout(poll, 750); return; }
        setActiveRunId(null);
        if (current.status === "needs_input") { setClarificationFor(current.id); setQuestion(""); }
        if (current.analysis) setResult(current.analysis);
        setHistory(await api<Analysis[]>(`/datasets/${datasetId}/analyses`));
      } catch (cause) { if (!cancelled) { setActiveRunId(null); setError(message(cause)); } }
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
      setNotice("Tahlil tayyor. Natija quyida ko‘rsatilgan.");
    });
  }

  async function ask(event: FormEvent) {
    event.preventDefault();
    if (!dataset) return;
    await perform(async () => {
      const trimmed = question.trim();
      if (trimmed.length < 3) throw new Error("Savol kamida 3 belgidan iborat bo‘lsin.");
      const created = await api<AgentRun>(`/datasets/${dataset.id}/questions`, jsonBody({
        question: trimmed, idempotency_key: crypto.randomUUID(), clarification_for: clarificationFor,
      }));
      setRun(created); setResult(null); setClarificationFor(null); setActiveRunId(created.id);
    });
  }

  async function cancelRun() {
    if (!activeRunId) return;
    await perform(async () => {
      await api<AgentRun>(`/runs/${activeRunId}/cancel`, { method: "POST" });
      setNotice("Bekor qilish so‘raldi. Joriy chaqiruv tugashi kutilmoqda.");
    });
  }

  async function deleteDataset() {
    if (!dataset || !window.confirm(`“${dataset.name}” fayli va unga tegishli natijalar o‘chirilsinmi?`)) return;
    await perform(async () => {
      await api<null>(`/datasets/${dataset.id}`, { method: "DELETE" });
      selectedId.current = null; setDataset(null); setResult(null); setHistory([]); setRun(null); setActiveRunId(null);
      await refreshList(); setNotice("Fayl va tahlillari o‘chirildi.");
    });
  }

  if (authMode !== "ready") return <main className="auth-shell"><section id="auth-panel" className="auth-card">
    <div className="brand-mark">d<span>.</span></div><p className="eyebrow">DATA ANALYST</p>
    <h1>{authMode === "setup" ? "Ish maydonini yarating" : authMode === "checking" ? "Ish maydoni ochilmoqda…" : "Xush kelibsiz"}</h1>
    <p className="auth-copy">{authMode === "setup" ? "Birinchi administrator hisobingizni yarating. Mavjud lokal fayllar shu hisobga biriktiriladi." : "Hisobingizga kiring va ma’lumotlaringiz bilan ishlashni davom ettiring."}</p>
    {error && <p className="notice error" role="alert">{error}</p>}
    {authMode !== "checking" && <form id="auth-form" onSubmit={submitAuth} className="form-stack">
      <label>Login<input id="auth-username" value={username} onChange={e => setUsername(e.target.value)} autoComplete="username" pattern="[a-zA-Z0-9_.\-]+" minLength={3} maxLength={64} required placeholder="masalan: aziza" /></label>
      <label>Parol<input id="auth-password" type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete={authMode === "setup" ? "new-password" : "current-password"} minLength={12} maxLength={128} required placeholder="Kamida 12 belgi" /></label>
      <button id="auth-submit" className="button primary full" type="submit" disabled={busy}>{busy ? "Tekshirilmoqda…" : authMode === "setup" ? "Hisob yaratish" : "Kirish"} <span>→</span></button>
    </form>}
    {authMode === "login" && <div className="google-login-area">
      <div className="auth-divider"><span>yoki</span></div>
      <button id="google-login" type="button" className="google-button" disabled={busy || !googleStatus?.configured} onClick={() => void startGoogle(false)}>
        <GoogleMark /> Google orqali kirish
      </button>
      {!googleStatus?.configured && <p className="google-hint">Google kirishi uchun OAuth sozlamalari kerak.</p>}
      <p className="google-hint">Eski fayllar bilan ishlash uchun avval eski hisobingizga kirib, Google hisobini bog‘lang.</p>
    </div>}
    <p className="auth-note">Savollar va ustun nomlari Gemini’ga yuborilishi mumkin. Fayl qatorlari lokal hisoblanadi.</p>
  </section></main>;

  const profile: Profile | undefined = dataset?.profile;
  const numericColumns = profile?.columns.filter(c => c.kind === "number") ?? [];
  const activeRun = run && ["queued", "running"].includes(run.status);

  return <div className="app-shell">
    <aside className="sidebar">
      <a className="brand" href="/" aria-label="Data Analyst bosh sahifa"><span className="brand-mark small">d<span>.</span></span><span>Data Analyst<small>ANALITIKA PLATFORMASI</small></span></a>
      <div className="workspace-label"><span className="avatar">{user?.username[0]?.toUpperCase()}</span><div><strong>{user?.google_email ?? user?.username}</strong><small>{user?.role === "admin" ? "Administrator" : "Ish maydoni"}</small></div></div>
      <div className="sidebar-section"><span>FAYLLAR</span><span className="count-badge">{datasets.length}</span></div>
      <nav id="dataset-list" aria-label="Yuklangan fayllar" className="dataset-list">
        {datasets.length === 0 && <p className="sidebar-empty">Hali fayl yuklanmagan.</p>}
        {datasets.map(item => <button key={item.id} type="button" className={`dataset-item ${item.id === dataset?.id ? "selected" : ""}`} onClick={() => void perform(() => openDataset(item.id))} disabled={busy} title={item.name}><span className="file-icon">▤</span><span>{item.name}</span></button>)}
      </nav>
      <button id="add-file" className="sidebar-add" type="button" onClick={() => setShowUpload(true)}>＋ &nbsp; Yangi fayl yuklash</button>
      {datasets.length === 0 && <button id="demo-sidebar-button" className="sidebar-demo" type="button" onClick={() => void loadDemo()} disabled={busy}><strong>Namunada sinab ko‘rish ↗</strong><small>19 ta savdo yozuvi · tayyor CSV</small></button>}
      <div className="sidebar-bottom">
        {googleStatus?.configured && <div className="google-link-control">
          {user?.google_email
            ? <p className="google-linked">✓ Google: {user.google_email}</p>
            : <button type="button" className="google-link-button" onClick={() => void startGoogle(true)} disabled={busy}><GoogleMark /> Google hisobini bog‘lash</button>}
        </div>}
        {user?.role === "admin" && <details className="admin-panel"><summary>＋ Xodim hisobi</summary><form onSubmit={addUser} className="form-stack"><label>Login<input value={newUsername} onChange={e => setNewUsername(e.target.value)} minLength={3} maxLength={64} pattern="[a-zA-Z0-9_.\-]+" required /></label><label>Parol<input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} minLength={12} maxLength={128} required /></label><button className="button secondary" type="submit" disabled={busy}>Hisob yaratish</button><p role="status">{userMessage}</p></form></details>}
        <div className="secure-note"><span className="online-dot"/>Hisoblash shu serverda<small>Fayl qatorlari AIga yuborilmaydi.</small></div>
        <button id="logout-button" className="logout-button" onClick={() => void logout()} disabled={busy}>↪ &nbsp; Hisobdan chiqish</button>
      </div>
    </aside>

    <main className="main-area"><header className="topbar"><div><span className="eyebrow">ISH MAYDONI</span><span className="topbar-slash"> / </span><span>{dataset ? dataset.name : "Bosh sahifa"}</span></div><a href="/docs" target="_blank" rel="noopener noreferrer">API hujjatlari ↗</a></header>
      <div className="content"><div className="hero"><div><p className="eyebrow green">MA’LUMOTDAN QARORGACHA</p><h1>{dataset ? "Ma’lumotlaringizni tushuning." : "Raqamlar ortidagi ma’noni toping."}</h1><p>CSV yoki Excel yuklang, sifatini tekshiring va aniq hisoblangan javob oling.</p></div><span className="hero-pill"><span className="online-dot"/> Xavfsiz ish maydoni</span></div>
      {error && <div className="notice error" role="alert">{error}<button type="button" onClick={() => setError("")} aria-label="Xabarni yopish">×</button></div>}
      {notice && <div className="notice success-notice" role="status">{notice}<button type="button" onClick={() => setNotice("")} aria-label="Xabarni yopish">×</button></div>}
      {(!dataset || showUpload) && <section id="upload-panel" className="card upload-card"><div className="card-heading"><div><span className="step-icon">01</span><div><p className="eyebrow">BIRINCHI QADAM</p><h2>Faylni yuklang</h2></div></div><span className="muted">CSV / Excel</span></div>
        <div id="drop-zone" className={`drop-zone ${dragging ? "dragging" : ""}`} onDragOver={event => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={dropFile}><span className="upload-symbol">↑</span><h3>Faylingizni shu yerga tashlang</h3><p>yoki kompyuteringizdan tanlang</p><button type="button" className="button primary" onClick={() => fileInput.current?.click()} disabled={busy}>Fayl tanlash &nbsp; ＋</button><input ref={fileInput} id="file-input" type="file" accept=".csv,.xlsx" hidden onChange={(event: ChangeEvent<HTMLInputElement>) => { void uploadFile(event.target.files?.[0]); event.target.value = ""; }}/><small>CSV va XLSX · {health ? number.format(health.max_upload_bytes / 1024 ** 2) : 20} MB gacha · 100 000 qatorgacha</small></div>
        <div className="upload-foot"><label>CSV ajratgichi <select value={delimiter} onChange={e => setDelimiter(e.target.value)}><option value="">Avtomatik</option><option value=",">Vergul (,)</option><option value=";">Nuqtali vergul (;)</option><option value="tab">Tab</option><option value="|">Vertikal chiziq (|)</option></select></label><button id="demo-button" type="button" className="quiet-button" onClick={() => void loadDemo()} disabled={busy}>Savdo namunasini ochish ↗</button></div>
      </section>}
      {!dataset && <div className="intro-grid"><article><span>01 / YUKLANG</span><h3>Ma’lumotni olib keling</h3><p>Savdo, xarajat yoki mijoz fayllarini yuklang.</p></article><article><span>02 / TEKSHIRING</span><h3>Sifatini ko‘ring</h3><p>Bo‘sh kataklar, dublikatlar va ustun turlarini biling.</p></article><article><span>03 / TAHLIL QILING</span><h3>Javobni oling</h3><p>Guruhlar va oylar bo‘yicha hisoblang yoki Gemini’dan so‘rang.</p></article></div>}

      {dataset && profile && <div id="dataset-panel" className="dataset-view"><div className="dataset-heading"><div><p className="eyebrow">FAOL DATASET</p><h2 id="dataset-name">{dataset.name}</h2><p className="muted">{number.format(dataset.size_bytes / 1024)} KB · {shortDate(dataset.created_at)} · Xom fayl saqlangan</p></div><button id="delete-dataset" className="quiet-button danger" onClick={() => void deleteDataset()} disabled={busy}>Faylni o‘chirish</button></div>
        <div className="metrics"><article><span>QATORLAR</span><strong id="metric-rows">{number.format(profile.row_count)}</strong><small>Jadvaldagi yozuvlar</small></article><article><span>USTUNLAR</span><strong id="metric-columns">{number.format(profile.column_count)}</strong><small>Ma’lumot maydonlari</small></article><article><span>BO‘SH KATAKLAR</span><strong id="metric-missing">{number.format(profile.missing_cells)}</strong><small>Tekshirish kerak</small></article><article><span>TAKRORIY QATORLAR</span><strong id="metric-duplicates">{number.format(profile.duplicate_rows)}</strong><small>Avtomatik o‘chirilmaydi</small></article></div>
        {profile.warnings.length > 0 && <div className="warnings">{profile.warnings.map((warning, index) => <p key={index}>{warning}</p>)}</div>}
        {profile.sheets.length > 1 && <div className="sheet-controls"><label>Excel sheet <select value={sheet} onChange={e => setSheet(e.target.value)}>{profile.sheets.map(name => <option key={name} value={name}>{name}</option>)}</select></label><button type="button" className="button secondary" onClick={() => void reparse()} disabled={busy}>Sheetni ochish</button></div>}
        <section className="card preview-card"><div className="card-heading"><div><span className="step-icon">02</span><div><p className="eyebrow">MA’LUMOTGA BIR QARASH</p><h2>Jadval ko‘rinishi</h2></div></div><span className="muted">Dastlabki 20 qator</span></div><DataTable table={profile.preview} label="Dataset preview"/><details className="schema-details"><summary>Ustun turlari va sifati</summary><DataTable label="Ustun turlari" table={{ columns: ["Ustun", "Turi", "Bo‘sh", "Noyob qiymatlar"], rows: profile.columns.map(c => [c.name, c.kind, c.missing, c.unique]) }}/></details></section>
        <section className="card agent-card"><div className="card-heading"><div><span className="step-icon ai">✦</span><div><p className="eyebrow">AI YORDAMCHI</p><h2>Gemini bilan savol bering</h2></div></div><span className={`agent-badge ${agentStatus?.configured ? "enabled" : ""}`}>{agentStatus?.configured ? `${agentStatus.provider} · ${agentStatus.model}` : "Sozlanmagan"}</span></div>
          <p className="card-description">{agentStatus?.message ?? "Agent reja tuzadi, hisoblaydi va natijani mustaqil tekshiradi."}</p>
          <form onSubmit={ask} className="agent-form"><label htmlFor="question-input">Jadvalingiz haqida savol</label><textarea id="question-input" value={question} onChange={e => setQuestion(e.target.value)} minLength={3} maxLength={2000} rows={3} required placeholder={clarificationFor ? "Agent savoliga aniqlik kiriting…" : "Masalan, qaysi oyda tushum eng yuqori?"} disabled={busy || !agentStatus?.configured}/>
            <div className="suggestions">{examples.map(example => <button key={example} type="button" onClick={() => { setQuestion(example); setClarificationFor(null); }}>{example}</button>)}</div>
            {clarificationFor && <button type="button" className="quiet-button reset-question" onClick={() => { setClarificationFor(null); setQuestion(""); }}>Yangi mustaqil savol</button>}
            <div className="card-footer"><p>{agentStatus?.data_policy ?? "Savol va ustun nomlari Gemini’ga yuboriladi; fayl qatorlari yuborilmaydi."}</p><button id="ask-button" className="button primary" type="submit" disabled={busy || !!activeRunId || !agentStatus?.configured}>Savol yuborish →</button></div>
          </form>
          {run && <div id="agent-progress" className="run-progress" aria-live="polite"><div><span className={activeRun ? "working-dot" : "result-dot"}/><span id="agent-stage">{stages[run.stage] ?? run.stage}</span></div>{activeRun && <button id="cancel-run" type="button" className="quiet-button danger" onClick={() => void cancelRun()} disabled={busy}>Bekor qilish</button>}{!activeRun && <p id="agent-message">{run.analysis?.result.summary ?? run.message ?? run.error?.message ?? stages[run.status] ?? run.status}</p>}{run.plan && <details className="provenance"><summary>Agent savolni qanday talqin qildi?</summary><p>{run.plan.explanation}</p><pre>{run.plan.analysis ? JSON.stringify(run.plan.analysis, null, 2) : ""}</pre></details>}</div>}
        </section>
        <section className="card analysis-card"><div className="card-heading"><div><span className="step-icon">03</span><div><p className="eyebrow">TAYYOR HISOBLASHLAR</p><h2>Tezkor tahlil</h2></div></div><span className="muted">API kalitisiz ishlaydi</span></div><p className="card-description">Hisoblash fayldagi haqiqiy qiymatlar asosida bajariladi.</p><form onSubmit={analyze}><div className="operation-grid">{operations.map(item => <button key={item.id} type="button" data-operation={item.id} className={`operation ${operation === item.id ? "active" : ""}`} aria-pressed={operation === item.id} onClick={() => setOperation(item.id)}><span>{item.icon}</span><strong>{item.title}</strong><small>{item.description}</small></button>)}</div>
          {(operation === "group" || operation === "monthly") && <div className="analysis-options"><label>{operation === "monthly" ? "Sana ustuni" : "Guruhlash ustuni"}<select id="group-column" value={groupColumn} onChange={e => setGroupColumn(e.target.value)}>{profile.columns.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}</select></label><label>Hisoblash usuli<select id="aggregation" value={aggregation} onChange={e => setAggregation(e.target.value as typeof aggregation)}><option value="sum">Yig‘indi</option><option value="mean">O‘rtacha qiymat</option><option value="count">Qatorlar soni</option></select></label>{aggregation !== "count" && <label>Sonli ustun<select id="value-column" value={valueColumn} onChange={e => setValueColumn(e.target.value)}>{numericColumns.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}</select></label>}{operation === "monthly" && <label>Sana formati<select id="date-format" value={dateFormat} onChange={e => setDateFormat(e.target.value)}><option value="ISO8601">YYYY-MM-DD</option><option value="%d/%m/%Y">DD/MM/YYYY</option><option value="%m/%d/%Y">MM/DD/YYYY</option><option value="%d.%m.%Y">DD.MM.YYYY</option></select></label>}</div>}
          <div className="card-footer"><p>Natija jadval, grafik va hisoblash manbasi bilan chiqadi.</p><button id="analyze-button" className="button primary" type="submit" disabled={busy}>{busy ? "Hisoblanmoqda…" : "Tahlil qilish →"}</button></div></form></section>
        {result && <Results analysis={result}/>}
        {history.length > 0 && <section className="history-panel"><div className="history-heading"><h2>Oldingi tahlillar</h2><span>{history.length} ta natija</span></div><div id="history-list">{history.map(item => <button key={item.id} className="history-item" type="button" onClick={() => setResult(item)}><span><strong>{item.request?.operation ?? "Agent"}</strong><small>{item.result?.summary ?? "Natija"}</small></span><time>{shortDate(item.created_at)}</time></button>)}</div></section>}
      </div>}
      <footer className="page-footer"><span>Data Analyst · Ma’lumotga asoslangan qarorlar</span><span>v0.5 · React + TypeScript + Next.js</span></footer>
    </div></main>
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
