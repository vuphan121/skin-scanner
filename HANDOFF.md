# Skin Scanner — Agent Handoff

## What This Is

A bilingual (Vietnamese / English) AI-powered skin analysis web app built for **Eucerin Vietnam**. Users take three selfies (front, left, right), answer a short skin profile form, and receive an AI-generated skin analysis report followed by personalized Eucerin product recommendations.

**Stack:** React 19 + Vite 8 + Tailwind CSS v4 + Framer Motion + React Router v7 + OpenAI API (GPT-4o vision)

---

## User Flow (6 screens, single-page state machine)

| Step | Component | Description |
|------|-----------|-------------|
| 0 | `ConsentStep` | Two checkboxes — medical disclaimer + consent |
| 1 | `CameraStep` | Upload or capture 3 photos: front, left, right. Per-photo validation via `gpt-4o-mini`. |
| 2 | `ScanningStep` | Animated scan overlay cycles through the 3 photos while GPT-4o analyzes |
| 3 | `FormStep` | 6-question skin profile (age, type, concerns, routine, sleep, hydration) |
| 4 | `ResultsStep` | Skin report: 4 stat cards, AI headline + description, animated score bars (5 metrics), priority concerns, CTA to products |
| 5 | `ProductsStep` | Product cards (Shopee + eucerin.vn links), morning/night routine steps, rescan/home buttons |

State lives in `ScanPage` root. `go(n)` advances/jumps steps and scrolls to top.

---

## Key Files

```
src/
  pages/
    ScanPage.jsx        ← All 6 steps + all content in one file (~1950 lines)
    Home.jsx            ← Landing page (bilingual, mobile/desktop responsive)
  services/
    skinAnalysis.js     ← validatePhoto (gpt-4o-mini) + analyzeWithAI (gpt-4o)
  index.css             ← Tailwind v4 @theme tokens, scan-line/spinner animations
  main.jsx              ← BrowserRouter entry
  App.jsx               ← Routes: / → Home, /scan → ScanPage
public/
  images/
    eucerin-logo.png    ← Logo in PageHeader
    hero-skin-scan.png  ← Landing page hero image
vercel.json             ← SPA rewrite rule (all routes → index.html)
.env.example            ← Copy to .env and fill in VITE_OPENAI_API_KEY
```

---

## Environment Variable

```
VITE_OPENAI_API_KEY=sk-proj-...
```

Set in `.env` locally. On Vercel: add as an **Environment Variable** in the project settings (Settings → Environment Variables).

---

## Product Catalogue (hardcoded in ScanPage.jsx)

`EUCERIN_PRODUCTS` array — 4 products with real image URLs, eucerin.vn links, Shopee links:

1. **Hyaluron-Filler Epicelline Serum** — always shown first (brand hero, per brand strategy)
2. **Anti-Pigment Dual Serum** — if evenness score < 65 or dark spot concerns detected
3. **Sun Fluid Anti-Age SPF50+** — if radiance score < 65 or dark/aging concerns
4. **Hyaluron-Filler Day Cream SPF30** — if hydration score < 60

Logic: `getRecommendedProducts(scores, detectedConcerns)` inside ScanPage.jsx.

---

## AI Analysis

**`validatePhoto`** (gpt-4o-mini): Called once per photo. Lenient prompt — only rejects photos with clearly no face. Returns `{ valid, reason }`.

**`analyzeWithAI`** (gpt-4o): Called on form submit with all 3 photos + form data. Returns:
```js
{
  faceDetected: boolean,
  skinType: 'oily' | 'dry' | 'combination' | 'sensitive' | 'normal',
  detectedConcerns: string[],
  headline: string,          // 6–10 word skin summary
  description: string,       // 2–3 sentences
  issues: string[],          // bullet points
  advice: string,            // one actionable tip
  scores: {
    hydration: 0–100,
    firmness:  0–100,
    radiance:  0–100,
    evenness:  0–100,
    clarity:   0–100,
  }
}
```

---

## Bilingual Architecture

Language state (`lang`: `'vi'` | `'en'`) lives in `ScanPage` root, passed to every step. Each step reads from its own `*_CONTENT` constant object at the top of the file:

`CONSENT_CONTENT` → `CAMERA_CONTENT` → `SCAN_CONTENT` → `FORM_CONTENT` → `RESULTS_CONTENT` → `PRODUCTS_CONTENT`

`PageHeader` (sticky nav with logo + language toggle) is rendered once at root level.

---

## Design Tokens (Tailwind v4 `@theme`)

Primary brand color: `oklch(0.4 0.15 15)` — deep burgundy-red.
Defined as `--color-primary` in `index.css` and `PRIMARY_COLOR` const in ScanPage.jsx (for inline styles).

**Critical:** Tailwind v4 puts all utilities inside `@layer utilities`. Do NOT add an unlayered `* { padding:0; margin:0 }` reset — it silently overrides all Tailwind spacing utilities.

---

## Deployment (Vercel)

1. Connect the GitHub repo in Vercel dashboard
2. Framework preset: **Vite**
3. Build command: `npm run build` → output: `dist/`
4. Add env var: `VITE_OPENAI_API_KEY=sk-proj-...`
5. `vercel.json` already handles SPA routing (all paths → `index.html`)

---

## Known Considerations

- **No backend** — the OpenAI API key is in the client bundle. Fine for a kiosk/event demo; for public production, proxy calls through a serverless function.
- **No photo storage** — photos are base64 data URLs in React state only, never stored server-side (only sent to OpenAI for analysis).
- **Product images** load from eucerin.vn CDN. If those URLs break, `<img onError>` hides the broken image gracefully.
- The `src/components/` folder is empty — all UI is self-contained in `ScanPage.jsx` and `Home.jsx`.
