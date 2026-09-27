import type { Analysis, Cell, Chart, Table } from "@/lib/types";

const number = new Intl.NumberFormat("uz-UZ", { maximumFractionDigits: 2 });
const shortNumber = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 });

function display(value: Cell) {
  if (value === null) return "bo‘sh";
  return typeof value === "number" ? number.format(value) : String(value);
}

export function DataTable({ table, label }: { table: Table; label: string }) {
  if (!table.rows.length) return <p className="empty-inline">Ko‘rsatish uchun qator yo‘q.</p>;
  return <div className="table-scroll" tabIndex={0} aria-label={label}>
    <table><thead><tr>{table.columns.map((column, index) => <th key={`${column}-${index}`} scope="col">{column}</th>)}</tr></thead>
      <tbody>{table.rows.map((row, rowIndex) => <tr key={rowIndex}>{row.map((value, cellIndex) => <td key={cellIndex} className={value === null ? "null-cell" : ""} title={display(value)}>{display(value)}</td>)}</tr>)}</tbody>
    </table>
    {table.truncated && <p className="table-note">Jadvalning dastlabki {table.rows.length} qatori ko‘rsatilgan.</p>}
  </div>;
}

export function BarChart({ chart }: { chart: Chart }) {
  const width = 900, height = 312, left = 85, right = 20, top = 20, bottom = 82;
  const plotHeight = height - top - bottom;
  const finite = chart.values.filter((value): value is number => value !== null && Number.isFinite(value));
  const min = Math.min(0, ...finite), max = Math.max(0, ...finite), range = max - min || 1;
  const y = (value: number) => top + (max - value) / range * plotHeight;
  const zero = y(0), slot = (width - left - right) / Math.max(1, chart.labels.length);
  return <div id="chart" className="chart-wrap"><h3>{chart.title}</h3><svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`${chart.title}. Aniq qiymatlar jadvalda.`}>
    {Array.from({ length: 5 }, (_, i) => {
      const value = min + range * i / 4, pos = y(value);
      return <g key={i}><line x1={left} x2={width - right} y1={pos} y2={pos} className="grid-line"/><text x={left - 12} y={pos + 4} textAnchor="end" className="chart-axis">{shortNumber.format(value)}</text></g>;
    })}
    {chart.labels.map((label, index) => {
      const value = chart.values[index], x = left + slot * index + slot * 0.2, labelX = x + slot * 0.3;
      return <g key={`${label}-${index}`}>
        {value !== null && Number.isFinite(value) && <rect x={x} y={Math.min(zero, y(value))} width={slot * 0.6} height={Math.max(1, Math.abs(zero - y(value)))} rx={4} className={value < 0 ? "bar-negative" : "bar-positive"}><title>{`${label}: ${number.format(value)}`}</title></rect>}
        <text x={labelX} y={height - bottom + 22} textAnchor="end" className="chart-axis" transform={`rotate(-30 ${labelX} ${height - bottom + 22})`}>{label.length > 16 ? `${label.slice(0, 15)}…` : label}</text>
      </g>;
    })}
  </svg>{chart.shown < chart.total && <p className="muted">{chart.total} guruhdan dastlabki {chart.shown} tasi ko‘rsatilgan.</p>}</div>;
}

export default function Results({ analysis }: { analysis: Analysis }) {
  function download() {
    const url = URL.createObjectURL(new Blob([JSON.stringify(analysis, null, 2)], { type: "application/json" }));
    const link = document.createElement("a"); link.href = url; link.download = `analysis-${analysis.id}.json`;
    document.body.append(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return <section className="card result-card" id="result-panel" aria-live="polite">
    <div className="card-heading"><div><span className="step-icon success">✓</span><div><p className="eyebrow">TAYYOR NATIJA</p><h2>Tahlil natijasi</h2></div></div><button id="download-result" className="quiet-button" onClick={download}>JSON yuklab olish ↓</button></div>
    <p id="result-summary" className="result-summary">{analysis.result.summary}</p>
    {analysis.result.warnings.length > 0 && <div className="warnings">{analysis.result.warnings.map((warning, index) => <p key={index}>{warning}</p>)}</div>}
    {analysis.result.chart && <BarChart chart={analysis.result.chart}/>}
    <DataTable table={analysis.result.table} label="Tahlil natijasi"/>
    <details className="provenance"><summary>Hisoblash manbasi va parametrlari</summary><pre>{JSON.stringify(analysis.provenance, null, 2)}</pre></details>
  </section>;
}
