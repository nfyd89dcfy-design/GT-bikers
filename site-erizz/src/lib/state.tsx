import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { COMPARE_IDS, DIRS, type DirKey } from "./data";

/* ---------- голос: ты / вы ---------- */
export type Voice = "ty" | "vy";
export type Theme = "day" | "night";
interface AppCtx {
  theme: Theme;
  setTheme: (t: Theme) => void;
  voice: Voice;
  setVoice: (v: Voice) => void;
  t: (ty: string, vy: string) => string;
  dir: DirKey;
  setDir: (d: DirKey) => void;
  gateOpen: boolean;
  setGateOpen: (b: boolean) => void;
  cart: CartItem[];
  addCart: (it: Omit<CartItem, "qty">) => void;
  setQty: (id: string, d: number) => void;
  removeCart: (id: string) => void;
  clearCart: () => void;
  cartOpen: boolean;
  setCartOpen: (b: boolean) => void;
  toast: string;
  say: (s: string) => void;
  compare: string[];
  toggleCompare: (id: string) => void;
  driveFor: string;
  setDriveFor: (id: string) => void;
}
export interface CartItem { id: string; name: string; sub: string; price: number; variant: string; paint?: string; qty: number }

const Ctx = createContext<AppCtx>(null as unknown as AppCtx);
export const useApp = () => useContext(Ctx);

const safe = {
  get(k: string) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k: string, v: string) { try { localStorage.setItem(k, v); } catch { /* noop */ } },
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [voice, setVoiceS] = useState<Voice>(() => (safe.get("erizz-voice") === "vy" ? "vy" : "ty"));
  const [dir, setDirS] = useState<DirKey>(() => {
    const d = safe.get("erizz-dir");
    return DIRS.some((x) => x.key === d) ? (d as DirKey) : "enduro";
  });
  const [gateOpen, setGateOpen] = useState(() => !new URLSearchParams(location.search).has("skip"));
  const [cart, setCart] = useState<CartItem[]>(() => {
    try { return (JSON.parse(safe.get("erizz-cart4") || "[]") as CartItem[]); } catch { return []; }
  });
  const [cartOpen, setCartOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [compare, setCompare] = useState<string[]>(COMPARE_IDS);
  const [driveFor, setDriveFor] = useState("gt-pulse-17");

  useEffect(() => { safe.set("erizz-cart4", JSON.stringify(cart)); }, [cart]);
  const setVoice = (v: Voice) => { setVoiceS(v); safe.set("erizz-voice", v); };
  const [theme, setThemeS] = useState<Theme>(() => { const q = new URLSearchParams(location.search).get("theme"); return q === "night" || q === "day" ? q : safe.get("erizz-theme") === "night" ? "night" : "day"; });
  useEffect(() => { document.documentElement.dataset.theme = theme; }, [theme]);
  const setTheme = (v: Theme) => { setThemeS(v); safe.set("erizz-theme", v); };
  const setDir = (d: DirKey) => { setDirS(d); safe.set("erizz-dir", d); };
  const t = useCallback((ty: string, vy: string) => (voice === "ty" ? ty : vy), [voice]);
  const say = useCallback((s: string) => {
    setToast(s);
    window.clearTimeout((say as unknown as { _t?: number })._t);
    (say as unknown as { _t?: number })._t = window.setTimeout(() => setToast(""), 2600);
  }, []);
  const addCart = (it: Omit<CartItem, "qty">) => {
    setCart((c) => (c.find((x) => x.id === it.id) ? c.map((x) => (x.id === it.id ? { ...x, qty: x.qty + 1 } : x)) : [...c, { ...it, qty: 1 }]));
    say(`В корзине: ${it.name}`);
  };
  const setQty = (id: string, d: number) => setCart((c) => c.map((x) => (x.id === id ? { ...x, qty: Math.max(1, x.qty + d) } : x)));
  const removeCart = (id: string) => setCart((c) => c.filter((x) => x.id !== id));
  const clearCart = () => setCart([]);
  const toggleCompare = (id: string) =>
    setCompare((c) => (c.includes(id) ? (c.length > 2 ? c.filter((x) => x !== id) : c) : c.length >= 3 ? [...c.slice(1), id] : [...c, id]));

  const value = useMemo(
    () => ({ theme, setTheme, voice, setVoice, t, dir, setDir, gateOpen, setGateOpen, cart, addCart, setQty, removeCart, clearCart, cartOpen, setCartOpen, toast, say, compare, toggleCompare, driveFor, setDriveFor }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [theme, voice, t, dir, gateOpen, cart, cartOpen, toast, say, compare, driveFor]
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const reduceMotion = () => typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;
export const scrollToId = (id: string) => {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: reduceMotion() ? "auto" : "smooth", block: "start" });
};
