import { useMemo, useRef, useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { useApp, type Reserve } from "@/lib/state";
import { DEPOSIT, GROUPS, GROUP_RU, LINEUP, L_BY, glbKey, lSpec, rub, studio } from "@/lib/data";
import { PARTS, type Box, type PartKey } from "@/lib/parts";
import { BATT, CTRL, DECAL, GEAR_ITEMS, KITS, PAINT, cfgKey, cfgLines, cfgPrice, emptyCfg, hueOf, paintFilterHue, shopImg, type BuildCfg } from "@/lib/options";
import { Dive, DiveHead } from "./pickers";
import { cn } from "@/lib/utils";

/* ================================================================
   Бронь с настройкой (20.10): прежде чем байк попадет в корзину,
   человек собирает его: цвет, батарея, контроллер, наклейки, пакеты и экипировка.
   Открывается кругом от кнопки «Забронировать» в любом месте сайта.
   ================================================================ */
export function ReserveLayer() {
  const { reserve, closeReserve } = useApp();
  if (!reserve) return null;
  return <ReservePicker key={`${reserve.id}-${reserve.at.x}-${reserve.at.y}`} r={reserve} onClose={closeReserve} />;
}

const STEPS = ["сборка", "экипировка", "итог"];
const KIT_MARK: Record<number, [PartKey, string]> = { 0: ["fork", "защита"], 1: ["bar", "свет и номер"], 2: ["rw", "гусеница"] };

function ReservePicker({ r, onClose }: { r: Reserve; onClose: () => void }) {
  const { t, addCart, setCartOpen } = useApp();
  const [id, setId] = useState(r.id);
  const m = L_BY[id] ?? LINEUP[0];
  const [cfg, setCfg] = useState<BuildCfg>({ ...emptyCfg(), ...r.cfg });
  const [step, setStep] = useState(0);
  const box = useRef<HTMLDivElement>(null);
  const go = (s: number) => { setStep(s); box.current?.closest(".dive")?.scrollTo({ top: 0, behavior: "smooth" }); };
  const set = <K extends keyof BuildCfg>(k: K, v: BuildCfg[K]) => setCfg((c) => ({ ...c, [k]: v }));
  const toggle = (k: "kits" | "gear", v: number | string) =>
    setCfg((c) => { const arr = c[k] as (number | string)[]; return { ...c, [k]: arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v] } as BuildCfg; });
  const extra = cfgPrice(cfg);
  const lines = cfgLines(cfg);
  const marks = useMemo(() => {
    const out: { k: PartKey; l: string }[] = [];
    if (cfg.batt) out.push({ k: "bat", l: `АКБ · ${BATT[cfg.batt].n}` });
    if (cfg.ctrl) out.push({ k: "ctl", l: CTRL[cfg.ctrl].n });
    cfg.kits.forEach((k) => out.push({ k: KIT_MARK[k][0], l: KIT_MARK[k][1] }));
    return out;
  }, [cfg]);
  const add = (close: (after?: () => void) => void) => {
    addCart({ id: `${m.id}#${cfgKey(cfg)}`, model: m.id, name: m.name, sub: lines.length ? lines.slice(0, 3).join(" · ") : "базовая сборка", price: DEPOSIT, variant: glbKey(m), paint: PAINT[cfg.paint].c, opts: lines, extra });
    close(() => setCartOpen(true));
  };

  return (
    <Dive at={r.at} onClose={onClose} label={`Бронь: ${m.name}`}>
      {(close) => (
        <div ref={box} className="relative">
          <DiveHead title="бронь и сборка" steps={STEPS} cur={step} onBack={step > 0 ? () => go(step - 1) : undefined} close={close} />
          <div className="container-x pb-24 pt-8 sm:pt-10">
            <div className="grid gap-8 lg:grid-cols-[1.25fr_1fr] lg:gap-12">
              {/* слева всегда байк: цвет и отметки выбранных узлов меняются сразу */}
              <div className="lg:sticky lg:top-24 lg:self-start">
                <p data-in className="mono t-label">шаг {step + 1} из 3 · {GROUP_RU[m.group]}</p>
                <h2 data-in className="h-hero mt-3 text-[clamp(30px,4.2vw,62px)]">{m.name}</h2>
                <div data-in className="t-tile relative mt-6 overflow-hidden rounded-2xl p-2 sm:p-4">
                  <BuildShot n={m.n} hue={hueOf(m)} paint={cfg.paint} marks={marks} decal={DECAL[cfg.decal].txt} />
                </div>
                <dl data-in className="mt-4 grid grid-cols-3 gap-2 text-sm">
                  {lSpec(m).slice(0, 3).map((s) => <div key={s.k} className="t-tile rounded-xl p-3"><dt className="mono t-mute">{s.k}</dt><dd className="mt-1 font-semibold">{s.v}</dd></div>)}
                </dl>
              </div>

              <div>
                {step === 0 && (
                  <div key="s0" className="dive-step grid gap-6">
                    <Group label="модель">
                      <select className="input" value={id} onChange={(e) => setId(e.target.value)} aria-label="Модель">
                        {GROUPS.filter((g) => g.key !== "all").map((g) => (
                          <optgroup key={g.key} label={g.ru}>{LINEUP.filter((x) => x.group === g.key).map((x) => <option key={x.id} value={x.id}>{x.name} · {x.wheels}</option>)}</optgroup>
                        ))}
                      </select>
                    </Group>
                    <Group label="цвет пластика">
                      {PAINT.map((p, i) => (
                        <button key={p.n} aria-pressed={cfg.paint === i} onClick={() => set("paint", i)} className="t-chip inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full px-4 text-sm font-semibold">
                          <span className="h-4 w-4 rounded-full border border-[var(--t-line)]" style={{ background: p.c ?? "linear-gradient(135deg,#222,#ff4a2b)" }} />{p.n}
                        </button>
                      ))}
                    </Group>
                    <Group label="батарея">{BATT.map((x, i) => <Opt key={x.n} on={cfg.batt === i} onClick={() => set("batt", i)} n={x.n} p={x.p} />)}</Group>
                    <Group label="контроллер">{CTRL.map((x, i) => <Opt key={x.n} on={cfg.ctrl === i} onClick={() => set("ctrl", i)} n={x.n} p={x.p} d={x.d} />)}</Group>
                    <Group label="наклейки">{DECAL.map((x, i) => <Opt key={x.n} on={cfg.decal === i} onClick={() => set("decal", i)} n={x.n} p={x.p} />)}</Group>
                    <Group label="пакеты, можно несколько">{KITS.map((x, i) => <Opt key={x.n} on={cfg.kits.includes(i)} onClick={() => toggle("kits", i)} n={x.n} p={x.p} d={x.d} check />)}</Group>
                    <Foot extra={extra} next={() => go(1)} text="Дальше: экипировка" />
                  </div>
                )}

                {step === 1 && (
                  <div key="s1" className="dive-step">
                    <h3 className="font-display text-2xl font-extrabold uppercase">Экипировка к байку</h3>
                    <p className="t-mute mt-2">{t("Отметь, что нужно. Размеры подберем на примерке в шоуруме.", "Отметьте, что нужно. Размеры подберем на примерке в шоуруме.")}</p>
                    <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {GEAR_ITEMS.map((g, i) => {
                        const on = cfg.gear.includes(g.k);
                        return (
                          <li key={g.k} className="dive-item" style={{ ["--i" as string]: i }}>
                            <button onClick={() => toggle("gear", g.k)} aria-pressed={on} className={cn("dive-card t-tile spot group relative flex w-full cursor-pointer flex-col items-center rounded-xl p-4 text-center", on && "is-on")}>
                              {on && <span className="absolute right-3 top-3 grid h-7 w-7 place-items-center rounded-full bg-flare text-ink"><Check size={16} /></span>}
                              <img src={shopImg(g.img)} alt="" className="h-24 w-24 object-contain transition-transform duration-500 group-hover:scale-[1.06] sm:h-28 sm:w-28" />
                              <span className="mt-2 font-semibold leading-tight">{g.n}</span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                    <p className="mono t-mute mt-4">цену экипировки назовем при подтверждении брони</p>
                    <Foot extra={extra} next={() => go(2)} text="Дальше: итог" />
                  </div>
                )}

                {step === 2 && (
                  <div key="s2" className="dive-step">
                    <h3 className="font-display text-2xl font-extrabold uppercase">Итог сборки</h3>
                    <ul className="mt-5 grid gap-0">
                      <Row k="байк" v={m.name} p="бронь" />
                      <Row k="цвет" v={PAINT[cfg.paint].n} />
                      <Row k="батарея" v={BATT[cfg.batt].n} p={BATT[cfg.batt].p} />
                      <Row k="контроллер" v={CTRL[cfg.ctrl].n} p={CTRL[cfg.ctrl].p} />
                      <Row k="наклейки" v={DECAL[cfg.decal].n} p={DECAL[cfg.decal].p} />
                      {cfg.kits.map((k) => <Row key={k} k="пакет" v={`${KITS[k].n}: ${KITS[k].d}`} p={KITS[k].p ?? "при подтверждении"} />)}
                      {cfg.gear.length > 0 && <Row k="экипировка" v={cfg.gear.map((g) => GEAR_ITEMS.find((x) => x.k === g)?.n).join(", ")} p="при подтверждении" />}
                    </ul>
                    <div className="mt-6 flex items-end justify-between border-t t-line pt-4">
                      <span className="mono t-mute">опции, ориентировочно</span>
                      <span className="font-display text-3xl font-extrabold">{extra ? `≈ ${rub(extra)}` : "0 ₽"}</span>
                    </div>
                    <p className="t-mute mt-3 text-sm leading-snug">{t("Цену байка назовем после теста образца. Опции и экипировку оплачиваешь при выдаче, бронь можно отменить.", "Цену байка назовем после теста образца. Опции и экипировку вы оплачиваете при выдаче, бронь можно отменить.")}</p>
                    <div className="mt-8 flex flex-wrap gap-3">
                      <button className="btn-solid inline-flex min-h-14 items-center gap-2 px-7" onClick={() => add(close)} data-testid="reserve-add">Добавить в корзину <ArrowRight size={18} /></button>
                      <button className="btn-ghost min-h-14" onClick={() => go(0)}>Изменить сборку</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </Dive>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <fieldset className="border-0 p-0">
      <legend className="mono t-label mb-2">{label}</legend>
      <div className="flex flex-wrap gap-2">{children}</div>
    </fieldset>
  );
}

function Opt({ n, p, d, on, onClick, check }: { n: string; p: number | null; d?: string; on: boolean; onClick: () => void; check?: boolean }) {
  return (
    <button aria-pressed={on} onClick={onClick} title={d} className="t-chip inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full px-4 text-sm font-semibold">
      {check && <span className={cn("grid h-4 w-4 place-items-center rounded border", on ? "border-current" : "border-[var(--t-line)]")}>{on && <Check size={12} />}</span>}
      {n}
      <span className="opacity-60">{p === null ? "цена позже" : p ? `+${rub(p)}` : ""}</span>
    </button>
  );
}

function Foot({ extra, next, text }: { extra: number; next: () => void; text: string }) {
  return (
    <div className="mt-2 flex flex-wrap items-center justify-between gap-4 border-t t-line pt-5">
      <div><div className="mono t-mute">опции</div><div className="font-display text-2xl font-extrabold">{extra ? `≈ ${rub(extra)}` : "базовая сборка"}</div></div>
      <button className="btn-solid inline-flex min-h-14 items-center gap-2 px-7" onClick={next}>{text} <ArrowRight size={18} /></button>
    </div>
  );
}

function Row({ k, v, p }: { k: string; v: string; p?: number | string }) {
  return (
    <li className="grid grid-cols-[110px_1fr_auto] items-baseline gap-3 border-b t-line py-3">
      <span className="mono t-mute">{k}</span><span className="font-semibold">{v}</span>
      <span className="t-mute text-sm">{typeof p === "number" ? (p ? `+${rub(p)}` : "") : p ?? ""}</span>
    </li>
  );
}

/** Фото байка с цветом пластика и рамками выбранных узлов. */
function BuildShot({ n, hue, paint, marks, decal }: { n: number; hue: number; paint: number; marks: { k: PartKey; l: string }[]; decal: string }) {
  const P = PARTS[n];
  return (
    <div className="relative aspect-[16/9] w-full">
      <img src={studio(n)} alt="" className="absolute inset-0 h-full w-full object-contain transition-[filter] duration-500" style={{ filter: paintFilterHue(paint, hue) }} />
      {decal && <span className="font-display pointer-events-none absolute left-[44%] top-[46%] -rotate-[8deg] rounded bg-flare px-2 py-0.5 text-[clamp(9px,1.3vw,16px)] font-extrabold text-ink shadow-lg">{decal}</span>}
      {marks.map((mk, i) => {
        const [x, y, w, h] = P[mk.k] as Box;
        return (
          <div key={mk.k + mk.l} className="dive__mark" style={{ left: `${x}%`, top: `${y}%`, width: `${w}%`, height: `${h}%`, ["--i" as string]: i }}>
            <i /><i /><i /><i />
            <span className={cn("mono", (mk.k === "ctl" || mk.k === "mot" || mk.k === "rw" || y < 14) && "dive__mark-b", mk.k === "fork" && "dive__mark-r")}>{mk.l}</span>
          </div>
        );
      })}
    </div>
  );
}
