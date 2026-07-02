'use client';
import { useState } from "react";
import { LANGS, STRINGS, COUNTRIES, PRICE, FREE_SHIP, REVIEW_COUNT, RATING } from "./strings";
import "./I18nDemo.scss";

type Vars = Record<string, string>;
const fill = (tpl: string, vars: Vars) =>
  tpl.replace(/\{(\w+)\}/g, (_, k: string) => (k in vars ? vars[k] : `{${k}}`));

const I18nDemo = () => {
  const [lang, setLang] = useState<keyof typeof STRINGS>("en");
  const [countryCode, setCountryCode] = useState("US");

  const t = STRINGS[lang];
  const dir = LANGS.find((l) => l.code === lang)?.dir ?? "ltr";
  const country = COUNTRIES.find((c) => c.code === countryCode) ?? COUNTRIES[0];

  // Locale-aware formatting (price, free-ship threshold, ships-by date).
  const money = (n: number) =>
    new Intl.NumberFormat(country.locale, { style: "currency", currency: country.currency }).format(n);
  const num = (n: number) => new Intl.NumberFormat(country.locale).format(n);
  const shipDate = new Date(Date.now() + 3 * 86400000);
  const shipBy = new Intl.DateTimeFormat(country.locale, { dateStyle: "medium" }).format(shipDate);

  const stars = "★".repeat(RATING) + "☆".repeat(5 - RATING);

  return (
    <div className="i18n-page">

      <main className="i18n-main">
        <div className="i18n-titleblock">
          <p className="i18n-kicker">React · i18n</p>
          <h1 className="i18n-title">Internationalization</h1>
        </div>

        <div className="i18n-langs">
          {LANGS.map((l) => (
            <button
              key={l.code}
              className={"i18n-lang" + (lang === l.code ? " is-active" : "")}
              onClick={() => setLang(l.code as keyof typeof STRINGS)}
            >
              {l.label}
            </button>
          ))}
        </div>

        {/* dir scoped to the card so the page chrome stays put */}
        <div className="i18n-store" dir={dir as "ltr" | "rtl"} lang={lang}>
          <div className="i18n-store-head">
            <span className="i18n-store-name">🌐 {t.storeName}</span>
            <span className="i18n-cart">{t.cart} 0</span>
          </div>

          <div className="i18n-ship-banner">{fill(t.freeShipping, { amt: money(FREE_SHIP) })}</div>

          <div className="i18n-product">
            <div className="i18n-product-name">{t.product}</div>
            <div className="i18n-price">{money(PRICE)}</div>
          </div>

          <div className="i18n-rating">
            <span className="i18n-stars">{stars}</span>
            <span className="i18n-reviews">{fill(t.reviews, { n: num(REVIEW_COUNT) })}</span>
          </div>

          <div className="i18n-actions">
            <button className="i18n-buy">{t.addToCart}</button>
            <button className="i18n-savebtn">♡ {t.save}</button>
          </div>

          <div className="i18n-meta">
            {fill(t.shipsBy, { date: shipBy })} · {t.returns}
          </div>
        </div>

        <div className="i18n-country">
          <label className="i18n-country-label">{t.country}</label>
          <select
            className="i18n-country-select"
            value={countryCode}
            onChange={(e) => setCountryCode(e.target.value)}
          >
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>{c.flag} {c.label}</option>
            ))}
          </select>
        </div>

        <p className="i18n-tip">{t.tip}</p>
      </main>
    </div>
  );
};

export default I18nDemo;
