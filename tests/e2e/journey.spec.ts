import { test, expect, type Page } from "@playwright/test";

// Сквозной сценарий клиента MVP: регистрация → профориентация →
// выбор трека → карта развития → коуч → тарифы → выход.
// Контекст у каждого теста свежий, поэтому логинимся в каждом.

const unique = Date.now();
const user = {
  name: "Тест Пользователь",
  email: `e2e_${unique}@jobish.ru`,
  password: "test1234",
};

async function login(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(user.email);
  await page.getByLabel("Пароль").fill(user.password);
  await page.getByRole("button", { name: "Войти" }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}

test.describe.configure({ mode: "serial" });

test("лендинг открывается и ведёт на регистрацию", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /карьере мечты/i })).toBeVisible();
  await page.getByRole("link", { name: /Начать бесплатно/i }).first().click();
  await expect(page).toHaveURL(/\/register/);
});

test("регистрация создаёт аккаунт и открывает дашборд", async ({ page }) => {
  await page.goto("/register");
  await page.getByLabel("Имя").fill(user.name);
  await page.getByLabel("Email").fill(user.email);
  await page.getByLabel("Пароль").fill(user.password);
  await page.getByRole("button", { name: /Создать аккаунт/i }).click();
  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByText(/Привет, Тест/)).toBeVisible();
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
  await expect(page.getByText(/подходящие профессии/i)).toBeVisible();
});

test("выбор трека строит карту развития", async ({ page }) => {
  await login(page);
  await page.goto("/professions/frontend-developer");
  await expect(page.getByRole("heading", { name: "Frontend-разработчик" })).toBeVisible();
  await page.getByRole("button", { name: /Выбрать как трек развития/i }).click();
  await expect(page).toHaveURL(/\/roadmap/);
  await expect(page.getByText(/Junior — фундамент/i)).toBeVisible();

  const firstStatus = page.getByRole("button", { name: /Изменить статус навыка/i }).first();
  await firstStatus.click();
});

test("AI-коуч отвечает на сообщение", async ({ page }) => {
  await login(page);
  await page.goto("/coach");
  const box = page.getByPlaceholder(/Напишите сообщение/i);
  await box.fill("Привет, помоги с карьерой");
  await box.press("Enter");
  await expect(page.getByText(/Jobish AI/i).first()).toBeVisible();
});

test("оформление тарифа в демо-режиме", async ({ page }) => {
  await login(page);
  await page.goto("/pricing");
  await page.getByRole("button", { name: /Оформить \(демо\)/i }).first().click();
  await expect(page.getByText(/Оформлено|Текущий тариф/i).first()).toBeVisible();
});

test("выход из аккаунта", async ({ page }) => {
  await login(page);
  await page.getByRole("button", { name: "Выйти" }).click();
  await expect(page).toHaveURL(/localhost:3000\/$/);
});
