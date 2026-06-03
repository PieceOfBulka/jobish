import Link from "next/link";
import {
  MessageSquareHeart,
  Map,
  Target,
  BarChart3,
  CheckCircle2,
  Sparkles,
  GraduationCap,
  Repeat,
  ArrowRight,
} from "lucide-react";

const FEATURES = [
  {
    icon: MessageSquareHeart,
    title: "AI-коуч в чате",
    text: "Персональный диалог: помогает выбрать направление, сформулировать цели и не терять мотивацию.",
  },
  {
    icon: Target,
    title: "Профориентация",
    text: "Тест на интересы и склонности подбирает до 10 подходящих профессий с уровнем соответствия.",
  },
  {
    icon: Map,
    title: "Карта развития (roadmap)",
    text: "Пошаговый путь по треку: навыки по грейдам, материалы и контрольные точки.",
  },
  {
    icon: CheckCircle2,
    title: "Контрольные тесты",
    text: "Проверяют прогресс по этапам. Слабые темы подсвечиваются, чтобы знать, что подтянуть.",
  },
  {
    icon: BarChart3,
    title: "Аналитика рынка",
    text: "Зарплаты по грейдам, востребованность и топ-компании — для осознанного выбора.",
  },
  {
    icon: Sparkles,
    title: "Прогресс и мотивация",
    text: "Трекер навыков, серии входов и поддержка коуча удерживают фокус на цели.",
  },
];

const STEPS = [
  { n: "01", t: "Пройдите профориентацию", d: "Ответьте на несколько вопросов — получите подходящие профессии." },
  { n: "02", t: "Выберите трек", d: "Изучите аналитику рынка и зафиксируйте цель развития." },
  { n: "03", t: "Идите по карте", d: "Осваивайте навыки, проходите тесты, отмечайте прогресс." },
  { n: "04", t: "Растите с коучем", d: "AI-коуч помогает на каждом шаге и поддерживает мотивацию." },
];

export default function LandingPage() {
  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-24 left-1/2 h-96 w-[48rem] -translate-x-1/2 rounded-full bg-brand-200/40 blur-3xl" />
          <div className="absolute right-0 top-40 h-72 w-72 rounded-full bg-accent-400/20 blur-3xl" />
        </div>
        <div className="container-page py-20 sm:py-28">
          <div className="mx-auto max-w-3xl text-center" style={{ animation: "var(--animate-fade-up)" }}>
            <span className="badge bg-brand-50 text-brand-700">
              <Sparkles className="h-3.5 w-3.5" /> Карьерный коуч-консультант
            </span>
            <h1 className="mt-5 text-4xl font-extrabold leading-tight tracking-tight text-ink sm:text-6xl">
              Прозрачный путь к{" "}
              <span className="bg-gradient-to-r from-brand-600 to-accent-500 bg-clip-text text-transparent">
                карьере мечты
              </span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-600">
              Jobish берёт на себя анализ и структурирование информации о
              профессиях. Вы получаете персональный план развития, AI-коуча и
              честную аналитику рынка труда.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link href="/register" className="btn-primary text-base">
                Начать бесплатно <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/professions" className="btn-outline text-base">
                Смотреть профессии
              </Link>
            </div>
            <p className="mt-4 text-sm text-slate-400">
              Без карты. Базовый доступ навсегда бесплатный.
            </p>
          </div>
        </div>
      </section>

      {/* SEGMENTS */}
      <section className="container-page pb-8">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="card card-hover flex items-start gap-4 p-6">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">
              <GraduationCap className="h-6 w-6" />
            </span>
            <div>
              <h3 className="font-semibold text-ink">Выпускникам и новичкам</h3>
              <p className="mt-1 text-sm text-slate-600">
                Найдите своё направление как можно раньше и устройтесь в желаемую
                область с понятным планом.
              </p>
            </div>
          </div>
          <div className="card card-hover flex items-start gap-4 p-6">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-accent-400/15 text-accent-600">
              <Repeat className="h-6 w-6" />
            </span>
            <div>
              <h3 className="font-semibold text-ink">Опытным в смене сферы</h3>
              <p className="mt-1 text-sm text-slate-600">
                Перейдите в новую профессию без хаоса: оцените текущую работу и
                постройте маршрут перехода.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="container-page py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            Всё для карьерного роста
          </h2>
          <p className="mt-3 text-slate-600">
            Семь ключевых возможностей MVP, которые ведут вас от выбора до
            результата.
          </p>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="card card-hover p-6">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-600">
                <f.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 font-semibold text-ink">{f.title}</h3>
              <p className="mt-1.5 text-sm text-slate-600">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="bg-white py-20">
        <div className="container-page">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
              Как это работает
            </h2>
            <p className="mt-3 text-slate-600">Четыре шага до ясной траектории.</p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-4">
            {STEPS.map((s) => (
              <div key={s.n} className="relative">
                <span className="text-4xl font-extrabold text-brand-100">
                  {s.n}
                </span>
                <h3 className="mt-2 font-semibold text-ink">{s.t}</h3>
                <p className="mt-1 text-sm text-slate-600">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container-page py-20">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 to-brand-800 px-8 py-14 text-center text-white">
          <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
          <h2 className="text-3xl font-bold sm:text-4xl">
            Начните строить карьеру сегодня
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-brand-100">
            Регистрация занимает минуту. Профориентация и карта развития — уже в
            бесплатном тарифе.
          </p>
          <Link
            href="/register"
            className="btn mt-7 bg-white text-brand-700 hover:bg-brand-50"
          >
            Создать аккаунт <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </>
  );
}
