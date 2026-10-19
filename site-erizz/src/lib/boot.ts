/* Заставки-оверлея больше нет (19.10): стартовый экран открывается сразу и мигает фоном сам (top.tsx, ToneGate).
   Функции оставлены, чтобы не трогать места, где ими задерживают входные анимации. */
const W = window as unknown as { __gtBootEnd?: number };

export function startBoot() { W.__gtBootEnd = performance.now(); }

/** Сколько секунд осталось до конца заставки. Сейчас всегда 0. */
export const bootDelay = () => Math.max(0, ((W.__gtBootEnd ?? 0) - performance.now()) / 1000);
