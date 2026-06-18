// Валидация по ФТ-1 (регистрация/профиль). Чистые функции — покрыты unit-тестами.

export interface ValidationResult {
  ok: boolean;
  error?: string;
}

// ── Email (ФТ-1.1): наличие @, домена с точкой ──
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email.trim());
}

// ── Пароль (ФТ-1.1): длина >8, буквы + цифры + спецсимволы, не «стандартный» ──
const COMMON_PASSWORDS = new Set([
  "password",
  "12345678",
  "123456789",
  "qwerty123",
  "password1",
  "11111111",
  "qwertyuiop",
  "1q2w3e4r",
  "admin123",
]);

export function validatePassword(password: string): ValidationResult {
  if (password.length <= 8) {
    return { ok: false, error: "Пароль должен содержать более 8 символов" };
  }
  if (!/[a-zA-Zа-яА-Я]/.test(password)) {
    return { ok: false, error: "Пароль должен содержать буквы" };
  }
  if (!/[0-9]/.test(password)) {
    return { ok: false, error: "Пароль должен содержать цифры" };
  }
  if (!/[^a-zA-Zа-яА-Я0-9]/.test(password)) {
    return { ok: false, error: "Пароль должен содержать спецсимволы" };
  }
  if (COMMON_PASSWORDS.has(password.toLowerCase())) {
    return { ok: false, error: "Пароль слишком простой" };
  }
  return { ok: true };
}

export function passwordsMatch(a: string, b: string): boolean {
  return a.length > 0 && a === b;
}

// ── ФИО (ФТ-1.2): только буквы (лат/кир), пробелы и дефис, длина > 0 ──
const FULLNAME_RE = /^[a-zA-Zа-яА-ЯёЁ][a-zA-Zа-яА-ЯёЁ\s-]*$/;
export function validateFullName(name: string): ValidationResult {
  const v = name.trim();
  if (v.length === 0) return { ok: false, error: "Укажите ФИО" };
  if (!FULLNAME_RE.test(v)) {
    return { ok: false, error: "ФИО может содержать только буквы, пробелы и дефис" };
  }
  return { ok: true };
}

// ── Telegram-ник (ФТ-1.3): первый символ «@», длина > 1 ──
export function validateTelegram(nick: string): ValidationResult {
  const v = nick.trim();
  if (v.length === 0) return { ok: true }; // опционально
  if (!v.startsWith("@") || v.length < 2) {
    return { ok: false, error: "Ник должен начинаться с «@»" };
  }
  return { ok: true };
}

// ── Возраст (0..150) ──
export function validateAge(age: number | null | undefined): ValidationResult {
  if (age === null || age === undefined) return { ok: true };
  if (!Number.isInteger(age) || age < 0 || age > 150) {
    return { ok: false, error: "Возраст должен быть от 0 до 150" };
  }
  return { ok: true };
}

// ── Опыт в месяцах (0..1000) ──
export function validateExperienceMonths(months: number): ValidationResult {
  if (!Number.isInteger(months) || months < 0 || months > 1000) {
    return { ok: false, error: "Опыт должен быть от 0 до 1000 месяцев" };
  }
  return { ok: true };
}

// ── Перечисления по логической модели данных ──
export const GRADE_LEVELS = [
  "Бакалавр",
  "Магистр",
  "Специалитет",
  "Аспирантура",
  "Среднее профессиональное",
  "Школьное образование",
  "Самообразование",
  "Другое",
] as const;
export type GradeLevel = (typeof GRADE_LEVELS)[number];

export const CURRENT_POSITIONS = [
  "Junior",
  "Middle",
  "Senior",
  "Lead",
  "Head",
  "Другое",
] as const;
export type CurrentPosition = (typeof CURRENT_POSITIONS)[number];

export const PREPARATION_LEVELS = ["Студент", "Выпускник", "Джун"] as const;
export type PreparationLevel = (typeof PREPARATION_LEVELS)[number];

export const USER_ROLES = ["client", "coach", "admin"] as const;
export type UserRole = (typeof USER_ROLES)[number];

// Навыки-теги (опц. в профиле): 0 или 3..10 (ФТ-1.3 интересы), длина каждого > 0
export function validateSkillTags(tags: string[]): ValidationResult {
  if (tags.length === 0) return { ok: true };
  if (tags.some((t) => t.trim().length === 0)) {
    return { ok: false, error: "Теги не должны быть пустыми" };
  }
  if (tags.length > 10) {
    return { ok: false, error: "Не более 10 тегов" };
  }
  return { ok: true };
}
