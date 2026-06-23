// Формирование текстового контекста по рынку труда для AI-коуча.
// Чистая функция — коуч отвечает конкретикой, не отсылая в разделы. Покрыта тестом.

const DEMAND_LEVEL_MAP: Record<string, string> = {
  высокая: "высокий",
  средняя: "средний",
  низкая: "низкий",
  высокий: "высокий",
  средний: "средний",
  низкий: "низкий",
};

/** «Спрос» — мужской род: высокий / средний / низкий. */
export function formatDemandLevel(level: string): string {
  return DEMAND_LEVEL_MAP[level] ?? level;
}

export const DEMAND_BADGE_COLORS: Record<string, string> = {
  высокий: "bg-emerald-50 text-emerald-700",
  средний: "bg-amber-50 text-amber-700",
  низкий: "bg-slate-100 text-slate-600",
};

export function demandBadgeClass(level: string): string {
  return DEMAND_BADGE_COLORS[formatDemandLevel(level)] ?? "bg-slate-100 text-slate-600";
}

export function demandLabel(level: string): string {
  return `спрос ${formatDemandLevel(level)}`;
}

export interface MarketInfo {
  title: string;
  demandLevel: string;
  openVacancies: number;
  salaryJunior: number;
  salaryMiddle: number;
  salarySenior: number;
  topCompanies: { name: string; salary?: number; hiring?: string }[];
  salaryTrend?: { month: string; junior: number; middle: number; senior: number }[];
}

export interface MarketPanelData extends MarketInfo {
  liveSummary?: string;
}

function rub(n: number): string {
  return new Intl.NumberFormat("ru-RU").format(n) + " ₽";
}

export function formatMarketContext(m: MarketInfo): string {
  const companies = m.topCompanies.slice(0, 3).map((c) => c.name).join(", ");
  const parts = [
    `Данные платформы по профессии «${m.title}»:`,
    `зарплаты по грейдам — junior ≈ ${rub(m.salaryJunior)}, middle ≈ ${rub(m.salaryMiddle)}, senior ≈ ${rub(m.salarySenior)};`,
    `спрос ${formatDemandLevel(m.demandLevel)};`,
    `открытых вакансий ≈ ${new Intl.NumberFormat("ru-RU").format(m.openVacancies)};`,
  ];
  if (companies) parts.push(`топ-компании: ${companies}.`);
  return parts.join(" ");
}
