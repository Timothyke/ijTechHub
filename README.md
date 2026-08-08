# Tech Hub - Electronics Store

A complete ecommerce storefront for laptops, iPhones, and Samsung devices.
**Pure HTML/CSS/JS on the frontend, Supabase as the only backend, PayPal for payment, deployed on Cloudflare Workers.** No build step to write - upload the files anywhere that serves static HTML and it works.

Live at: **techhubdigital.online**

---

## Quick-start checklist

- [ ] **Keep the folder structure intact** - `css/`, `js/`, `images/`, and `supabase/` stay as subfolders next to your `.html` files.
- [ ] **Create a Supabase project** and run `supabase/schema.sql` in its SQL Editor (§2).
- [ ] **Paste your Supabase URL + anon key** into `js/supabase-client.js` (§2).
- [ ] **Create a PayPal app** and paste the Client ID into `checkout.html` (§3).
- [ ] **Enter product prices directly in KES** - the `price` column is KES-native, not USD (§4, read this before adding your first product).
- [ ] **Run a local server** to test before pushing changes live (§5).
- [ ] **Push to GitHub** - Cloudflare auto-deploys on every push to `main` (§6).

---

## 1. What's in this folder

```
Tech-Hub/
├── index.html          Homepage - phone deals, featured products, categories, hero
├── products.html        Full catalogue with category filter + search
├── product.html          Single product page (?id=... in the URL)
├── cart.html               Shopping cart
├── checkout.html            Shipping form + PayPal payment
├── css/
│   └── style.css              All styling - one file, no framework
├── js/
│   ├── supabase-client.js       ⚠️ your Supabase URL + key live here
│   ├── products.js               Fetches & renders products
│   ├── cart.js                    Cart logic + currency formatting (KES)
│   └── checkout.js                 PayPal integration + order saving
├── images/
│   └── logo.png, hero.png, etc.   Your real photos + starter placeholders
├── supabase/
│   └── schema.sql              Run once in Supabase to set everything up
├── sitemap.xml              For search engines - keep this, don't delete
├── robots.txt                 Same - controls what search engines can crawl
├── wrangler.jsonc            Cloudflare Workers deploy config - must stay UTF-8, no BOM
├── .gitignore
└── README.md
```

**Two files that are easy to break by accident, worth knowing about:**
- `wrangler.jsonc` must be saved as plain UTF-8 without a byte-order mark. PowerShell's `>` redirect and some editors silently save UTF-16 instead, which makes Cloudflare's build fail with a "Configuration file contains UTF-16 LE byte order marker" error. If that happens, re-save it explicitly: `[System.IO.File]::WriteAllText($path, $content, [System.Text.UTF8Encoding]::new($false))`.
- Any `.html` file edited in Notepad can silently corrupt special characters (em-dashes, bullets, curly quotes) if Notepad's save encoding doesn't match. Every page in this project uses HTML entities (`&mdash;`, `&middot;`, `&copy;`, `&hellip;`) instead of raw special characters specifically so this can't happen again - keep using entities for anything beyond plain ASCII when editing.

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

The anon key is meant to be public - Row Level Security, not secrecy, is what protects your data.

---

## 3. Add your PayPal account

1. [developer.paypal.com](https://developer.paypal.com) → **Apps & Credentials** → toggle **Sandbox** → **Create App** → copy the Client ID.
2. In `checkout.html`, the SDK script tag currency stays `USD` **on purpose** - see §4 below for why. Replace only the client-id value.
3. Test with a **Sandbox → Accounts** fake buyer login before going live.
4. When ready for real money: create a **Live** app, swap the Client ID, done.

---

## 4. Currency - read this before adding products

**The `price` column stores real KES directly.** There is no USD column, no conversion happening when you type a price in. If a laptop costs KES 58,000, enter `58000` - not `450` thinking it'll auto-convert, and not `58000.00 USD`.

**Why this matters:** PayPal does not support settling transactions in KES (it's not on their supported currency list). So the site shows KES everywhere for browsing - which is what your customers expect and think in - but at the exact moment someone clicks the PayPal button, `js/checkout.js` converts the KES total to USD using the `KES_RATE` constant (currently `129`, defined at the top of `js/cart.js`) and that's the number actually charged. The customer sees a clear note on the checkout page telling them the USD amount before they pay, so nothing is a surprise.

**Update `KES_RATE` periodically** - it's a fixed number, not a live feed, so it'll drift from the real exchange rate over time. Check a source like xe.com and update the constant every so often; a small drift doesn't matter much on a single purchase, but don't let it sit unedited for months.

**Free shipping threshold:** currently KES 65,000, flat KES 2,000 shipping below that - both are hardcoded in `js/checkout.js` and `cart.html` (search for `65000` in both files if you want to change the threshold).

---

## 5. Add and update products

Manage everything from **Supabase → Table Editor → products** - no code, no redeploy needed, changes are live the moment you save.

| Column | What it is |
|---|---|
| `name` | Product title |
| `category` | Exactly `laptops`, `iphones`, or `samsung` (see note below if you've added Monitors/Desktops to the nav) |
| `price` / `compare_at_price` | **Real KES values** - see §4. Set `compare_at_price` higher than `price` to show a SALE badge |
| `specs` | JSON object, e.g. `{"Chip":"A18 Pro","Storage":"256GB"}` |
| `image_url` | A direct image link - local `images/` file or Supabase Storage URL. **Products without a real photo (still pointing at a `.svg` placeholder) are automatically hidden from every page** - see §7 |
| `stock` | `0` shows "Out of stock"; `1-5` shows "ONLY X LEFT" on the product card |
| `featured` | `true` shows it on the homepage's "Featured devices" row |

**Note on categories:** the nav currently links to Monitors and Desktops, but the database's `category` column only accepts `laptops`, `iphones`, `samsung` (a `CHECK` constraint in `schema.sql`). If you want those categories to actually work, you'll need to run `alter table products drop constraint products_category_check;` followed by a new constraint that includes them, or products in those categories will fail to insert.

**Uploading photos - two options:**
- **Local:** drop a file into `images/`, point `image_url` at `images/yourfile.png`, then `git push`.
- **Supabase Storage (faster, no redeploy):** Storage → create a **public** bucket → upload → copy the **public** URL (not the signed/temporary one - public URLs have no `token=` in them) → paste into `image_url`.

---

## 6. Test it locally

```bash
cd Tech-Hub
python3 -m http.server 8000
```
or
```bash
npx serve .
```
Open `http://localhost:8000`. Confirm products load in KES, cart works, and a Sandbox PayPal payment completes (charged in USD, per §4) and appears in **Supabase → orders**.

---

## 7. How the pieces fit together

- **Cart** - browser `localStorage`, instant, no backend call needed until checkout. All amounts are KES.
- **Products** - fetched live from Supabase on every page load (`js/products.js`), so price/stock edits show up immediately. `fetchProducts()` automatically excludes anything still pointing at a starter `.svg` placeholder image, in every category - this keeps unphotographed inventory off the live site without you having to hide it manually.
- **Homepage sections** - "Phone deals" (iPhones + Samsung, prioritizing anything with `compare_at_price` set) sits right below the hero, above the general "Featured devices" grid, since products are the highest priority on the page.
- **Checkout** - validates the form, opens PayPal, converts the KES total to USD once (§4), and on successful payment writes one row to `orders` with a snapshot of the cart. A database trigger decrements `stock` automatically.
- **Trust stats** - the homepage's "orders delivered" number pulls a real live count from `orders` where `status = 'paid'`. Below 10 real orders it hides itself rather than show an unimpressively small (or fake) number - it'll appear on its own once you cross that threshold.
- **Orders** - view every sale in **Supabase → Table Editor → orders**: customer details, items, total (KES), PayPal transaction ID.

---

## 8. Troubleshooting

- **No styling / 404s on `css/style.css` or `js/*.js`** → folder structure got flattened. Recreate the subfolders per §1.
- **Prices showing absurdly large numbers (e.g. millions of KES)** → a price was entered as if it'd be auto-converted, or old USD-style data wasn't migrated. `price` must be the real KES number, entered directly - see §4.
- **"No products yet"** → `schema.sql` wasn't run, `js/supabase-client.js` still has placeholder values, or every product in that view is still on a placeholder image (see §7).
- **PayPal button missing** → Client ID placeholder not replaced, or cart is empty.
- **Cloudflare build fails with "UTF-16" error** → `wrangler.jsonc` got re-saved with the wrong encoding - see §1.
- **Garbled characters (`Ã¢â‚¬`, `Â·`, etc.) in text** → an HTML file was saved with the wrong encoding, usually via Notepad. Use HTML entities and re-save via VS Code.
- **Product images not loading from Supabase Storage** → confirm you copied the *public* URL (`/object/public/...`), not a signed URL (`/object/sign/...?token=...`), and that the bucket is toggled public.
- **A product you just added doesn't show up anywhere** → check `image_url` isn't still a `.svg` placeholder (§7 filters those out automatically) and that `category` is exactly `laptops`, `iphones`, or `samsung`.

---

## 9. Deploy - Cloudflare Workers (current setup)

This repo auto-deploys via Cloudflare's Git integration: every `git push` to `main` triggers a build that runs `npx wrangler deploy`.

```bash
git add .
git commit -m "your change"
git push
```
Check **Cloudflare → Workers & Pages → techhubdigital → Deployments** to confirm the build succeeded. Your domain is connected under that Worker's **Domains** tab, with DNS managed in Cloudflare's DNS records for the zone.

**Alternative static hosts**, if you ever want to compare or migrate: Netlify (drag-and-drop the folder at app.netlify.com/drop) and GitHub Pages both work identically well for a plain HTML/CSS/JS site like this.

---

## 10. SEO

`index.html` has proper meta tags: a search-intent title/description, Open Graph tags for social share previews, a JSON-LD `Store` structured-data block, and a canonical URL. **`products.html` and `product.html` don't have this yet** - worth adding, since individual product pages are often what actually rank for specific searches like "buy iPhone 16 Pro Nairobi."

`sitemap.xml` and `robots.txt` are already in this repo - don't delete them. Submit the domain in **Google Search Console** and use the URL Inspection tool to request indexing after any major content change.

---

## 11. Further improvements worth making

1. **Order confirmation emails** - customers currently only see an on-screen success message, no email receipt. A Supabase Edge Function triggered on new `orders` rows is the highest-value addition here.
2. **PayPal webhook for order reliability** - right now an order only saves if the customer's browser stays open through the whole capture step. A webhook guarantees the order is recorded even if their connection drops mid-payment.
3. **Product reviews** - a real reviews table (linked to orders, so only actual buyers can review) builds trust fast.
4. **Live exchange rate** instead of the fixed `KES_RATE` constant, so the USD charge at checkout never drifts from the real rate.
5. **An admin view for order status** - a small password-protected page to flip orders between pending/shipped/delivered, instead of hand-editing rows in Supabase.
6. **Category constraint update** if Monitors/Desktops are meant to be real, working categories (see §5 note).
7. **Photos for the refurb laptop inventory** - every listing currently points at the generic placeholder and is therefore hidden from the live site (§7). Prioritize photographing your best sellers first.

---

## 12. Marketing this site

- **WhatsApp Business** - link directly to product pages from a catalog or broadcast list; strong fit given your inventory already moves through WhatsApp.
- **Facebook Marketplace, Jiji.co.ke, PigiaMe** - cross-list with a link back to the site for the full spec sheet and real checkout.
- **Google Business Profile** - free, shows in local search and Maps.
- Fix placeholder photos before spending on ads - paid traffic to listings with generic placeholder art wastes the spend.
