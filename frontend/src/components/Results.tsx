import { Icon } from "./Design";
import { translate, type Language } from "@/lib/i18n";
import type { Analysis, Cell, Chart, Table } from "@/lib/types";

const locale = (language: Language) => language === "ru" ? "ru-RU" : language === "en" ? "en-US" : "uz-UZ";
const number = (language: Language) => new Intl.NumberFormat(locale(language), { maximumFractionDigits: 2 });
const shortNumber = (language: Language) => new Intl.NumberFormat(locale(language), { notation: "compact", maximumFractionDigits: 1 });

function display(value: Cell, language: Language) {
  if (value === null) return translate(language, "bo‘sh");
  return typeof value === "number" ? number(language).format(value) : String(value);
}

export function DataTable({ table, label, language = "uz" }: { table: Table; label: string; language?: Language }) {
  if (!table.rows.length) return <p className="empty-inline">{translate(language, "Ko‘rsatish uchun qator yo‘q.")}</p>;
  return <div className="table-scroll" tabIndex={0} aria-label={label}>
    <table><thead><tr>{table.columns.map((column, index) => <th key={column + "-" + index} scope="col">{column}</th>)}</tr></thead>
      <tbody>{table.rows.map((row, rowIndex) => <tr key={rowIndex}>{row.map((value, cellIndex) => <td key={cellIndex} className={value === null ? "null-cell" : ""} title={display(value, language)}>{display(value, language)}</td>)}</tr>)}</tbody>
    </table>
    {table.truncated && <p className="table-note">{language === "en" ? "The first " + table.rows.length + " rows are shown." : language === "ru" ? "Показаны первые " + table.rows.length + " строк." : "Jadvalning dastlabki " + table.rows.length + " qatori ko‘rsatilgan."}</p>}
  </div>;
}

export function BarChart({ chart, language = "uz" }: { chart: Chart; language?: Language }) {
  const width = 900, height = 312, left = 85, right = 20, top = 20, bottom = 82;
  const plotHeight = height - top - bottom;
  const finite = chart.values.filter((value): value is number => value !== null && Number.isFinite(value));
  const min = Math.min(0, ...finite), max = Math.max(0, ...finite), range = max - min || 1;
  const y = (value: number) => top + (max - value) / range * plotHeight;
  const zero = y(0), slot = (width - left - right) / Math.max(1, chart.labels.length);
  return <div id="chart" className="chart-wrap"><h3>{chart.title}</h3><div className="chart-scroll" tabIndex={0}><svg viewBox={"0 0 " + width + " " + height} role="img" aria-label={chart.title}>
    {Array.from({ length: 5 }, (_, i) => {
      const value = min + range * i / 4, pos = y(value);
      return <g key={i}><line x1={left} x2={width - right} y1={pos} y2={pos} className="grid-line"/><text x={left - 12} y={pos + 4} textAnchor="end" className="chart-axis">{shortNumber(language).format(value)}</text></g>;
    })}
    {chart.labels.map((label, index) => {
      const value = chart.values[index], x = left + slot * index + slot * 0.2, labelX = x + slot * 0.3;
      return <g key={label + "-" + index}>
        {value !== null && Number.isFinite(value) && <rect x={x} y={Math.min(zero, y(value))} width={slot * 0.6} height={Math.max(1, Math.abs(zero - y(value)))} rx={4} className={value < 0 ? "bar-negative" : "bar-positive"}><title>{label + ": " + number(language).format(value)}</title></rect>}
        <text x={labelX} y={height - bottom + 22} textAnchor="end" className="chart-axis" transform={"rotate(-30 " + labelX + " " + (height - bottom + 22) + ")"}>{label.length > 16 ? label.slice(0, 15) + "…" : label}</text>
      </g>;
    })}
  </svg></div>{chart.shown < chart.total && <p className="muted">{language === "en" ? "Showing " + chart.shown + " of " + chart.total + " groups." : language === "ru" ? "Показано " + chart.shown + " из " + chart.total + " групп." : chart.total + " guruhdan dastlabki " + chart.shown + " tasi ko‘rsatilgan."}</p>}</div>;
}

export default function Results({ analysis, language = "uz" }: { analysis: Analysis; language?: Language }) {
  const t = (text: string) => translate(language, text);
  function downloadJson() {
    const url = URL.createObjectURL(new Blob([JSON.stringify(analysis, null, 2)], { type: "application/json" }));
    const link = document.createElement("a"); link.href = url; link.download = "analysis-" + analysis.id + ".json";
    document.body.append(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return <section className="card result-card" id="result-panel" aria-live="polite">
    <div className="card-heading"><div><span className="step-icon success"><Icon name="chart"/></span><div><p className="eyebrow">{t("TAYYOR NATIJA")}</p><h2>{t("Tahlil natijasi")}</h2></div></div><div className="export-actions"><a id="download-csv" className="quiet-button" href={"/api/v1/datasets/" + analysis.dataset_id + "/analyses/" + analysis.id + "/export.csv"} download>{t("CSV yuklab olish ↓")}</a><button id="download-result" className="quiet-button" onClick={downloadJson}>{t("JSON yuklab olish ↓")}</button></div></div>
    <div className="result-summary-panel"><span className="step-icon"><Icon name="check"/></span><div><h3>{t("Hisoblash xulosasi")}</h3><p id="result-summary" className="result-summary">{analysis.result.summary}</p></div></div>
    {analysis.result.warnings.length > 0 && <div className="warnings">{analysis.result.warnings.map((warning, index) => <p key={index}>{warning}</p>)}</div>}
    {analysis.result.chart && <BarChart chart={analysis.result.chart} language={language}/>}
    <div className="result-table"><h3>{t("Hisob-kitoblar jadvali")}</h3><DataTable table={analysis.result.table} label={t("Tahlil natijasi")} language={language}/></div>
    <details className="provenance"><summary>{t("Hisoblash manbasi va parametrlari")}</summary><pre>{JSON.stringify(analysis.provenance, null, 2)}</pre></details>
  </section>;
}
