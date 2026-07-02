// Languages: code, label (in its own script), and text direction.
export const LANGS = [
  { code: "en", label: "English", dir: "ltr" },
  { code: "ja", label: "日本語", dir: "ltr" },
  { code: "ar", label: "العربية", dir: "rtl" },
];

// UI strings per language. {n} placeholders are filled at render time.
export const STRINGS = {
  en: {
    storeName: "Wezxorv",
    cart: "Cart",
    freeShipping: "Free shipping over {amt}",
    product: "Wireless Headphones",
    reviews: "{n} reviews",
    addToCart: "Add to cart",
    save: "Save",
    shipsBy: "Ships by {date}",
    returns: "30-day returns",
    country: "Country",
    tip: "Switch language — the card mirrors for Arabic. Country sets currency and date format.",
  },
  ja: {
    storeName: "ウェズゾーヴ",
    cart: "カート",
    freeShipping: "{amt}以上で送料無料",
    product: "ワイヤレスヘッドホン",
    reviews: "レビュー{n}件",
    addToCart: "カートに追加",
    save: "保存",
    shipsBy: "{date}までに発送",
    returns: "30日間返品可能",
    country: "国",
    tip: "言語を切り替えてください。アラビア語ではレイアウトが反転します。国で通貨と日付の形式が変わります。",
  },
  ar: {
    storeName: "ويزكسورف",
    cart: "السلة",
    freeShipping: "شحن مجاني فوق {amt}",
    product: "سماعات لاسلكية",
    reviews: "{n} تقييم",
    addToCart: "أضف إلى السلة",
    save: "حفظ",
    shipsBy: "يُشحن بحلول {date}",
    returns: "إرجاع خلال ٣٠ يومًا",
    country: "الدولة",
    tip: "بدّل اللغة — تنعكس البطاقة للعربية. تحدد الدولة العملة وتنسيق التاريخ.",
  },
};

// Country drives Intl currency + date formatting, independent of language.
export const COUNTRIES = [
  { code: "US", flag: "🇺🇸", label: "United States", currency: "USD", locale: "en-US" },
  { code: "JP", flag: "🇯🇵", label: "Japan", currency: "JPY", locale: "ja-JP" },
  { code: "SA", flag: "🇸🇦", label: "Saudi Arabia", currency: "SAR", locale: "ar-SA" },
  { code: "GB", flag: "🇬🇧", label: "United Kingdom", currency: "GBP", locale: "en-GB" },
];

export const PRICE = 129;        // base price, formatted per country currency
export const FREE_SHIP = 50;     // free-shipping threshold
export const REVIEW_COUNT = 1204;
export const RATING = 4;         // filled stars out of 5
