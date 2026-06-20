import "server-only";
import { salarySummary, type SalarySummary } from "./salary-stats";

// Клиент официального API hh.ru (ФТ-3.1): поиск вакансий и расчёт зарплатной
// статистики. Эндпоинт /vacancies публичный — токен не требуется (client_credentials
// для него даёт bad_authorization). hh.ru строго проверяет User-Agent и блокирует
// серверные IP, поэтому живой вызов включается флагом HH_ENABLED, а любая
// ошибка/недоступность → null (вызывающий код мягко переходит на сид-фолбэк).
// Парсинг hh.ru запрещён ToS — используется только официальный API.

const API = "https://api.hh.ru";
const USER_AGENT = process.env.HH_USER_AGENT ?? "Jobish/1.0 (career-platform)";

// Популярные регионы hh.ru (area id). 113 — вся Россия.
export const HH_AREAS = [
  { id: "113", label: "Вся Россия" },
  { id: "1", label: "Москва" },
  { id: "2", label: "Санкт-Петербург" },
] as const;

/** Живые вызовы включаются явно — там, где hh.ru реально доступен. */
export function isHhEnabled(): boolean {
  return process.env.HH_ENABLED === "1";
}

interface HhVacancy {
  salary?: { from: number | null; to: number | null; currency: string | null; gross: boolean | null } | null;
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
 * Live-зарплатная статистика по профессии и региону из hh.ru (публичный API).
 * Возвращает null, если live-режим выключен или API недоступен.
 */
export async function fetchHhSalarySummary(
  text: string,
  areaId: string,
): Promise<SalarySummary | null> {
  if (!isHhEnabled()) return null;
  try {
    const url = new URL(`${API}/vacancies`);
    url.searchParams.set("text", text);
    url.searchParams.set("area", areaId);
    url.searchParams.set("per_page", "100");
    url.searchParams.set("only_with_salary", "true");
    const res = await fetchWithTimeout(url.toString(), {
      headers: { "User-Agent": USER_AGENT },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { items?: HhVacancy[] };
    return salarySummary(extractSalaries(data.items ?? []));
  } catch {
    return null;
  }
}

function fetchWithTimeout(url: string, init: RequestInit, ms = 6000): Promise<Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  return fetch(url, { ...init, signal: ctrl.signal }).finally(() => clearTimeout(t));
}
