/* Заставка при загрузке (19.10): белый экран плавно уходит в темный, 1,1 с темного,
   затем мигание белый 20 мс, черный 20 мс, белый 50 мс и снова темный.
   Само мигание в index.html (CSS от первого кадра). Здесь только снимаем заставку,
   когда мигание закончилось и сайт готов: стартовый экран под ней тоже темный. */
const W = window as unknown as { __gtBoot0?: number; __gtBootEnd?: number };
const SEQ = 1600; // мс: вся последовательность, после нее экран снова темный
const FADE = 280; // мс: заставка растворяется в темный стартовый экран

let started = false;
export function startBoot() {
  if (started) return;
  started = true;
  const el = document.getElementById("boot");
  if (!el) { W.__gtBootEnd = performance.now(); return; }
  el.dataset.go = "1";
  const wait = Math.max(0, (W.__gtBoot0 ?? 0) + SEQ - performance.now());
  W.__gtBootEnd = performance.now() + wait + FADE * 0.5;
  window.setTimeout(() => {
    el.classList.add("out");
    window.setTimeout(() => el.remove(), FADE + 60);
  }, wait);
}

/** Сколько секунд осталось до того, как заставка уйдет. Для задержки входных анимаций. */
export const bootDelay = () => Math.max(0, ((W.__gtBootEnd ?? 0) - performance.now()) / 1000);
