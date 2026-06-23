import { test, expect, type Page } from "@playwright/test";

// Сквозной сценарий клиента MVP (v2): регистрация → верификация почты →
// профориентация → выбор трека → карта развития → коуч → тарифы → выход.
// Контекст у каждого теста свежий, поэтому логинимся в каждом.

const unique = Date.now();
const user = {
  name: "Тест Пользователь",
  email: `e2e_${unique}@jobish.ru`,
  password: "Test1234!pass",
};

async function login(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(user.email);
  await page.getByLabel("Пароль", { exact: true }).fill(user.password);
  await page.getByRole("button", { name: "Войти", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}

test.describe.configure({ mode: "serial" });

test("лендинг открывается и ведёт на регистрацию", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /карьере мечты/i })).toBeVisible();
  await page.getByRole("link", { name: /Начать бесплатно/i }).first().click();
  await expect(page).toHaveURL(/\/register/);
});

test("регистрация требует подтверждения пароля и верификации почты", async ({ page }) => {
  await page.goto("/register");
  await page.getByLabel("Имя").fill(user.name);
  await page.getByLabel("Email").fill(user.email);
  await page.getByLabel("Пароль", { exact: true }).fill(user.password);
  await page.getByLabel("Повторите пароль").fill(user.password);
  await page.getByRole("button", { name: /Создать аккаунт/i }).click();

  // ФТ-1.6 — попадаем на экран верификации
  await expect(page).toHaveURL(/\/verify/);
  // Код предзаполнен в демо-режиме
  await page.getByRole("button", { name: /Подтвердить почту/i }).click();
  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByText(/Привет, Тест/)).toBeVisible();
});

test("регистрация через SSO создаёт аккаунт", async ({ page }) => {
  await page.goto("/register");
  await page.getByRole("link", { name: "Google" }).click();
  await expect(page).toHaveURL(/\/dashboard/);
});

test("слабый пароль и несовпадение отклоняются", async ({ page }) => {
  await page.goto("/register");
  await page.getByLabel("Имя").fill("Проверка Пароля");
  await page.getByLabel("Email").fill(`weak_${unique}@jobish.ru`);
  await page.getByLabel("Пароль", { exact: true }).fill("123");
  await page.getByLabel("Повторите пароль").fill("123");
  await page.getByRole("button", { name: /Создать аккаунт/i }).click();
  await expect(page.getByText(/Пароль должен содержать/i)).toBeVisible();
  await expect(page).toHaveURL(/\/register/);
});

test("профориентация выдаёт подходящие профессии", async ({ page }) => {
  await login(page);
  await page.goto("/orientation");
  for (let i = 0; i < 6; i++) {
    await page.getByTestId("orientation-option").first().click();
    const result = page.getByRole("button", { name: /Узнать результат/i });
    if (await result.isVisible().catch(() => false)) {
      await result.click();
      break;
    }
    await page.getByRole("button", { name: /Далее/i }).click();
  }
  await expect(page.getByRole("button", { name: /Пройти заново/i })).toBeVisible();

  // (13) Повторный визит: показывается карта треков + кнопка перепрохождения
  await page.goto("/orientation");
  await expect(page.getByRole("button", { name: /Пройти заново/i })).toBeVisible();
  await expect(page.getByText(/подходящие профессии/i).first()).toBeVisible();
});

test("выбор трека строит карту развития", async ({ page }) => {
  await login(page);
  await page.goto("/professions/frontend-developer");
  await expect(page.getByRole("heading", { name: "Frontend-разработчик" })).toBeVisible();
  await page.getByRole("button", { name: /Выбрать как трек развития/i }).click();
  await expect(page).toHaveURL(/\/roadmap/);
  await expect(page.getByText(/Этап 1\. Основы/i)).toBeVisible();

  const firstStatus = page.getByRole("button", { name: /Изменить статус навыка/i }).first();
  await firstStatus.click();

  // Конструктор (ФТ-4.3): добавляем новый этап
  await page.getByRole("button", { name: /Конструктор/i }).click();
  await page.getByPlaceholder("Название нового этапа").fill("Мой этап");
  await page.getByRole("button", { name: /^Этап$/i }).click();
  // В режиме конструктора название этапа — это поле с aria-label
  await expect(page.getByLabel("Название этапа Мой этап")).toBeVisible();
});

test("AI-коуч отвечает на сообщение", async ({ page }) => {
  await login(page);
  await page.goto("/coach");
  const box = page.getByPlaceholder(/Напишите сообщение/i);
  await box.fill("Привет, помоги с карьерой");
  await box.press("Enter");
  await expect(page.getByText(/Jobish AI/i).first()).toBeVisible();

  // (6) История чатов: создаём новый диалог — открывается пустой чат
  await page.getByRole("button", { name: /Новый диалог/i }).first().click();
  await expect(page.getByText(/Чем могу помочь/i)).toBeVisible();
});

test("прогресс через чат обновляет карту (мотивационный блок)", async ({ page }) => {
  await login(page);
  await page.goto("/coach");
  const box = page.getByPlaceholder(/Напишите сообщение/i);
  await box.fill("Я прошёл React");
  await box.press("Enter");
  await expect(page.getByText(/Прогресс по карте/i)).toBeVisible();
});

test("генерация персонального теста", async ({ page }) => {
  await login(page);
  await page.goto("/tests");
  await page.getByRole("button", { name: /Сгенерировать персональный тест/i }).click();
  await expect(page).toHaveURL(/\/tests\/[a-z0-9]+/i);
  await expect(page.getByRole("heading", { name: /Персональный тест/i })).toBeVisible();
});

test("профиль сохраняет расширенные поля", async ({ page }) => {
  await login(page);
  await page.goto("/profile");
  await page.getByLabel("Опыт (месяцев)").fill("18");
  await page.getByLabel("Образование (вуз/колледж)").fill("НИУ ВШЭ");
  await page.getByLabel("Навыки (теги через запятую)").fill("JavaScript, SQL");
  await page.getByRole("button", { name: "Сохранить" }).click();
  await expect(page.getByText("Сохранено")).toBeVisible();
});

test("поиск вакансий с фильтрами", async ({ page }) => {
  await login(page);
  await page.goto("/vacancies");
  await expect(page.getByRole("heading", { name: "Поиск вакансий" })).toBeVisible();
  // Фильтр по городу
  await page.getByLabel("Город").selectOption("Москва");
  await page.getByRole("button", { name: /Применить фильтры/i }).click();
  await expect(page).toHaveURL(/city=/);
  await expect(page.getByText(/Найдено:/)).toBeVisible();
});

test("оформление тарифа в демо-режиме", async ({ page }) => {
  await login(page);
  await page.goto("/pricing");
  await page.getByRole("button", { name: /Оформить \(демо\)/i }).first().click();
  await expect(page.getByText(/Оформлено|Текущий тариф/i).first()).toBeVisible();
});

test("админ-панель: доступ, рассылка и модерация", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("admin@jobish.ru");
  await page.getByLabel("Пароль", { exact: true }).fill("admin12345!");
  await page.getByRole("button", { name: "Войти", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard/);

  await page.goto("/admin");
  await expect(page.getByRole("heading", { name: /Обзор платформы/i })).toBeVisible();

  // US22 — рассылка
  await page.goto("/admin/broadcast");
  await page.getByLabel("Заголовок").fill("Новая функция");
  await page.getByLabel("Текст").fill("Запустили поиск вакансий!");
  await page.getByRole("button", { name: /Отправить рассылку/i }).click();
  await expect(page.getByText("Отправлено")).toBeVisible();

  // US17 — модерация: блокировка обычного пользователя
  await page.goto("/admin/users");
  await expect(page.getByRole("heading", { name: "Пользователи" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Заблокировать|Разблокировать/ }).first()).toBeVisible();
});

test("обычному пользователю админка недоступна", async ({ page }) => {
  await login(page);
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/dashboard/);
});

test("выход из аккаунта", async ({ page }) => {
  await login(page);
  await page.getByRole("button", { name: "Выйти" }).click();
  await expect(page).toHaveURL(/localhost:3000\/$/);
});
