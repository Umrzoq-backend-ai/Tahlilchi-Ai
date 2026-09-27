export type Cell = string | number | boolean | null;
export type Table = { columns: string[]; rows: Cell[][]; total?: number; truncated?: boolean };
export type Column = { name: string; kind: "number" | "date" | "boolean" | "text"; dtype: string; missing: number; unique: number };
export type Profile = {
  row_count: number; column_count: number; missing_cells: number; duplicate_rows: number;
  warnings: string[]; columns: Column[]; preview: Table;
  sheets: string[]; selected_sheet: string | null; delimiter: string | null;
};
export type Dataset = {
  id: string; name: string; size_bytes: number; created_at: string; status: string;
  extension?: string; profile?: Profile; parsing_options?: { sheet: string | null; delimiter: string | null };
};
export type Chart = { title: string; labels: string[]; values: (number | null)[]; shown: number; total: number };
export type AnalysisRequest = {
  operation: "overview" | "missing" | "group" | "monthly" | "metric";
  group_column?: string | null; value_column?: string | null;
  aggregation?: "sum" | "mean" | "count"; date_format?: string;
  top_n?: number | null; ascending?: boolean;
};
export type Analysis = {
  id: string; dataset_id: string; created_at: string; status: string;
  request: AnalysisRequest; result: { summary: string; warnings: string[]; table: Table; chart: Chart | null };
  provenance: Record<string, unknown>;
};
export type AgentPlan = { explanation: string; analysis: AnalysisRequest | null; clarification?: string | null };
export type AgentRun = {
  id: string; dataset_id: string; status: string; stage: string; created_at: string;
  question?: string; message?: string | null; error?: { code: string; message: string } | null;
  plan?: AgentPlan | null; analysis?: Analysis | null; events?: { seq: number; stage: string }[];
};
export type AgentStatus = { configured: boolean; provider: string; model: string; message?: string; data_policy: string };
export type User = { id: string; username: string; role: "admin" | "user"; google_email?: string | null };
export type GoogleStatus = { configured: boolean; linked: boolean; redirect_uri: string };
export type Session = { authenticated: true; user: User; csrf_token: string } | { authenticated: false; setup_allowed: boolean };
export type Health = { status: string; version: string; max_upload_bytes: number; agent_enabled: boolean };
