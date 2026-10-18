/* Заставка при загрузке: синий экран держится, пока грузится сайт (не меньше 0,8 с),
   потом страница дважды мигает "бам-бам" и включается. Сама анимация в index.html (CSS, идет даже при занятом потоке). */
const W = window as unknown as { __gtBoot0?: number; __gtBootEnd?: number };
const HOLD = 800; // мс синего экрана от начала загрузки
const FLICK = 390; // мс до включения страницы: белый, синий, белый

let started = false;
export function startBoot() {
  if (started) return;
  started = true;
  const el = document.getElementById("boot");
  if (!el) { W.__gtBootEnd = performance.now(); return; }
  el.dataset.go = "1";
  const wait = Math.max(250, HOLD - (performance.now() - (W.__gtBoot0 ?? 0)));
  W.__gtBootEnd = performance.now() + wait + FLICK;
  el.style.setProperty("--d", `${Math.round(wait)}ms`);
  el.classList.add("go");
  window.setTimeout(() => el.remove(), wait + 700);
}

/** Сколько секунд осталось до того, как страница "включится". Для задержки входных анимаций. */
export const bootDelay = () => Math.max(0, ((W.__gtBootEnd ?? 0) - performance.now()) / 1000);
