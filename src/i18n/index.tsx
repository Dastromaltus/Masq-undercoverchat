import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { fr, type Dict } from "./fr";
import { en } from "./en";

export type Lang = "fr" | "en";
const dicts: Record<Lang, Dict> = { fr, en };

const I18nCtx = createContext<{ lang: Lang; t: Dict; setLang: (l: Lang) => void }>({
  lang: "fr",
  t: fr,
  setLang: () => {},
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("fr");
  useEffect(() => {
    const saved = localStorage.getItem("masq.lang");
    if (saved === "fr" || saved === "en") setLangState(saved);
    else if (navigator.language?.startsWith("en")) setLangState("en");
  }, []);
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);
  const setLang = (l: Lang) => {
    localStorage.setItem("masq.lang", l);
    setLangState(l);
  };
  return <I18nCtx.Provider value={{ lang, t: dicts[lang], setLang }}>{children}</I18nCtx.Provider>;
}

export const useI18n = () => useContext(I18nCtx);
