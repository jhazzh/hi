// Full-page website designs (separate from the app demos in Cards.config).
// `figma`: paste the public Figma file URL once the design file exists.
// `live` / `livePassword`: a running build (Shopify store, hosted WordPress…).
// `platform`: the CMS the design was built on.
// `shot`: screenshot of the real build — used as the row's destination until
//         `live` is set (e.g. once WordPress is hosted publicly).
// Row link priority (see Home.tsx): live → shot → in-portfolio demo page.
export const websites = [
    {
        text: "Fern & Frame",
        label: "websites/fern-frame",
        desc: "E-commerce landing page for a fictional furniture brand — designed and built from scratch.",
        tags: ["E-commerce"],
        figma: "https://www.figma.com/design/cMmlOtXqVV925HJcdinUtP/Untitled?node-id=0-1&t=hlFbjVMIuG3faNYZ-1",
        live: "https://test-store-22982.myshopify.com/",
        // Dev store password can't be disabled; visitors need it to enter.
        livePassword: "test-store-22982",
        platform: "Shopify",
        shot: "",
    },
    {
        text: "Northbeam",
        label: "websites/northbeam",
        desc: "Digital agency landing page — bold type, services, process, and metrics.",
        tags: ["Landing page"],
        figma: "https://www.figma.com/design/cMmlOtXqVV925HJcdinUtP/Untitled?node-id=0-1&t=hlFbjVMIuG3faNYZ-1",
        // Hosted on InfinityFree. See northbeam-wp/ for the WordPress theme.
        live: "https://astrox.rf.gd/wp/",
        livePassword: "",
        platform: "WordPress",
        shot: "/hi/websites/northbeam-wp-desktop.png",
    },
    {
        text: "Volt Store",
        label: "websites/volt-store",
        desc: "Full e-commerce storefront — browse, filter, cart, auth, and checkout with persisted orders.",
        tags: ["E-commerce", "Full-stack"],
        figma: "",
        live: "https://volt-store-theta.vercel.app",
        livePassword: "",
        platform: "Next.js",
        shot: "",
    },
];

const find = (label: string) => websites.find((w) => w.label === label);

/** @param label route label, e.g. "websites/northbeam" @return Figma URL or null */
export const figmaUrl = (label: string): string | null => find(label)?.figma || null;

/** @param label route label @return live site URL or null */
export const liveUrl = (label: string): string | null => find(label)?.live || null;

/** @param label route label @return live site password or null */
export const livePassword = (label: string): string | null => find(label)?.livePassword || null;

/** @param label route label @return platform name (e.g. "WordPress") or null */
export const platform = (label: string): string | null => find(label)?.platform || null;

/** @param label route label @return screenshot path or null */
export const shotUrl = (label: string): string | null => find(label)?.shot || null;
