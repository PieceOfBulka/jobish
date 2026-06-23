import { Logo } from "./Logo";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-slate-100 bg-white">
      <div className="container-page grid gap-8 py-12 md:grid-cols-4">
        <div className="md:col-span-2">
          <Logo />
          <p className="mt-3 max-w-sm text-sm text-slate-500">
            Прозрачный персонализированный путь профессионального развития.
            AI-коуч, карта развития, тесты и аналитика рынка труда в одном месте.
          </p>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold text-ink">Продукт</h4>
          <ul className="space-y-2 text-sm text-slate-500">
            <li><Link href="/professions" className="hover:text-brand-700">Профессии</Link></li>
            <li><Link href="/pricing" className="hover:text-brand-700">Тарифы</Link></li>
            <li><Link href="/register" className="hover:text-brand-700">Регистрация</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold text-ink">Сегменты</h4>
          <ul className="space-y-2 text-sm text-slate-500">
            <li>Выпускники и молодые специалисты</li>
            <li>Опытные специалисты в смене сферы</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-slate-100">
        <div className="container-page flex h-14 items-center justify-between text-xs text-slate-400">
          <span>© {new Date().getFullYear()} Jobish</span>
          <span>Сделано с заботой о вашей карьере</span>
        </div>
      </div>
    </footer>
  );
}
