import "server-only";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { salarySummary, type SalarySummary } from "./salary-stats";

// Клиент официального API hh.ru (ФТ-3.1): поиск вакансий и зарплатная статистика.
// /vacancies требует токен приложения (client_credentials) В ПАРЕ с корректным
// User-Agent — оба заголовка обязательны. hh.ru отдаёт ОДИН app-токен и запрещает
// частый рефреш («app token refresh too early»), поэтому токен берётся один раз,
// кэшируется в памяти и персистится в файл (.hh-token.json) для переиспользования
// между перезапусками; новый запрашивается только по истечении срока.
// HH_ACCESS_TOKEN — ручной override (напр. пользовательский токen на ~часы).
// Любая ошибка → null (вызывающий код уходит на сид-фолбэк). Только официальный API.

const OAUTH = "https://hh.ru/oauth";
const API = "https://api.hh.ru";
const USER_AGENT = process.env.HH_USER_AGENT ?? "Jobish/1.0 (career-platform)";
const TOKEN_FILE = join(process.cwd(), ".hh-token.json");

export const HH_AREAS = [
  { id: "113", label: "Вся Россия" },
  { id: "1", label: "Москва" },
  { id: "2", label: "Санкт-Петербург" },
] as const;

/** Живые вызовы включаются HH_ENABLED при наличии client_credentials (или готовым токеном). */
export function isHhEnabled(): boolean {
  const hasCreds = Boolean(process.env.HH_CLIENT_ID && process.env.HH_CLIENT_SECRET);
  return Boolean(process.env.HH_ACCESS_TOKEN) || (process.env.HH_ENABLED === "1" && hasCreds);
}

interface Token {
  value: string;
  expiresAt: number;
}
let cached: Token | null = null;

function loadPersisted(): Token | null {
  try {
    return JSON.parse(readFileSync(TOKEN_FILE, "utf8")) as Token;
  } catch {
    return null;
  }
}
function persist(t: Token): void {
  try {
    writeFileSync(TOKEN_FILE, JSON.stringify(t));
  } catch {
    /* read-only fs — переживём, останется in-memory кэш */
  }
}

/** Токен приложения с кэшем (память + файл); либо явный HH_ACCESS_TOKEN. */
async function getToken(): Promise<string | null> {
  const explicit = process.env.HH_ACCESS_TOKEN;
  if (explicit) return explicit;

  const now = Date.now();
  if (cached && cached.expiresAt > now + 60_000) return cached.value;
  const persisted = loadPersisted();
  if (persisted && persisted.expiresAt > now + 60_000) {
    cached = persisted;
    return persisted.value;
  }

  const { HH_CLIENT_ID, HH_CLIENT_SECRET } = process.env;
  if (!HH_CLIENT_ID || !HH_CLIENT_SECRET) return null;
  try {
    const res = await fetchWithTimeout(`${OAUTH}/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": USER_AGENT },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: HH_CLIENT_ID,
        client_secret: HH_CLIENT_SECRET,
      }),
    });
    if (!res.ok) {
      // «app token refresh too early» = прежний токен ещё жив; вставьте его в HH_ACCESS_TOKEN
      console.warn(`[hh] token → ${res.status}: ${(await res.text()).slice(0, 120)}`);
      return null;
    }
    const data = (await res.json()) as { access_token?: string; expires_in?: number };
    if (!data.access_token) return null;
    cached = { value: data.access_token, expiresAt: now + (data.expires_in ?? 1800) * 1000 };
    persist(cached);
    return cached.value;
  } catch {
    return null;
  }
}

interface HhVacancy {
  salary?: { from: number | null; to: number | null; currency: string | null; gross: boolean | null } | null;
}

// ─────────── Поиск вакансий (ФТ-3.2 / ФТ-3.3) ───────────

// Названия городов → area id hh.ru (частые регионы).
export const CITY_AREA: Record<string, string> = {
  "Москва": "1",
  "Санкт-Петербург": "2",
  "Новосибирск": "4",
  "Екатеринбург": "3",
  "Казань": "88",
};

export interface HhVacancyItem {
  id: string;
  title: string;
  company: string;
  city: string;
  format: string; // remote | hybrid | office
  salaryMin: number;
  salaryMax: number;
  experience: number; // требуемый опыт, лет
  employment: string; // full | part | project
  url: string;
}

// hh enum опыта → нижняя граница в годах (для отображения «опыт от N лет»).
const EXP_TO_YEARS: Record<string, number> = {
  noExperience: 0,
  between1And3: 1,
  between3And6: 3,
  moreThan6: 6,
};
// Максимально допустимый опыт (лет) → bucket hh для фильтра.
function yearsToExpBucket(maxYears: number): string {
  if (maxYears <= 0) return "noExperience";
  if (maxYears <= 3) return "between1And3";
  if (maxYears <= 6) return "between3And6";
  return "moreThan6";
}
// hh schedule.id → формат приложения.
function scheduleToFormat(scheduleId?: string): string {
  if (scheduleId === "remote") return "remote";
  if (scheduleId === "flexible" || scheduleId === "shift") return "hybrid";
  return "office";
}

interface HhSearchItem {
  id: string;
  name: string;
  employer?: { name?: string } | null;
  area?: { name?: string } | null;
  salary?: { from: number | null; to: number | null; currency: string | null } | null;
  experience?: { id?: string } | null;
  employment?: { id?: string } | null;
  schedule?: { id?: string } | null;
  alternate_url?: string;
}

export interface VacancySearchOpts {
  text: string;
  city?: string;
  salaryFrom?: number;
  experienceMax?: number;
  employment?: string;
  format?: string;
  perPage?: number;
}

/** Маппит ответ hh.ru в плоскую модель вакансии приложения. */
function mapHhItem(v: HhSearchItem): HhVacancyItem {
  const s = v.salary;
  const lo = s?.from ?? s?.to ?? 0;
  const hi = s?.to ?? s?.from ?? 0;
  return {
    id: v.id,
    title: v.name,
    company: v.employer?.name ?? "—",
    city: v.area?.name ?? "—",
    format: scheduleToFormat(v.schedule?.id),
    salaryMin: lo,
    salaryMax: hi,
    experience: EXP_TO_YEARS[v.experience?.id ?? "noExperience"] ?? 0,
    employment: v.employment?.id ?? "full",
    url: v.alternate_url ?? `https://hh.ru/vacancy/${v.id}`,
  };
}

/**
 * Живой поиск вакансий по hh.ru (ФТ-3.2). Возвращает null, если выключено/недоступно.
 */
export async function fetchHhVacancies(opts: VacancySearchOpts): Promise<HhVacancyItem[] | null> {
  if (!isHhEnabled()) return null;
  const token = await getToken();
  if (!token) return null;
  try {
    const url = new URL(`${API}/vacancies`);
    url.searchParams.set("text", opts.text);
    url.searchParams.set("per_page", String(opts.perPage ?? 30));
    const areaId = opts.city ? CITY_AREA[opts.city] : undefined;
    if (areaId) url.searchParams.set("area", areaId);
    if (opts.city === "Удалённо" || opts.format === "remote") url.searchParams.set("schedule", "remote");
    if (typeof opts.salaryFrom === "number") {
      url.searchParams.set("salary", String(opts.salaryFrom));
      url.searchParams.set("only_with_salary", "true");
    }
    if (typeof opts.experienceMax === "number") {
      url.searchParams.set("experience", yearsToExpBucket(opts.experienceMax));
    }
    if (opts.employment && ["full", "part", "project"].includes(opts.employment)) {
      url.searchParams.set("employment", opts.employment);
    }
    const res = await fetchWithTimeout(url.toString(), {
      headers: { Authorization: `Bearer ${token}`, "User-Agent": USER_AGENT },
    });
    if (!res.ok) {
      console.warn(`[hh] /vacancies search → ${res.status} (text="${opts.text}")`);
      return null;
    }
    const data = (await res.json()) as { items?: HhSearchItem[] };
    return (data.items ?? []).map(mapHhItem);
  } catch (e) {
    console.warn("[hh] vacancy search failed:", e instanceof Error ? e.message : e);
    return null;
  }
}

/** Достаёт зарплаты (в рублях) из выдачи hh.ru — середина вилки from/to. */
export function extractSalaries(items: HhVacancy[]): number[] {
  const out: number[] = [];
  for (const v of items) {
    const s = v.salary;
    if (!s || s.currency !== "RUR") continue;
    const lo = s.from ?? s.to;
    const hi = s.to ?? s.from;
    if (lo == null || hi == null) continue;
    out.push(Math.round((lo + hi) / 2));
  }
  return out;
}

/**
 * Live-зарплатная статистика по профессии и региону из hh.ru.
 * Возвращает null, если live-режим выключен или API недоступен.
 */
export async function fetchHhSalarySummary(
  text: string,
  areaId: string,
): Promise<SalarySummary | null> {
  if (!isHhEnabled()) return null;
  const token = await getToken();
  if (!token) return null;
  try {
    const url = new URL(`${API}/vacancies`);
    url.searchParams.set("text", text);
    url.searchParams.set("area", areaId);
    url.searchParams.set("per_page", "100");
    url.searchParams.set("only_with_salary", "true");
    // ВАЖНО: и Bearer, и User-Agent обязательны одновременно.
    const res = await fetchWithTimeout(url.toString(), {
      headers: { Authorization: `Bearer ${token}`, "User-Agent": USER_AGENT },
    });
    if (!res.ok) {
      console.warn(`[hh] /vacancies → ${res.status} (text="${text}", area=${areaId})`);
      return null;
    }
    const data = (await res.json()) as { items?: HhVacancy[] };
    return salarySummary(extractSalaries(data.items ?? []));
  } catch (e) {
    console.warn("[hh] request failed:", e instanceof Error ? e.message : e);
    return null;
  }
}

export interface HhSummary {
  query: string;
  found: number;
  medianSalary: number | null;
  samples: {
    title: string;
    company: string;
    salaryFrom: number | null;
    salaryTo: number | null;
    url?: string;
  }[];
}

/** Краткая сводка по вакансиям для AI-коуча (ФТ-3.1). */
export async function fetchHhSummary(
  query: string,
  areaId = "113",
): Promise<HhSummary | null> {
  if (!isHhEnabled()) return null;
  const token = await getToken();
  if (!token) return null;
  try {
    const url = new URL(`${API}/vacancies`);
    url.searchParams.set("text", query);
    url.searchParams.set("area", areaId);
    url.searchParams.set("per_page", "30");
    url.searchParams.set("only_with_salary", "true");
    const res = await fetchWithTimeout(url.toString(), {
      headers: { Authorization: `Bearer ${token}`, "User-Agent": USER_AGENT },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { found?: number; items?: HhSearchItem[] };
    const items = data.items ?? [];
    const stats = salarySummary(extractSalaries(items));
    return {
      query,
      found: data.found ?? items.length,
      medianSalary: stats?.median ?? null,
      samples: items.slice(0, 3).map((i) => {
        const row = mapHhItem(i);
        return {
          title: row.title,
          company: row.company,
          salaryFrom: i.salary?.from ?? null,
          salaryTo: i.salary?.to ?? null,
          url: row.url,
        };
      }),
    };
  } catch {
    return null;
  }
}

export function hhSummaryText(s: HhSummary): string {
  const parts = [
    `Актуальные данные hh.ru по запросу «${s.query}»: открыто ~${s.found} вакансий с указанной зарплатой`,
  ];
  if (s.medianSalary) {
    parts.push(`, медиана ЗП ≈ ${new Intl.NumberFormat("ru-RU").format(s.medianSalary)} ₽`);
  }
  parts.push(".");
  return parts.join("");
}

function fetchWithTimeout(url: string, init: RequestInit, ms = 6000): Promise<Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  return fetch(url, { ...init, signal: ctrl.signal }).finally(() => clearTimeout(t));
}
