# NEXUS — Electronics Store

A complete ecommerce storefront for laptops, iPhones, and Samsung devices.
**Pure HTML/CSS/JS on the frontend, Supabase as the only backend, PayPal for payment.** No build step, no server to run — upload the files anywhere that serves static HTML and it works.

---

## Quick-start checklist

Do these in order. Each one is explained in detail further down.

- [ ] **Keep the folder structure intact.** Don't flatten the files — `css/`, `js/`, `images/`, and `supabase/` must stay as subfolders sitting next to your `.html` files, exactly as this project is zipped. If you download files one at a time, recreate those four subfolders yourself before testing.
- [ ] **Create a Supabase project** and run `supabase/schema.sql` in its SQL Editor (§2).
- [ ] **Paste your Supabase URL + anon key** into `js/supabase-client.js` (§2).
- [ ] **Create a PayPal Sandbox app** and paste the Client ID into `checkout.html` (§3).
- [ ] **Run a local server** from inside the project folder to test (§5) — not `file://`, not `npm start`.
- [ ] **Swap placeholder photos** in `images/` for real product photos as you get them (§4).
- [ ] **Deploy** to Netlify or GitHub Pages once it all works locally (§6).

---

## 1. What's in this folder

```
techstore/
├── index.html          Homepage
├── products.html        Full catalogue with category filter + search
├── product.html          Single product page (?id=... in the URL)
├── cart.html               Shopping cart
├── checkout.html            Shipping form + PayPal payment
├── css/
│   └── style.css              All styling — one file, no framework
├── js/
│   ├── supabase-client.js       ⚠️ put your Supabase URL + key here
│   ├── products.js               Fetches & renders products
│   ├── cart.js                    Cart logic (browser localStorage)
│   └── checkout.js                 PayPal integration + order saving
├── images/
│   └── *.svg                   Placeholder product photos — replace as you go
├── supabase/
│   └── schema.sql              Run once in Supabase to set everything up
├── .gitignore               OS/editor junk to keep out of version control
└── README.md               You are here
```

Nothing here needs `npm install` or a build tool. Every page is a plain `.html` file that loads the CSS and JS directly — **which is exactly why the folder structure above has to stay intact.** `index.html` looks for `css/style.css` and `js/cart.js` using those relative paths; if the files end up loose in one folder instead of in `css/` and `js/` subfolders, nothing will load.


---

## 2. Set up Supabase (your backend — 10 minutes)

1. Go to **[supabase.com](https://supabase.com)** → sign up (free tier is plenty) → **New project**.
2. Pick a name, a database password (save it somewhere), and a region close to your customers.
3. Once the project finishes provisioning, open **SQL Editor** in the left sidebar → **New query**.
4. Open `supabase/schema.sql` from this folder, copy the whole file, paste it into the SQL Editor, and click **Run**.
   - This creates two tables — `products` and `orders` — turns on Row Level Security (so shoppers can only read products and create orders, never read anyone else's order), and seeds the store with 12 starter products (4 laptops, 4 iPhones, 4 Samsung devices).
5. Go to **Project Settings → API**. You'll need two values:
   - **Project URL** (looks like `https://xxxxx.supabase.co`)
   - **anon public** key (a long string starting with `eyJ...`)
6. Open `js/supabase-client.js` in this project and paste them in:

```js
const SUPABASE_URL = "https://xxxxx.supabase.co";
const SUPABASE_ANON_KEY = "eyJ...your-anon-key...";
```

That's it — the frontend is now wired to your database. The `anon` key is meant to be public; it's safe to ship in frontend JS because your Row Level Security policies (already set up by the schema) control exactly what it's allowed to do.

---

## 3. Add your PayPal account (so you actually get paid)

The checkout page uses **PayPal's Buttons SDK**, loaded directly in `checkout.html` — no server-side code required.

### Step A — Get a Client ID
1. Go to **[developer.paypal.com](https://developer.paypal.com)** and log in with your normal PayPal account (or create one).
2. Go to **Apps & Credentials**.
3. You'll see a toggle for **Sandbox** and **Live** — start in **Sandbox** to test safely with fake money.
4. Under Sandbox, click **Create App**, name it (e.g. "NEXUS Store"), and copy the **Client ID** it gives you.

### Step B — Paste it into the site
Open `checkout.html` and find this line near the bottom:

```html
<script src="https://www.paypal.com/sdk/js?client-id=YOUR_PAYPAL_CLIENT_ID&currency=USD"></script>
```

Replace `YOUR_PAYPAL_CLIENT_ID` with the Client ID you copied. Change `currency=USD` if you want a different currency (e.g. `KES`, `EUR` — must be a currency your PayPal account supports).

### Step C — Test a payment
1. In the PayPal developer dashboard, go to **Sandbox → Accounts**. PayPal auto-generates a fake "personal" buyer account with fake money — copy its email/password.
2. Open your site, add a product to the cart, go to checkout, fill in the shipping form, click the PayPal button, and log in with the sandbox buyer account.
3. Confirm the payment. You should see a green success message on the checkout page, and a new row should appear in **Supabase → Table Editor → orders**.

### Step D — Go live
1. Back in **Apps & Credentials**, flip the toggle to **Live**, create a Live app the same way, and copy the **Live Client ID**.
2. Replace the sandbox Client ID in `checkout.html` with the live one.
3. Real payments now land straight in your PayPal account balance — no third party in between.

**Note on reliability:** this setup captures payment and saves the order client-side, which is simple and works well for most small stores. If you ever want a guarantee that an order is recorded even if the customer closes the tab mid-payment, the more robust (but more advanced) approach is a PayPal **webhook** delivered to a Supabase Edge Function. Not required to launch — just something to know exists if your store grows.

---

## 4. Add and update products

You never touch code to manage inventory — do it all from **Supabase → Table Editor → products**.

| Column | What it is | Example |
|---|---|---|
| `name` | Product title | `iPhone 16 Pro` |
| `category` | Must be exactly `laptops`, `iphones`, or `samsung` | `iphones` |
| `brand` | Optional, shown for your own reference | `Apple` |
| `price` | Current selling price | `999.00` |
| `compare_at_price` | Optional — set this higher than `price` to show a "SALE" badge and strikethrough | `1099.00` |
| `description` | A few sentences, shown on the product page | — |
| `specs` | A JSON object of spec-sheet rows shown on cards and the product page | `{"Chip":"A18 Pro","Storage":"256GB"}` |
| `image_url` | A direct link to a product image | any image URL, or a Supabase Storage link (see below) |
| `stock` | Units available. `0` shows "Out of stock" | `12` |
| `featured` | `true` shows it on the homepage | `true` / `false` |
| `rating` / `reviews_count` | Shown as stars | `4.8` / `214` |

**To add a product:** click **Insert row**, fill in the columns above, click **Save**. It appears on the site immediately — no redeploy needed.

**To edit or remove one:** click the row, change values or click the trash icon.

**Only you can do this** — the public site can only *read* products, never add or edit them, because of the Row Level Security policy in `schema.sql`. Manage products while logged into your own Supabase account.

### Product photos — the `images/` folder

Every seeded product currently points at a placeholder graphic in the local `images/` folder (e.g. `images/iphone-16-pro.svg`) — an outlined sketch labeled with the product name, so you can see at a glance which ones still need a real photo.

You have two ways to add your own photos, pick whichever's easier:

**Option A — swap the file, keep the same name (fastest).**
Take a real product photo, name it exactly the same as the placeholder it's replacing (e.g. `iphone-16-pro.jpg`), and drop it into `images/`, replacing the old file. If you change the extension (`.svg` → `.jpg`), update that one product's `image_url` in Supabase to match the new filename — otherwise no database edit needed at all.

**Option B — use Supabase Storage instead of local files.**
1. In Supabase, go to **Storage → Create bucket**, name it `product-images`, and make it **public**.
2. Upload your photos there.
3. Click a file → **Copy URL** → paste that URL into the product's `image_url` field.

Either way works — `image_url` just needs to resolve to *some* image, local or hosted. As you add new products beyond the starter 12, drop a placeholder or real photo into `images/` (or Storage) and point `image_url` at it.

---

## 5. Test it locally

Because there's no build step, you don't run `npm start` — you just need any tool that serves the folder over `http://localhost` instead of opening files directly. This matters because `fetch()` calls to Supabase are blocked on some browsers when opened via `file://`.

**From inside the `techstore` folder** (the one containing `index.html` directly — confirm with `ls` / `dir` before running anything):

```bash
python3 -m http.server 8000
```
Then open `http://localhost:8000`.

Or, if you have Node installed:
```bash
npx serve .
```
(the `.` means "serve the current folder" — run it from inside `techstore`, not from its parent directory, or you'll get 404s on `/`).

Once it's running, add something to the cart, go through checkout with a PayPal **Sandbox** buyer account, and confirm a row appears in **Supabase → Table Editor → orders**.

---

## 6. Upload / deploy the site

Since this is plain HTML/CSS/JS, any static host works. Two easy free options:

**Netlify (drag and drop — easiest):**
1. Go to [app.netlify.com/drop](https://app.netlify.com/drop).
2. Drag the whole `techstore` folder onto the page.
3. It's live in seconds, with a free `*.netlify.app` URL. You can add a custom domain in site settings.

**GitHub Pages:**
1. Push this folder to a GitHub repository.
2. Go to **Settings → Pages**, set the source branch to `main` and the folder to `/ (root)`.
3. Your site publishes at `https://yourusername.github.io/reponame`.

To update the site later, just re-upload the changed files (Netlify) or `git push` (GitHub Pages). Product and order data live in Supabase, so you never need to redeploy just to change inventory.

---

## 7. How the pieces fit together

- **Cart** lives entirely in the browser's `localStorage` (`js/cart.js`) — no backend needed until checkout, so browsing is instant.
- **Products** are fetched live from Supabase on every page load (`js/products.js`), so price/stock changes show up immediately for every visitor.
- **Checkout** (`js/checkout.js`) validates the shipping form, opens PayPal, and on a successful payment writes one row to the `orders` table with the customer's details and a snapshot of what they bought. It also decrements `stock` automatically via a database trigger already set up in `schema.sql`.
- **Viewing orders:** go to **Supabase → Table Editor → orders** to see every sale as it comes in — customer name, email, address, items, total, and the PayPal transaction ID for reconciliation.

---

## 8. Troubleshooting

- **Page loads with no styling, or console shows 404s for `css/style.css` / `js/*.js`** → the folder got flattened at some point (common when downloading files one by one). Recreate the `css/`, `js/`, `images/`, and `supabase/` subfolders and move each file back into the right one — see the tree in §1.
- **Server shows `404` on `GET /`** → you started the server from the wrong directory. `cd` into the folder that directly contains `index.html`, then start the server from there.
- **"No products yet" on the homepage** → `schema.sql` wasn't run, or `js/supabase-client.js` still has placeholder values. Double check both.
- **PayPal button doesn't appear** → `YOUR_PAYPAL_CLIENT_ID` wasn't replaced in `checkout.html`, or the cart is empty.
- **Payment succeeds but no order appears in Supabase** → check the browser console for an error; it's almost always the anon key/URL in `js/supabase-client.js` being wrong, or the SQL in `schema.sql` not having been run fully.
- **Images not loading** → make sure `image_url` is a direct link to an image file (ends in `.svg`/`.jpg`/`.png`/etc.) and, if it's a Supabase Storage file, that the bucket is set to **public**.

---

## 9. Customizing the design

Everything visual lives in `css/style.css`, controlled by CSS variables at the top of the file:

```css
--bg: #101214;        /* page background */
--accent: #c99a4b;     /* copper accent — buttons, prices, links */
--font-display: 'Space Grotesk', sans-serif;
--font-mono: 'IBM Plex Mono', monospace;   /* used for the spec-sheet strips */
```

Change these to re-theme the whole site without touching any HTML.
