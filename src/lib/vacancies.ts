// Логика поиска вакансий по фильтрам (ФТ-3.2). Чистые функции — покрыты тестами.

export interface Vacancy {
  id: string;
  professionSlug: string;
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

export interface VacancyFilter {
  professionSlug?: string;
  city?: string;
  company?: string; // поиск по подстроке
  format?: string;
  salaryFrom?: number; // желаемая нижняя граница ЗП
  salaryTo?: number; // желаемая верхняя граница ЗП
  experienceMax?: number; // максимально допустимый требуемый опыт
  employment?: string;
}

export const FORMAT_LABELS: Record<string, string> = {
  remote: "Удалённо",
  hybrid: "Гибрид",
  office: "Офис",
};
export const EMPLOYMENT_LABELS: Record<string, string> = {
  full: "Полная",
  part: "Частичная",
  project: "Проектная",
};

export function matchesVacancyFilter(v: Vacancy, f: VacancyFilter): boolean {
  if (f.professionSlug && v.professionSlug !== f.professionSlug) return false;
  if (f.city && v.city.toLowerCase() !== f.city.toLowerCase()) return false;
  if (f.company && !v.company.toLowerCase().includes(f.company.toLowerCase().trim()))
    return false;
  if (f.format && v.format !== f.format) return false;
  if (f.employment && v.employment !== f.employment) return false;
  // Пересечение зарплатных вилок
  if (typeof f.salaryFrom === "number" && v.salaryMax < f.salaryFrom) return false;
  if (typeof f.salaryTo === "number" && v.salaryMin > f.salaryTo) return false;
  // Опыт: показываем вакансии, где требуемый опыт не превышает заданный
  if (typeof f.experienceMax === "number" && v.experience > f.experienceMax)
    return false;
  return true;
}

export function filterVacancies<T extends Vacancy>(list: T[], f: VacancyFilter): T[] {
  return list.filter((v) => matchesVacancyFilter(v, f));
}
