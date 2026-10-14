import { useEffect, useRef, useState } from "react";
import { Play, X, Send, Clapperboard, Camera, Users, Wrench, Truck, ShieldCheck, KeyRound, Minus, Plus, Trash2, Check } from "lucide-react";
import { gsap } from "@/lib/gsap";
import { useApp, reduceMotion, scrollToId } from "@/lib/state";
import { CATALOG, COMPARE_IDS, DIRS, modelName, photo, rub } from "@/lib/data";
import { Boids, ChromeText } from "./shaders";
import { Eyebrow, H2, Reveal } from "./ui-bits";
import { InteractiveHoverButton } from "./ui/interactive-hover-button";
import { GlowCard } from "./ui/spotlight-card";
import { cn } from "@/lib/utils";

/* ---------------------------------------------------------------- Media */
const SOCS = [
  { n: "Telegram", h: "@erizz_stub", d: ["Дропы, анонсы и закулисье", "Анонсы поставок и новости"], icon: Send },
  { n: "YouTube", h: "E-Rizz", d: ["Обзоры, тесты и send it", "Обзоры и тест-драйвы моделей"], icon: Clapperboard },
  { n: "Instagram", h: "@erizz.stub", d: ["Фото клиентов и кастом-билды", "Фото клиентов и кастомные сборки"], icon: Camera },
  { n: "VK", h: "vk.com/erizz_stub", d: ["Сообщество и розыгрыши", "Сообщество, новости и отзывы"], icon: Users },
];
const VIDS = [
  { t: "Dune roost: KR3 в песках", d: "0:48", p: "nicot-cqr-125re-p25", c: "Тест на песке, 3 камеры" },
  { t: "FALCON GT: первый drop", d: "1:12", p: "79bike-falcon-gt-3", c: "Обзор и замеры" },
  { t: "Ночной город, G7 Pro", d: "0:36", p: "julong-g7-pro-8", c: "Город после заката" },
  { t: "Прыжок на KR9", d: "0:29", p: "nicot-ht5-450nc-p35", c: "Slow-mo send it" },
  { t: "Юг, багги на пляже", d: "1:05", p: "juhool-utv-titan", c: "Поездка к морю" },
  { t: "Custom build за 10 минут", d: "0:58", p: "esuvehicle-es01", c: "Сборка в шоуруме" },
];

export function Media() {
  const { t, say } = useApp();
  const [tab, setTab] = useState<"soc" | "vid">("soc");
  const [open, setOpen] = useState<number | null>(null);
  const close = useRef<HTMLButtonElement>(null);
  const from = useRef<HTMLElement | null>(null);
  const modal = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (open === null) return;
    document.body.style.overflow = "hidden";
    close.current?.focus();
    if (!reduceMotion() && modal.current) gsap.fromTo(modal.current, { scale: 0.86, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.45, ease: "power3.out" });
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(null); };
    window.addEventListener("keydown", k);
    return () => { document.body.style.overflow = ""; window.removeEventListener("keydown", k); from.current?.focus(); };
  }, [open]);
  return (
    <section id="media" className="dark-zone relative isolate overflow-hidden py-20 sm:py-28" aria-labelledby="media-h">
      <Boids className="absolute inset-0 -z-10 h-full w-full opacity-60" count={170} />
      <div className="container-x">
        <Reveal>
          <Eyebrow n="09" dark>медиа</Eyebrow>
          <H2><span id="media-h">{t("Наше", "Наши")}</span> <span className="text-aqua">{t("комьюнити", "каналы и видео")}</span></H2>
          <p className="muted mt-4 max-w-2xl text-lg">{t("Подпишись, смотри обзоры и присылай свои билды. Фон реагирует на курсор: попробуй.", "Подписывайтесь на каналы и смотрите обзоры. Фон реагирует на курсор.")}</p>
        </Reveal>
        <div className="mt-8 flex gap-2" role="tablist" aria-label="Медиа">
          {([["soc", "Соцсети и каналы"], ["vid", "Видео"]] as const).map(([k, l]) => (
            <button key={k} role="tab" id={`tab-${k}`} aria-selected={tab === k} aria-controls={`panel-${k}`} className="chip !text-frost aria-selected:!text-ink" onClick={() => setTab(k)}>{l}</button>
          ))}
        </div>
        {tab === "soc" ? (
          <div id="panel-soc" role="tabpanel" aria-labelledby="tab-soc" className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {SOCS.map((s) => (
              <a key={s.n} href="#media" onClick={(e) => { e.preventDefault(); say("Ссылка-заглушка: подставим настоящий канал"); }} data-cursor="скоро" className="block">
                <GlowCard customSize glowColor="orange" className="touch-pan-y! h-full min-h-[200px]">
                  <div><s.icon size={30} className="text-aqua" aria-hidden="true" /><div className="font-display mt-4 text-2xl font-extrabold uppercase">{s.n}</div><div className="mono mt-1 text-aqua">{s.h}</div></div>
                  <p className="muted text-sm">{t(s.d[0], s.d[1])} <span className="mono">(заглушка)</span></p>
                </GlowCard>
              </a>
            ))}
          </div>
        ) : (
          <div id="panel-vid" role="tabpanel" aria-labelledby="tab-vid" className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {VIDS.map((v, i) => (
              <button key={v.t} data-cursor="play" className="group relative aspect-video cursor-pointer overflow-hidden rounded-2xl border border-frost/20 text-left" onClick={(e) => { from.current = e.currentTarget; setOpen(i); }} aria-label={`Открыть видео: ${v.t}`}>
                <img src={photo(v.p)} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                <span className="absolute inset-0 bg-gradient-to-t from-deep/90 via-deep/10 to-transparent" />
                <span className="absolute left-1/2 top-1/2 grid h-16 w-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-flare text-ink transition-transform group-hover:scale-110"><Play fill="currentColor" size={24} /></span>
                <span className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-4 text-frost">
                  <span className="font-display text-base font-bold leading-tight sm:text-lg">{v.t}</span><span className="mono rounded-full bg-deep/70 px-2 py-1">{v.d}</span>
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
      {open !== null && (
        <div role="dialog" aria-modal="true" aria-label={`Видео: ${VIDS[open].t}`} className="fixed inset-0 z-[150] grid place-items-center bg-deep/90 p-4 backdrop-blur" onClick={() => setOpen(null)}>
          <div ref={modal} className="relative w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
            <div className="relative aspect-video overflow-hidden rounded-2xl bg-black">
              <img src={photo(VIDS[open].p)} alt="" className="h-full w-full object-cover opacity-70" />
              <div className="absolute inset-0 grid place-items-center text-center text-frost"><div><div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-flare text-ink"><Play fill="currentColor" size={30} /></div><p className="font-display mt-4 text-xl font-extrabold uppercase">{VIDS[open].t}</p><p className="mono mt-2 text-aqua">плеер-заглушка / {VIDS[open].c}</p></div></div>
            </div>
            <button ref={close} className="absolute -top-12 right-0 grid h-11 w-11 cursor-pointer place-items-center rounded-full bg-frost text-ink" aria-label="Закрыть видео" onClick={() => setOpen(null)}><X /></button>
          </div>
        </div>
      )}
    </section>
  );
}

/* ---------------------------------------------------------------- Service */
const SVC = [
  { icon: Wrench, h: "Сервис", ty: "Диагностика, замена расходников, обслуживание батарей и подвески.", vy: "Диагностика, замена расходников, обслуживание батарей и подвески.", l: ["свой склад запчастей", "ремонт в день обращения (по возможности)"] },
  { icon: Truck, h: "Доставка", ty: "Привезем в Москву, по Ростову и Краснодарскому краю. Опт отдельным рейсом.", vy: "Доставка в Москву, по Ростову-на-Дону и Краснодарскому краю. Оптовые партии отдельным рейсом.", l: ["сборка и проверка перед выдачей", "самовывоз из шоурума"] },
  { icon: ShieldCheck, h: "Гарантия", ty: "Гарантия на технику и батареи. Условия уточним при покупке.", vy: "Гарантия на технику и батареи. Условия мы согласуем при покупке.", l: ["срок зависит от модели", "заглушка: условия появятся позже"] },
  { icon: KeyRound, h: "Байк под ключ", ty: "Скажи, что хочешь, а мы подберем, соберем, настроим и выдадим готовый build.", vy: "Опишите задачу, а мы подберем, соберем, настроим и выдадим готовую технику.", l: ["подбор и тест-драйв", "кастом: цвет, наклейки, батарея"] },
];
export function Service() {
  const { t } = useApp();
  return (
    <section id="service" className="relative py-20 sm:py-28" aria-labelledby="svc-h">
      <div className="container-x">
        <Reveal>
          <Eyebrow n="10">сервис и доставка</Eyebrow>
          <H2><span id="svc-h">{t("После покупки", "После покупки")}</span> <span className="text-flare">{t("мы рядом", "мы на связи")}</span></H2>
        </Reveal>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {SVC.map((s, i) => (
            <Reveal key={s.h} delay={i * 0.06}>
              <article className="h-full rounded-3xl border border-ink/25 bg-frost p-6 transition hover:-translate-y-1 hover:border-flare">
                <s.icon size={30} className="text-flare" aria-hidden="true" />
                <h3 className="font-display mt-4 text-xl font-extrabold uppercase">{s.h}</h3>
                <p className="mt-2 text-mute">{t(s.ty, s.vy)}</p>
                <ul className="mt-3 space-y-1 text-sm">{s.l.map((x) => <li key={x} className="flex gap-2"><Check size={16} className="mt-0.5 shrink-0 text-flare" aria-hidden="true" />{x}</li>)}</ul>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- Test drive */
const CITIES = ["Ростов-на-Дону (шоурум)", "Краснодарский край (выезд)", "Москва (по записи)"];
const SLOTS = ["10:00", "12:00", "14:00", "16:00", "18:00"];
const todayISO = () => { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().slice(0, 10); };

export function Drive() {
  const { t, driveFor, setDriveFor } = useApp();
  const [city, setCity] = useState(CITIES[0]);
  const [date, setDate] = useState(todayISO());
  const [slot, setSlot] = useState(SLOTS[1]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [err, setErr] = useState<Record<string, string>>({});
  const [done, setDone] = useState<null | { no: string }>(null);
  const ids = Array.from(new Set([...COMPARE_IDS, driveFor]));
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const er: Record<string, string> = {};
    if (name.trim().length < 2) er.name = t("Как тебя зовут?", "Как к вам обращаться?");
    if (phone.replace(/\D/g, "").length < 10) er.phone = t("Нужен номер, минимум 10 цифр", "Укажите номер, минимум 10 цифр");
    if (!date) er.date = "Выберите дату";
    setErr(er);
    if (Object.keys(er).length) return;
    setDone({ no: "TD-" + Math.floor(1000 + Math.random() * 9000) });
  };
  return (
    <section id="drive" className="relative bg-ink py-20 text-frost dark-zone sm:py-28" aria-labelledby="drive-h">
      <div className="container-x grid gap-10 lg:grid-cols-[1fr_1fr]">
        <Reveal>
          <Eyebrow n="11" dark>тест-драйв</Eyebrow>
          <H2><span id="drive-h">{t("Кати", "Запишитесь")}</span> <span className="text-aqua">{t("до покупки", "на тест-драйв")}</span></H2>
          <p className="muted mt-4 max-w-md text-lg">{t("Выбери город, дату и модель. Мы подтвердим время и подготовим байк.", "Выберите город, дату и модель. Мы подтвердим время и подготовим технику.")}</p>
          <img src={photo(driveFor)} alt={modelName(driveFor)} className={cn("mt-8 w-full max-w-md rounded-3xl bg-kelp", CATALOG[driveFor].cut ? "object-contain p-4" : "object-cover")} style={{ aspectRatio: "16/10" }} />
        </Reveal>
        <div className="rounded-3xl bg-frost p-6 text-ink sm:p-8" aria-live="polite">
          {done ? (
            <div data-testid="drive-ok">
              <div className="grid h-14 w-14 place-items-center rounded-full bg-flare"><Check size={30} /></div>
              <h3 className="font-display mt-4 text-3xl font-extrabold uppercase">{t("Ты в списке", "Вы записаны")}</h3>
              <p className="mono mt-1 text-mute">заявка {done.no} / макет, ничего не отправляется</p>
              <ul className="mt-4 space-y-1 text-lg">
                <li><b>Модель:</b> {modelName(driveFor)}</li><li><b>Город:</b> {city}</li><li><b>Дата:</b> {date}, {slot}</li><li><b>Имя:</b> {name}</li>
              </ul>
              <p className="mt-3 text-mute">{t("Мы позвоним и подтвердим время.", "Мы позвоним и подтвердим время.")}</p>
              <button className="btn-ghost mt-5" onClick={() => setDone(null)}>Записаться еще раз</button>
            </div>
          ) : (
            <form onSubmit={submit} noValidate className="grid gap-4" aria-label="Запись на тест-драйв">
              <div><label htmlFor="td-city" className="mono mb-1 block text-mute">город</label>
                <select id="td-city" className="input" value={city} onChange={(e) => setCity(e.target.value)}>{CITIES.map((c) => <option key={c}>{c}</option>)}</select></div>
              <div><label htmlFor="td-model" className="mono mb-1 block text-mute">модель</label>
                <select id="td-model" className="input" value={driveFor} onChange={(e) => setDriveFor(e.target.value)}>{ids.map((id) => <option key={id} value={id}>{modelName(id)}</option>)}</select></div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div><label htmlFor="td-date" className="mono mb-1 block text-mute">дата</label>
                  <input id="td-date" type="date" className="input" min={todayISO()} value={date} onChange={(e) => setDate(e.target.value)} aria-invalid={!!err.date} />
                  {err.date && <p className="mt-1 text-sm text-[#b3220a]">{err.date}</p>}</div>
                <fieldset><legend className="mono mb-1 text-mute">время</legend>
                  <div className="flex flex-wrap gap-1.5">{SLOTS.map((s) => <button type="button" key={s} className="chip !min-h-11 !px-3 text-sm" aria-pressed={slot === s} onClick={() => setSlot(s)}>{s}</button>)}</div></fieldset>
              </div>
              <div><label htmlFor="td-name" className="mono mb-1 block text-mute">имя</label>
                <input id="td-name" className="input" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} aria-invalid={!!err.name} aria-describedby={err.name ? "td-name-e" : undefined} />
                {err.name && <p id="td-name-e" className="mt-1 text-sm text-[#b3220a]">{err.name}</p>}</div>
              <div><label htmlFor="td-phone" className="mono mb-1 block text-mute">телефон</label>
                <input id="td-phone" type="tel" className="input" autoComplete="tel" placeholder="+7 (000) 000-00-00" value={phone} onChange={(e) => setPhone(e.target.value)} aria-invalid={!!err.phone} aria-describedby={err.phone ? "td-phone-e" : undefined} />
                {err.phone && <p id="td-phone-e" className="mt-1 text-sm text-[#b3220a]">{err.phone}</p>}</div>
              <InteractiveHoverButton type="submit" text={t("Записаться", "Записаться")} className="h-14 w-full bg-ink pl-8 text-frost" data-testid="drive-submit" />
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- Footer */
export function Footer() {
  const { t, say } = useApp();
  const stub = (e: React.MouseEvent) => { e.preventDefault(); say("Заглушка: подставим реальные данные"); };
  return (
    <footer className="dark-zone relative overflow-hidden bg-deep pt-16 text-frost">
      <div className="container-x">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <p className="font-display text-3xl font-extrabold uppercase leading-none">{t("Rizz – это когда", "E-Rizz")}</p>
            <p className="font-display text-3xl font-extrabold uppercase leading-none text-aqua">{t("на тебя смотрят.", "Электро и не только.")}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <InteractiveHoverButton text="Опт и дилерам" className="h-12 w-52 border-frost/40 bg-transparent text-frost" onClick={() => say("Заглушка: форма запроса оптового прайса")} />
              <button className="btn-ghost" onClick={() => scrollToId("drive")}>Тест-драйв</button>
            </div>
          </div>
          <div>
            <div className="mono mb-3 text-aqua">контакты (заглушки)</div>
            <ul className="space-y-2 text-sm"><li>+7 (000) 000-00-00</li><li>hello@erizz.example</li><li>Ростов-на-Дону, ул. Примерная, 0</li><li>Москва, Краснодарский край</li></ul>
          </div>
          <div>
            <div className="mono mb-3 text-aqua">соцсети (заглушки)</div>
            <ul className="space-y-1 text-sm">{["Telegram", "YouTube", "Instagram", "VK"].map((s) => <li key={s}><a href="#" onClick={stub} className="inline-flex min-h-9 items-center underline underline-offset-4 hover:text-aqua">{s}</a></li>)}</ul>
          </div>
        </div>
        <div className="relative mt-10 h-[22vw] min-h-[90px] w-full">
          <ChromeText text="E-RIZZ" className="h-full w-full" />
        </div>
        <div className="mono flex flex-wrap justify-between gap-2 border-t border-frost/20 py-5 text-frost/70">
          <span>макет сайта / цены примерные / платежи и контакты: заглушки</span>
          <span>розница и опт / Москва, Ростов-на-Дону, Краснодарский край</span>
        </div>
      </div>
    </footer>
  );
}

/* ---------------------------------------------------------------- Cart drawer */
export function CartDrawer() {
  const { cart, cartOpen, setCartOpen, setQty, removeCart, clearCart, t } = useApp();
  const [view, setView] = useState<"list" | "form" | "ok">("list");
  const [f, setF] = useState({ name: "", phone: "", ship: "Самовывоз, шоурум в Ростове-на-Дону", note: "" });
  const [err, setErr] = useState<Record<string, string>>({});
  const [order, setOrder] = useState<{ no: string; sum: number; n: number } | null>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const total = cart.reduce((a, c) => a + c.price * c.qty, 0);
  const n = cart.reduce((a, c) => a + c.qty, 0);
  useEffect(() => {
    if (!cartOpen) return;
    setView("list");
    closeBtn.current?.focus();
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") setCartOpen(false); };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [cartOpen]); // eslint-disable-line
  if (!cartOpen) return null;
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const er: Record<string, string> = {};
    if (f.name.trim().length < 2) er.name = t("Как тебя зовут?", "Как к вам обращаться?");
    if (f.phone.replace(/\D/g, "").length < 10) er.phone = t("Нужен номер, минимум 10 цифр", "Укажите номер, минимум 10 цифр");
    setErr(er);
    if (Object.keys(er).length) return;
    setOrder({ no: "E-" + Math.floor(10000 + Math.random() * 89999), sum: total, n });
    clearCart(); setView("ok");
  };
  return (
    <div className="fixed inset-0 z-[180]" role="dialog" aria-modal="true" aria-label="Корзина">
      <div className="absolute inset-0 bg-deep/70 backdrop-blur-sm" onClick={() => setCartOpen(false)} />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-[460px] flex-col bg-frost text-ink shadow-2xl">
        <div className="flex items-center justify-between border-b border-ink/15 p-5">
          <h2 className="font-display text-2xl font-extrabold uppercase">{view === "form" ? "Оформление" : view === "ok" ? "Готово" : "Корзина"}</h2>
          <button ref={closeBtn} className="grid h-11 w-11 cursor-pointer place-items-center rounded-full hover:bg-ink/10" aria-label="Закрыть корзину" onClick={() => setCartOpen(false)}><X /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          {view === "ok" && order ? (
            <div data-testid="order-ok">
              <div className="grid h-14 w-14 place-items-center rounded-full bg-flare"><Check size={30} /></div>
              <h3 className="font-display mt-4 text-2xl font-extrabold uppercase">{t("Заказ принят", "Заказ принят")}</h3>
              <p className="mono mt-1 text-mute">№ {order.no} / макет, ничего не отправляется</p>
              <p className="mt-3">Позиций: {order.n}. Сумма: <b>{rub(order.sum)}</b> <span className="text-mute">(примерная)</span>.</p>
              <p className="mt-2 text-mute">{t("Мы позвоним, уточним детали, цену и доставку.", "Мы позвоним, чтобы уточнить детали, итоговую цену и доставку.")}</p>
              <button className="btn-solid mt-5" onClick={() => setCartOpen(false)}>Отлично</button>
            </div>
          ) : view === "form" ? (
            <form id="order-form" onSubmit={submit} noValidate className="grid gap-4" aria-label="Оформление заказа">
              <div><label htmlFor="o-name" className="mono mb-1 block text-mute">имя</label><input id="o-name" className="input" autoComplete="name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} aria-invalid={!!err.name} />{err.name && <p className="mt-1 text-sm text-[#b3220a]">{err.name}</p>}</div>
              <div><label htmlFor="o-phone" className="mono mb-1 block text-mute">телефон</label><input id="o-phone" type="tel" className="input" autoComplete="tel" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} aria-invalid={!!err.phone} />{err.phone && <p className="mt-1 text-sm text-[#b3220a]">{err.phone}</p>}</div>
              <div><label htmlFor="o-ship" className="mono mb-1 block text-mute">получение</label>
                <select id="o-ship" className="input" value={f.ship} onChange={(e) => setF({ ...f, ship: e.target.value })}>
                  <option>Самовывоз, шоурум в Ростове-на-Дону</option><option>Доставка по Краснодарскому краю</option><option>Доставка в Москву</option><option>Опт: запрос условий</option>
                </select></div>
              <div><label htmlFor="o-note" className="mono mb-1 block text-mute">комментарий</label><textarea id="o-note" rows={3} className="input" value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} /></div>
              <p className="mono text-mute">Оплата: заглушка. Платежей нет, данные никуда не уходят.</p>
            </form>
          ) : cart.length === 0 ? (
            <div className="grid place-items-center py-16 text-center"><p className="font-display text-2xl font-extrabold uppercase">Пусто</p><p className="mt-2 text-mute">{t("Добавь байк из линейки или собери свой в конструкторе.", "Добавьте технику из линейки или соберите свою в конструкторе.")}</p>
              <button className="btn-solid mt-5" onClick={() => { setCartOpen(false); scrollToId("lineup"); }}>К линейке</button></div>
          ) : (
            <ul className="grid gap-4" data-testid="cart-list">
              {cart.map((c) => (
                <li key={c.id} className="grid grid-cols-[84px_1fr_auto] items-center gap-3 border-b border-ink/10 pb-4">
                  <img src={c.img} alt="" className="h-[64px] w-[84px] rounded-lg bg-ink/10 object-contain" />
                  <div className="min-w-0"><div className="truncate font-semibold">{c.name}</div><div className="truncate text-xs text-mute">{c.sub}</div>
                    <div className="mt-1 flex items-center gap-1">
                      <button className="grid h-11 w-11 cursor-pointer place-items-center rounded-full border border-ink/30 hover:bg-ink/10" aria-label={`Меньше: ${c.name}`} onClick={() => setQty(c.id, -1)}><Minus size={16} /></button>
                      <span className="w-6 text-center font-bold" aria-live="polite">{c.qty}</span>
                      <button className="grid h-11 w-11 cursor-pointer place-items-center rounded-full border border-ink/30 hover:bg-ink/10" aria-label={`Больше: ${c.name}`} onClick={() => setQty(c.id, 1)}><Plus size={16} /></button>
                    </div></div>
                  <div className="text-right"><div className="font-bold">{rub(c.price * c.qty)}</div>
                    <button className="grid h-11 w-11 cursor-pointer place-items-center rounded-full text-mute hover:text-flare" aria-label={`Убрать: ${c.name}`} onClick={() => removeCart(c.id)}><Trash2 size={18} /></button></div>
                </li>
              ))}
            </ul>
          )}
        </div>
        {view !== "ok" && cart.length > 0 && (
          <div className="border-t border-ink/15 p-5">
            <div className="flex items-end justify-between"><span className="mono text-mute">итого ({n}) / примерная цена</span><span className="font-display text-2xl font-extrabold" data-testid="cart-total">{rub(total)}</span></div>
            {view === "list" ? (
              <InteractiveHoverButton text="Оформить заказ" className="mt-4 h-14 w-full bg-ink pl-8 text-frost" onClick={() => setView("form")} data-testid="checkout" />
            ) : (
              <div className="mt-4 flex gap-2"><button className="btn-ghost" onClick={() => setView("list")}>Назад</button><InteractiveHoverButton type="submit" form="order-form" text="Подтвердить" className="h-12 flex-1 bg-ink text-frost" data-testid="order-submit" /></div>
            )}
          </div>
        )}
      </aside>
    </div>
  );
}

void DIRS;
