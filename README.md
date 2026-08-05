# Tech Hub — Electronics Store

A complete ecommerce storefront for laptops, iPhones, and Samsung devices.
**Pure HTML/CSS/JS on the frontend, Supabase as the only backend, PayPal for payment, deployed on Cloudflare Workers.** No build step to write — upload the files anywhere that serves static HTML and it works.

Live at: `techhubdigital.online`

---

## Quick-start checklist

- [ ] **Keep the folder structure intact** — `css/`, `js/`, `images/`, and `supabase/` stay as subfolders next to your `.html` files.
- [ ] **Create a Supabase project** and run `supabase/schema.sql` in its SQL Editor (§2).
- [ ] **Paste your Supabase URL + anon key** into `js/supabase-client.js` (§2).
- [ ] **Create a PayPal app** and paste the Client ID into `checkout.html` (§3).
- [ ] **Run a local server** to test before pushing changes live (§5).
- [ ] **Swap placeholder photos** in `images/` for real product photos (§4).
- [ ] **Push to GitHub** — Cloudflare auto-deploys on every push to `main` (§6).

---

## 1. What's in this folder

```
Tech-Hub/
├── index.html          Homepage — featured products, categories, hero
├── products.html        Full catalogue with category filter + search
├── product.html          Single product page (?id=... in the URL)
├── cart.html               Shopping cart
├── checkout.html            Shipping form + PayPal payment
├── css/
│   └── style.css              All styling — one file, no framework
├── js/
│   ├── supabase-client.js       ⚠️ your Supabase URL + key live here
│   ├── products.js               Fetches & renders products
│   ├── cart.js                    Cart logic (browser localStorage)
│   └── checkout.js                 PayPal integration + order saving
├── images/
│   └── logo.png, hero.png, etc.   Your real photos + starter placeholders
├── supabase/
│   └── schema.sql              Run once in Supabase to set everything up
├── sitemap.xml              For search engines — keep this, don't delete
├── robots.txt                 Same — controls what search engines can crawl
├── wrangler.jsonc            Cloudflare Workers deploy config — must stay UTF-8
├── .gitignore
└── README.md
```

**Two files that are easy to break by accident, worth knowing about:**
- `wrangler.jsonc` must be saved as plain UTF-8 (no BOM). If you ever hand-edit it in PowerShell or an editor that re-saves with a different encoding, Cloudflare's build will fail with a UTF-16 error.
- Any `.html` file edited in Notepad can silently corrupt special characters (em-dashes, bullets, curly quotes) if Notepad's save encoding doesn't match. Prefer VS Code, and stick to HTML entities (`&mdash;`, `&middot;`, `&copy;`) for anything beyond plain ASCII — they render correctly regardless of file encoding.

---

## 2. Set up Supabase (your backend)

1. [supabase.com](https://supabase.com) → **New project** → pick a name, password, region.
2. **SQL Editor → New query** → paste all of `supabase/schema.sql` → **Run**. This creates `products` and `orders` tables with Row Level Security already configured.
3. **Project Settings → API** → copy your **Project URL** and **anon/publishable key**.
4. Paste both into `js/supabase-client.js`:
```js
const SUPABASE_URL = "https://xxxxx.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_...";
```

The anon key is meant to be public — Row Level Security, not secrecy, is what protects your data.

---

## 3. Add your PayPal account

1. [developer.paypal.com](https://developer.paypal.com) → **Apps & Credentials** → toggle **Sandbox** → **Create App** → copy the Client ID.
2. In `checkout.html`, replace `YOUR_PAYPAL_CLIENT_ID` in the SDK script tag with it.
3. Test with a **Sandbox → Accounts** fake buyer login before going live.
4. When ready for real money: create a **Live** app the same way, swap the Client ID, done.

---

## 4. Add and update products

Manage everything from **Supabase → Table Editor → products** — no code, no redeploy needed, changes are live the moment you save.

| Column | What it is |
|---|---|
| `name` | Product title |
| `category` | Exactly `laptops`, `iphones`, or `samsung` |
| `price` / `compare_at_price` | Set `compare_at_price` higher to show a SALE badge |
| `specs` | JSON object, e.g. `{"Chip":"A18 Pro","Storage":"256GB"}` |
| `image_url` | A direct image link — local `images/` file or Supabase Storage URL |
| `stock` | `0` shows "Out of stock" |
| `featured` | `true` shows it on the homepage |

**Uploading photos — two options:**
- **Local:** drop a file into `images/`, point `image_url` at `images/yourfile.png`, then `git push`.
- **Supabase Storage (faster, no redeploy):** Storage → create a **public** bucket → upload → copy the public URL (not the signed/temporary one — public URLs have no `token=` in them) → paste into `image_url`.

---

## 5. Test it locally

```bash
cd Tech-Hub
python3 -m http.server 8000
```
or
```bash
npx serve .
```
Open `http://localhost:8000`. Confirm products load, cart works, and a Sandbox PayPal payment completes and appears in **Supabase → orders**.

---

## 6. Deploy — Cloudflare Workers (current setup)

This repo auto-deploys via Cloudflare's Git integration: every `git push` to `main` triggers a build that runs `npx wrangler deploy`.

```bash
git add .
git commit -m "your change"
git push
```
Check **Cloudflare → Workers & Pages → techhubdigital → Deployments** to confirm the build succeeded. Your domain (`techhubdigital.online`) is connected under the **Domains** tab there, with DNS managed in Cloudflare's DNS records for the zone.

**Alternative static hosts**, if you ever want to compare or migrate: Netlify (drag-and-drop the folder at app.netlify.com/drop) and GitHub Pages both work identically well for a plain HTML/CSS/JS site like this.

---

## 7. How the pieces fit together

- **Cart** — browser `localStorage`, instant, no backend call needed until checkout.
- **Products** — fetched live from Supabase on every page load, so price/stock edits show up immediately.
- **Checkout** — validates the form, opens PayPal, and on successful payment writes one row to `orders` with a snapshot of the cart. A database trigger decrements `stock` automatically.
- **Orders** — view every sale in **Supabase → Table Editor → orders**: customer details, items, total, PayPal transaction ID.

---

## 8. Troubleshooting

- **No styling / 404s on `css/style.css` or `js/*.js`** → folder structure got flattened. Recreate the subfolders per §1.
- **"No products yet"** → `schema.sql` wasn't run, or `js/supabase-client.js` still has placeholder values.
- **PayPal button missing** → Client ID placeholder not replaced, or cart is empty.
- **Cloudflare build fails with "UTF-16" error** → `wrangler.jsonc` got re-saved with the wrong encoding. Re-save it as UTF-8 without BOM.
- **Garbled characters (`Ã¢â‚¬`, `Â·`, etc.) in text** → an HTML file was saved with the wrong encoding, usually via Notepad. Rewrite the affected text using HTML entities and re-save via VS Code.
- **Product images not loading from Supabase Storage** → check you copied the *public* URL (`/object/public/...`), not a signed URL (`/object/sign/...?token=...`), and that the bucket is toggled public.

---

## 9. Further improvements worth making

Roughly in order of impact for a small store getting its first real customers:

1. **Order confirmation emails.** Right now customers get a success message on-screen but no email receipt. Adding a Supabase Edge Function that fires on new `orders` rows (via a database webhook) to send a confirmation email is the single highest-value upgrade here — customers trust a store more when they get a receipt.
2. **PayPal webhook for order reliability.** Currently an order only saves if the customer's browser stays open through the whole capture step. A webhook to a Supabase Edge Function guarantees the order is recorded even if their connection drops mid-payment.
3. **Product reviews.** You already have `rating` and `reviews_count` columns seeded with placeholder numbers — a real reviews table (linked to orders, so only actual buyers can review) builds trust fast.
4. **Search that actually ranks results.** The current search is a simple text match. If your catalogue grows past ~100 products, consider Supabase's built-in full-text search (`tsvector`) for better relevance.
5. **Image optimization.** Compress product photos before uploading (aim under 200KB each) — faster page loads directly improve conversion, especially on mobile data in Kenya.
6. **An admin view for order status.** Right now marking an order "shipped" or "delivered" means hand-editing the `status` column in Supabase. A tiny password-protected `admin.html` page that lists open orders and lets you flip status would save real time as order volume grows.
7. **Low-stock alerts.** A simple Supabase scheduled function that emails you when any product's `stock` drops below a threshold.
8. **Analytics.** Add a lightweight, privacy-respecting analytics script (e.g. Cloudflare Web Analytics, which is free and already available since you're on Cloudflare) so you can see what people browse vs. actually buy.
9. **Wishlist / "save for later".** Small localStorage-based addition, similar to how the cart already works — low effort, genuinely useful for phones/laptops people compare before buying.
10. **Currency display.** If most customers are in Kenya, consider showing KES alongside or instead of USD (Supabase can store a KES price column, or you can convert client-side at checkout with a cached exchange rate).

---

## 10. Marketing this website

A fast, working store doesn't generate customers by itself — visibility does. Concrete, low-cost steps that fit a Nairobi-based electronics store specifically:

**Search visibility**
- Make sure `sitemap.xml` and `robots.txt` (already in this repo, don't delete them) are submitted in **Google Search Console** — verify the domain there and request indexing for your homepage and a few key product pages.
- Keep page `<title>` and meta descriptions specific ("Buy iPhone 16 Pro in Nairobi — Tech Hub" beats a generic title) — this is what shows up in search results and directly affects click-through.
- Add a **Google Business Profile** for Tech Hub even without a physical storefront — it's free, shows up in local search and Maps, and lets customers leave reviews.

**Social + messaging (highest-leverage for a Kenyan audience)**
- **WhatsApp Business** — link directly to your product pages from a WhatsApp catalog or broadcast list; many local buyers prefer confirming a purchase over WhatsApp before paying.
- **Instagram + Facebook** — post real product photos (once you've swapped out the placeholders) with prices and a direct link; Facebook Marketplace specifically gets strong local buyer traffic for electronics in Kenya.
- **TikTok** — short unboxing/spec-comparison videos for phones and laptops perform well and cost nothing but time.

**Local marketplaces — list there too, don't rely on your site alone**
- **Jiji.co.ke** and **PigiaMe** are where a large share of Kenyan electronics buyers already search — cross-listing your inventory there with a link back to your site (for full spec sheets / cart / real checkout) can meaningfully add traffic.

**Trust signals that convert browsers into buyers**
- Real product photos beat placeholders every time — prioritize photographing your best-selling / highest-priced items first.
- Once you have a few completed orders, ask those customers for a short testimonial you can add to the site.
- Since you offer **14-day returns** and **PayPal buyer protection** (already stated on your homepage), make sure that's visible early in the checkout flow too, not just on the homepage — it directly reduces cart abandonment for first-time buyers who don't know your brand yet.

**Low-cost paid options, once organic channels are working**
- Facebook/Instagram ads targeting Nairobi + electronics interest are inexpensive to test at small budgets (as little as a few dollars a day) and easy to measure against actual orders in your Supabase `orders` table.
- Google Search ads for high-intent terms ("buy iPhone 16 Nairobi") tend to convert far better than broad awareness ads for a store like this.

The single most important thing before spending money on any of the above: make sure the on-site experience is fully clean first (no placeholder images on featured products, no broken checkout, real photos of your logo/hero) — paid traffic to a half-finished-looking store wastes the spend.
