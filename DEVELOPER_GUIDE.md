# Girl's Hood: Developer Guide

This guide explains how the Girl's Hood online shop is built: what each folder and file does, how the backend and database work, and what you need to know before you change anything.

If you are new, read sections 1–4 first. Use the rest as a reference.

---

## 1. What this project is

Girl's Hood is an online fashion shop for women's clothing in Ghana. It has two parts:

| Part | URL | Who uses it | What it does |
|---|---|---|---|
| **Storefront** | `/`, `/shop`, `/new-arrivals`, `/products/...`, `/cart`, `/favourites` | Shoppers | Browse, search, save favourites, build a cart, then **order on WhatsApp** |
| **Admin dashboard** | `/admin/...` | The shop owner | Log in with a password, then add, edit, publish, unpublish and delete products and their photos |

**There is no online payment.** When a shopper clicks "Order on WhatsApp", the site opens WhatsApp with the order already written out (items, sizes, colours, quantities, total). The shop owner confirms availability, delivery and payment in that chat.

Because of this, the project is small:

- The **only database table** is `products`.
- There are **no customer accounts**. The cart and favourites live in the shopper's browser (`localStorage`), not in the database.
- There is **one admin**, who logs in with a single password stored in an environment variable.

---

## 2. Tech stack

| Tool | Version | What it's used for |
|---|---|---|
| [Next.js](https://nextjs.org) | 16.4 | The web framework. It serves the pages and runs the server code. Uses the **App Router** (the `app/` folder). |
| [React](https://react.dev) | 19.3 | The UI library |
| TypeScript | 5 | JavaScript with types. Every file is `.ts` or `.tsx`. |
| [Tailwind CSS](https://tailwindcss.com) | 4.3 | Styling, using utility classes like `px-4 text-ink` written straight in the JSX |
| [Supabase](https://supabase.com) | `@supabase/supabase-js` 2 | Hosted **Postgres database** + **file storage** for product photos |
| pnpm | 11 | Package manager (use `pnpm`, not `npm` or `yarn`) |

> ⚠️ **Next.js 16 is newer than most tutorials.** Some APIs differ from what you'll find online (for example `proxy.ts` instead of `middleware.ts`, `"use cache"`, `updateTag`, `refresh`). When unsure, read the docs that ship with the installed version in `node_modules/next/dist/docs/`. `AGENTS.md` says the same thing for AI coding tools.

---

## 3. Running it on your computer

### 3.1 First-time setup

1. **Install Node.js** (v20 or newer) and **pnpm** (`npm install -g pnpm`).
2. Install dependencies, from inside `my-app/`:
   ```bash
   pnpm install
   ```
3. **Create a Supabase project** (free) at supabase.com.
4. **Create the database.** In the Supabase dashboard go to **SQL Editor → New query**, paste the whole of [`supabase/schema.sql`](supabase/schema.sql), and click **Run**. This creates the `products` table and the `product-images` storage bucket. It is safe to run again.
5. **Create your env file.** Copy `.env.example` to `.env.local` and fill it in (see 3.2).
6. Start the dev server:
   ```bash
   pnpm dev
   ```
7. Open http://localhost:3000 for the shop and http://localhost:3000/admin for the dashboard.

### 3.2 Environment variables (`.env.local`)

| Variable | Where to get it | Secret? | Used for |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API | No | Database address and image URLs |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Same page, the "anon" / "publishable" key | No | Browser uploads of photos (with a one-time token from the server) |
| `SUPABASE_SERVICE_ROLE_KEY` | Same page, the "service_role" / "secret" key | **YES** | All server-side database reads and writes. Has full access. |
| `ADMIN_PASSWORD` | You choose it | **YES** | The password for `/admin/login` |
| `SESSION_SECRET` | Generate: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` | **YES** | Signs the admin login cookie. Must be at least 32 characters. |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | The shop's number, e.g. `233537387548` (country code, no `+`, no spaces) | No | Where WhatsApp orders are sent |

**Rules:**

- Anything starting with `NEXT_PUBLIC_` is sent to the browser. Never put a secret in a `NEXT_PUBLIC_` variable.
- `.env.local` is in `.gitignore`. **Never commit it, and never paste the service-role key anywhere public.** Anyone holding it can delete the whole database.
- After changing `.env.local`, **restart `pnpm dev`**. Env vars are only read at startup.
- Changing `SESSION_SECRET` signs the admin out everywhere (handy if a laptop is lost).

### 3.3 Scripts

| Command | What it does |
|---|---|
| `pnpm dev` | Development server with hot reload |
| `pnpm build` | Production build. Run this before deploying; it catches type errors. |
| `pnpm start` | Runs the production build |
| `pnpm lint` | ESLint checks |

### 3.4 Testing on your phone

`next.config.ts` allows local-network addresses (`192.168.*.*`, etc.) in dev. Find your PC's IP address (`ipconfig` on Windows) and open `http://<that-ip>:3000` on a phone on the same Wi-Fi.

---

## 4. The big picture: how a request flows

```
                ┌─────────────────────────── Shopper's browser ───────────────────────────┐
                │  Pages (HTML from server)   Cart + Favourites (localStorage)   WhatsApp │
                └───────────────┬─────────────────────────┬────────────────────────▲──────┘
                                │ page requests            │ "refresh prices"       │ wa.me link
                                ▼                          ▼                         │ with order text
┌──────────────────────────────── Next.js server ─────────────────────────────────────────┐
│  proxy.ts            → guards /admin/* (redirects to login if no valid cookie)           │
│  Server Components   → render pages, call lib/products/queries.ts                        │
│  Server Actions      → login/logout, save/delete/publish products, getLiveProducts       │
│  Cache ("use cache") → product reads are cached for hours, cleared on every admin edit   │
└───────────────────────────────────────────┬──────────────────────────────────────────────┘
                                            │ service-role key (server only)
                                            ▼
┌──────────────────────────────────────── Supabase ───────────────────────────────────────┐
│  Postgres: table `products`              Storage: bucket `product-images` (public read)  │
└──────────────────────────────────────────────────────────────────────────────────────────┘
                                            ▲
                                            │ admin's browser uploads photos directly,
                                            │ using a one-time signed token from the server
```

Three ideas to keep in mind:

1. **Only the server talks to the database.** Pages and Server Actions use `supabaseAdmin()` with the secret service-role key. The browser never reads the `products` table directly.
2. **Product reads are cached.** The shop doesn't hit the database on every visit. When the admin saves, deletes or publishes, the cache is cleared (`updateTag("products")`) so shoppers see the change straight away.
3. **The cart is not on the server.** It's a list in `localStorage`. The server is only asked "what are the current prices and stock for these product IDs?" so stale carts get corrected.

---

## 5. Folder and file structure

```
my-app/
├── app/                        ← Every page and route (Next.js App Router)
│   ├── layout.tsx              ← Root HTML shell: fonts, <html>, <body>, site title
│   ├── globals.css             ← Tailwind import + brand colours + animations
│   ├── favicon.ico
│   ├── components/             ← Shared by storefront and admin
│   │   ├── Header.tsx          ← Top bar: logo, nav, search, cart/favourite counts
│   │   └── ErrorScreen.tsx     ← Friendly "something went wrong" screen
│   │
│   ├── (store)/                ← STOREFRONT. The (brackets) mean it's NOT in the URL
│   │   ├── layout.tsx          ← Header + footer around every shop page
│   │   ├── page.tsx            ← Home page  →  /
│   │   ├── error.tsx           ← Error screen for shop pages
│   │   ├── shop/page.tsx       ← All products  →  /shop
│   │   ├── new-arrivals/page.tsx  ← New products  →  /new-arrivals
│   │   ├── products/[slug]/page.tsx  ← One product  →  /products/blush-skirt-a1b2c3
│   │   ├── cart/
│   │   │   ├── page.tsx        ← /cart
│   │   │   ├── CartView.tsx    ← The cart UI (client component)
│   │   │   └── actions.ts      ← Server Action: getLiveProducts (fresh price/stock)
│   │   ├── favourites/
│   │   │   ├── page.tsx        ← /favourites
│   │   │   └── FavouritesView.tsx
│   │   └── _components/        ← (_underscore = private folder, never a route)
│   │       ├── Catalog.tsx     ← Product grid + search + category filter + sort
│   │       ├── ProductCard.tsx ← One product tile in a grid
│   │       ├── CardActions.tsx ← Quick "Add to cart" / WhatsApp buttons under a card
│   │       ├── BuyBox.tsx      ← Size/colour/quantity picker on the product page
│   │       ├── FavouriteButton.tsx  ← Heart toggle
│   │       ├── QuantityStepper.tsx  ← − 1 + control
│   │       ├── OurStory.tsx    ← "Our Story" section on the home page
│   │       └── icons.tsx       ← Small SVG icons
│   │
│   └── admin/                  ← ADMIN DASHBOARD  →  /admin/...
│       ├── layout.tsx          ← Admin wrapper; tells search engines not to index it
│       ├── auth-actions.ts     ← Server Actions: login, logout
│       ├── login/
│       │   ├── page.tsx        ← /admin/login
│       │   └── LoginForm.tsx
│       └── (dashboard)/        ← Pages that need you to be logged in
│           ├── layout.tsx      ← Sidebar + "View shop" + "Sign out"
│           ├── AdminNav.tsx    ← Sidebar links
│           ├── error.tsx
│           └── products/
│               ├── page.tsx    ← /admin/products: list + stats
│               ├── RowActions.tsx   ← Edit / Publish / Delete buttons on each row
│               ├── ProductForm.tsx  ← Add/edit form incl. photo upload (shared)
│               ├── actions.ts  ← Server Actions: save, delete, publish, upload tickets
│               ├── new/page.tsx       ← /admin/products/new
│               └── [id]/edit/page.tsx ← /admin/products/<uuid>/edit
│
├── lib/                        ← Logic that isn't a page. Imported with "@/lib/..."
│   ├── supabase/
│   │   ├── server.ts           ← supabaseAdmin(): server-only client (secret key)
│   │   └── browser.ts          ← supabaseBrowser(): public client, photo uploads only
│   ├── products/
│   │   ├── shared.ts           ← Product type, categories, sizes, currency, formatPrice
│   │   ├── queries.ts          ← ALL database reads (cached storefront + admin reads)
│   │   └── search.ts           ← In-memory product search
│   ├── auth/
│   │   ├── session.ts          ← Creates and verifies the signed admin cookie
│   │   └── dal.ts              ← isAdmin() / requireAdmin(): the real auth check
│   ├── cart/store.ts           ← Cart logic (add, remove, quantity, sync)
│   ├── favourites/store.ts     ← Favourites logic
│   ├── local-store.ts          ← Reusable localStorage list store (cart + favourites)
│   ├── images/prepare.ts       ← Shrinks big phone photos in the browser before upload
│   ├── whatsapp.ts             ← Builds the WhatsApp order message and link
│   └── contact.ts              ← Snapchat username, WhatsApp chat link for the footer
│
├── supabase/schema.sql         ← Database + storage setup. Run once in Supabase.
├── public/assets/pinklady.jpeg ← Home page hero photo (other SVGs in public/ are Next.js leftovers)
├── proxy.ts                    ← Runs before /admin requests; redirects if not logged in
├── next.config.ts              ← Next.js settings (caching, image hosts, redirects)
├── .env.example                ← Template for .env.local
├── .env.local                  ← Your real secrets (NOT committed)
├── package.json / pnpm-lock.yaml / pnpm-workspace.yaml
├── tsconfig.json               ← TypeScript settings; defines the "@/" import alias
├── eslint.config.mjs
├── AGENTS.md                   ← Note for AI tools about Next.js 16
└── README.md                   ← Default Next.js readme (not project-specific)
```

### 5.1 Next.js folder rules you need to know

| Rule | Example | Meaning |
|---|---|---|
| `page.tsx` makes a URL | `app/(store)/shop/page.tsx` | → `/shop` |
| `layout.tsx` wraps every page below it | `app/(store)/layout.tsx` | Header + footer on all shop pages |
| `error.tsx` catches crashes below it | `app/(store)/error.tsx` | Shows `ErrorScreen` instead of a blank page |
| `(name)` folder = group, **not** in the URL | `(store)`, `(dashboard)` | Used to give pages a shared layout |
| `[name]` folder = dynamic URL part | `products/[slug]` | `/products/anything` → `params.slug = "anything"` |
| `_name` folder = private | `_components` | Never becomes a route |
| `"use client"` at the top | `Header.tsx` | Runs in the browser; can use `useState`, clicks, `localStorage` |
| No directive | `Catalog.tsx` | **Server Component**: runs on the server, can read the database, sends HTML |
| `"use server"` at the top | `actions.ts` | **Server Actions**: functions the browser can call, but which run on the server |

---

## 6. The database

There is **one table**, `products`, and **one storage bucket**, `product-images`. Both are defined in [`supabase/schema.sql`](supabase/schema.sql).

### 6.1 The `products` table

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key, generated automatically |
| `name` | `text` | 1–120 characters |
| `slug` | `text`, unique | The URL part, e.g. `blush-pleated-skirt-3f9a1c`. Made from the name + 6 random characters when the product is **created**. It is **not** changed when the name is edited, so old links keep working. |
| `description` | `text` | Up to 2000 characters (checked in code) |
| `price` | `numeric(10,2)` | Selling price in GHS, ≥ 0 |
| `compare_at_price` | `numeric(10,2)` or null | "Original" price. If set and higher than `price`, the product shows a **Sale** badge and the old price crossed out. |
| `category` | `text` | One of `CATEGORIES` in `lib/products/shared.ts` |
| `sizes` | `text[]` | Subset of `SIZES` (`XS, S, M, L, XL, Free Size`). Can be empty (e.g. bags). |
| `colors` | `text[]` | Free text, up to 12 |
| `stock` | `integer` | ≥ 0. `0` = **Sold out**. ≤ 3 shows "Only N left". |
| `images` | `text[]` | Paths inside the storage bucket, like `products/<uuid>.jpg`. **The first one is the cover photo.** Up to 8. |
| `is_new_arrival` | `boolean` | Shows on `/new-arrivals` and gets a "New" badge |
| `is_published` | `boolean` | `false` = draft, hidden from shoppers. Needs at least one photo to be `true`. |
| `created_at` | `timestamptz` | Set automatically. "Newest" sort uses this. |
| `updated_at` | `timestamptz` | Updated automatically by a trigger on every edit |

**Indexes:** `(is_published, created_at desc)` for the shop listing, and `(category)`.

**Trigger:** `products_set_updated_at` sets `updated_at = now()` before every update.

### 6.2 Security: Row Level Security (RLS)

RLS is turned **on** for `products`. There is one policy: *anyone may `select` rows where `is_published = true`*. There are **no** insert/update/delete policies, so the public anon key **cannot change anything**.

All writes, and in practice all reads too, go through the server using the **service-role key**, which **bypasses RLS**. This means:

> 🔐 **The server code is responsible for hiding drafts.** Every storefront query in `lib/products/queries.ts` includes `.eq("is_published", true)`. If you add a new storefront query, **you must add that filter too**, or unpublished products will leak onto the site.

### 6.3 The `product-images` storage bucket

- **Public**: anyone can view a photo by its URL. URLs look like
  `https://<project>.supabase.co/storage/v1/object/public/product-images/products/<uuid>.jpg`
  (built by `productImageUrl()` in `lib/products/shared.ts`).
- Max **5 MB** per file. Allowed types: JPEG, PNG, WebP, AVIF.
- Nobody can upload without a **signed upload token**, and only a logged-in admin can get one (see 7.4).
- When a photo is removed from a product, or a product is deleted, the server deletes the file from storage too.

### 6.4 Changing the database

There is no migrations tool. To change the schema:

1. Edit `supabase/schema.sql` so it stays the single source of truth (keep statements idempotent: `if not exists`, `drop ... if exists`, etc.).
2. Run the change in the Supabase SQL Editor.
3. Update the `Product` type in `lib/products/shared.ts`.
4. Update `parseProduct()` in `app/admin/(dashboard)/products/actions.ts` and `ProductForm.tsx` if the admin should edit the new column.

---

## 7. The backend, file by file

"Backend" here means code that runs on the **server**: Server Components, Server Actions, `proxy.ts` and the `lib/` files marked `import "server-only"`.

### 7.1 Supabase clients: `lib/supabase/`

- **`server.ts` → `supabaseAdmin()`**: creates **one** Supabase client using the **service-role key** and reuses it. It starts with `import "server-only"`, so if anyone imports it from a `"use client"` file the build **fails**. That is deliberate: it stops the secret key reaching the browser. It also exports `isSupabaseConfigured()` and a friendly message, so the admin shows "Connect Supabase" instead of crashing when the env vars are missing.
- **`browser.ts` → `supabaseBrowser()`**: a client using the **public anon key**. It is used **only** in `ProductForm.tsx` to upload photos with a signed token.

### 7.2 Reading products: `lib/products/queries.ts`

**Every database read lives in this file.** Pages never call Supabase directly.

| Function | Used by | Cached? | Notes |
|---|---|---|---|
| `getNewArrivals(limit)` | `/new-arrivals` | Yes | Published + `is_new_arrival`, newest first |
| `getPublishedProducts(category?)` | `/shop` | Yes | All published, newest first |
| `getProductBySlug(slug)` | `/products/[slug]` | Yes | Returns `null` → page shows 404 |
| `getPublishedProductsByIds(ids)` | Cart & favourites refresh | Yes | |
| `adminListProducts()` | `/admin/products` | **No** | Includes drafts. Calls `requireAdmin()` first. |
| `adminGetProduct(id)` | Edit page | **No** | Calls `requireAdmin()`. A bad UUID returns `null` instead of an error. |

**How the cache works** (Next.js 16 "Cache Components", turned on by `cacheComponents: true` in `next.config.ts`):

```ts
export async function getPublishedProducts() {
  "use cache";              // cache this function's result
  cacheTag(PRODUCTS_TAG);   // label the cache entry "products"
  cacheLife("hours");       // keep it for hours
  ...
}
```

After any admin change, `actions.ts` calls `updateTag(PRODUCTS_TAG)`. That throws away every cache entry labelled "products", so the next shopper gets fresh data. **If you add a new storefront read, give it the same three lines**, or it will either hit the database on every request or never update.

### 7.3 Shared product helpers: `lib/products/shared.ts`

Safe to import from both server and client. It contains:

- `Product`: the TypeScript type matching the table.
- `CATEGORIES`, `SIZES`: the allowed values. **To add a category, edit this list.** The admin dropdown and the shop filters update automatically. Shop filters only show categories that have products.
- `MAX_IMAGES` (8), `MAX_IMAGE_BYTES` (5 MB), `ALLOWED_IMAGE_TYPES`.
- `CURRENCY = "GHS"` and `formatPrice()`, which displays prices like `GH₵120.00`.
- `productImageUrl(path)`: turns a storage path into a full public URL.

### 7.4 Admin product actions: `app/admin/(dashboard)/products/actions.ts`

These are **Server Actions**: the admin's browser calls them like normal functions, but they run on the server. **Every one starts with `await requireAdmin()`.**

| Action | What it does |
|---|---|
| `createImageUploads(files)` | Checks the type and size of each photo, then asks Supabase for a **signed upload URL** per photo at a random path `products/<uuid>.<ext>`. Returns `{ path, token }` pairs. |
| `saveProduct(prevState, formData)` | Used for both **create** and **edit** (edit when the form has a hidden `id`). Validates every field in `parseProduct()`, then inserts or updates. On edit, it deletes photos from storage that were removed. Clears the cache, then redirects to the product list. Returns `fieldErrors` so the form can highlight bad fields. |
| `deleteProduct(id)` | Deletes the row **and** its photos. Clears the cache. |
| `setPublished(id, published)` | Publish/unpublish toggle. Refuses to publish a product with no photos. |

**Why photos are uploaded straight from the browser:** Server Actions have a request size limit, and phone photos are big. So the flow is:

```
Admin picks photos
   → lib/images/prepare.ts shrinks them in the browser (max 2000px, JPEG, ≤5MB)
   → admin clicks Save
   → createImageUploads()  [server]  returns signed tokens
   → browser uploads each file directly to Supabase Storage (3 retries each)
   → saveProduct(formData + list of image paths)  [server]  saves the row
```

`saveProduct` only accepts image paths matching `products/<uuid>.(jpg|png|webp|avif)`, so someone can't attach arbitrary files.

### 7.5 Admin login: `lib/auth/` + `app/admin/auth-actions.ts` + `proxy.ts`

There are no user accounts, just one password.

1. **Login** (`auth-actions.ts → login`): compares the typed password with `ADMIN_PASSWORD` using a constant-time comparison, which prevents timing attacks. A wrong password waits 600 ms to slow down guessing. If it's correct, it sets a cookie.
2. **The cookie** (`lib/auth/session.ts`): named `admin_session`, scoped to `/admin`, `httpOnly` (JavaScript can't read it), lasts **7 days**. Its value is
   `<expiry timestamp>.<HMAC-SHA256 signature>`, signed with `SESSION_SECRET`. Nobody can fake or extend it without the secret.
3. **`proxy.ts`**: runs before every `/admin/*` request. No valid cookie → redirect to `/admin/login`. Already logged in and visiting `/admin/login` → redirect to `/admin/products`. This is just a **convenience redirect**.
4. **`lib/auth/dal.ts → requireAdmin()`**: **the real security check.** It's called at the top of every admin Server Action and admin query. Server Actions can be called directly, without going through a page, so **never rely on `proxy.ts` alone**.
5. **Logout**: deletes the cookie.

> 🔐 **Rule:** any new admin Server Action or admin data read **must** start with `await requireAdmin();`.

### 7.6 Cart/favourites price refresh: `app/(store)/cart/actions.ts`

`getLiveProducts(ids)` is a public Server Action. The cart and favourites pages call it **once per visit** with the product IDs saved in the browser. It cleans the input (only valid UUIDs, max 100, no duplicates), fetches **published** products, and returns fresh name, price, stock, photo, sizes and colours. The client then:

- updates prices and stock,
- caps quantities at the current stock,
- flags products that were deleted or unpublished as **"no longer available"**.

---

## 8. The frontend, file by file

### 8.1 Global

- **`app/layout.tsx`**: the outermost `<html>`. Loads the two Google fonts (Playfair Display for headings = `font-serif`, Jost for text = `font-sans`) and sets the default page title.
- **`app/globals.css`**: the **brand palette**. Change colours here and the whole site follows:

  | Tailwind class | Colour | Used for |
  |---|---|---|
  | `cream` | `#ffffff` | Page background |
  | `blush` | `#f8dde5` | Soft pink sections |
  | `rose` | `#e9a9bd` | Brand pink, badges |
  | `ink` | `#292329` | Text, dark buttons |
  | `muted` | `#6c5f67` | Secondary text |
  | `accent` | `#b4587a` | Small pink text (readable) |
  | `line` | `#f1e2e8` | Borders |
  | `whatsapp` | `#1e8e4e` | WhatsApp green |

  Use them like `bg-blush text-ink border-line`.
- **`app/components/Header.tsx`** (client): logo, nav links, a search box that submits to `/shop?q=...`, the favourites heart and the cart bag with **live counts** read from `localStorage`, and the mobile menu.
- **`app/components/ErrorScreen.tsx`** (client): shown by the `error.tsx` files. It detects network errors and shows "Connection hiccup" with a **Try again** button.

### 8.2 Storefront pages

- **`(store)/layout.tsx`**: puts `Header` on top and the footer (WhatsApp and Snapchat contact pills, footer links) below every shop page.
- **`(store)/page.tsx` (Home)**: the hero section with the `pinklady.jpeg` photo, the headline and stats, then `<OurStory />`. **The text and stats are hard-coded here.**
- **`shop/page.tsx` and `new-arrivals/page.tsx`**: both are thin wrappers around `<Catalog>`, which does all the work. They only differ by title and `source="all"` vs `source="new"`.
- **`_components/Catalog.tsx`** (server): fetches products (cached), then filters, sorts and searches **in memory** using the URL:
  - `?q=pink dress` → search (see `lib/products/search.ts`)
  - `?category=Dresses` → filter
  - `?sort=price-asc` / `price-desc` → sort (default newest)

  Because all state is in the URL, results are shareable links and the back button works. The grid is wrapped in `<Suspense>`, so the banner shows instantly while products load behind a skeleton.
- **`lib/products/search.ts`**: every word must appear in the name, category, colours, sizes or description. Matches in the name rank higher. Ignores accents and capital letters, and handles simple plurals ("bags" ↔ "bag"). It runs in memory, which is fine for a small catalogue. If the shop grows to thousands of products, move to Postgres full-text search.
- **`products/[slug]/page.tsx`**: product detail page with breadcrumbs, a photo gallery (swipe on phones, grid on desktop), price/sale/stock, `<BuyBox>` and the description. An unknown or unpublished slug returns a **404**.
- **`_components/ProductCard.tsx`**: the grid tile. Shows the cover photo, swaps to the second photo on hover, has Sale / Sold out / New badges and the price, plus `FavouriteButton` and `CardActions`.
- **`_components/BuyBox.tsx`** (client): size/colour buttons (optional: if a product has exactly one size or colour it's picked automatically), a quantity stepper, **Add to cart**, **Order on WhatsApp**, and Save to favourites. `validate()` currently always passes, on purpose, because sizes the shopper didn't pick are sorted out on WhatsApp.
- **`_components/CardActions.tsx`** (client): quick add-to-cart (qty 1) and a WhatsApp button under each card. Hidden when sold out.
- **`_components/OurStory.tsx`**: the "Our Story" section. **The text is placeholder copy**: edit the `STORY` object at the top and the layout adapts.

### 8.3 Cart and favourites (browser-only data)

- **`lib/local-store.ts`**: a small reusable store. `createLocalStore(key, validator)` returns `get`, `set` and a React hook `useItems()`. It:
  - saves to `localStorage` under the given key,
  - throws away corrupt entries (using the validator),
  - **syncs across tabs** (the `storage` event),
  - uses React's `useSyncExternalStore`, so every component using it re-renders together.
- **`lib/cart/store.ts`**: key `gh-cart-v1`. Each cart line's `key` is `productId|size|colour`, so the same dress in S and M is two lines. Quantities are always capped at stock. `useCartCount()` feeds the header badge.
- **`lib/favourites/store.ts`**: key `gh-favourites-v1`. One entry per product.
- **`cart/CartView.tsx`**: the cart page. It shows a skeleton until the browser has loaded (`localStorage` doesn't exist on the server), refreshes from the server once, and shows notices for sold-out, low-stock and unavailable items. Sold-out and unavailable lines are **excluded** from the total and the WhatsApp order. "Save" moves a line to favourites.
- **`favourites/FavouritesView.tsx`**: the same pattern for saved items.

> 💡 If you ever change the **shape** of `CartLine` or `SavedItem`, bump the storage key (e.g. `gh-cart-v2`). Otherwise old saved data in shoppers' browsers may not match the new shape.

### 8.4 WhatsApp ordering: `lib/whatsapp.ts`

`whatsappOrderUrl(items, origin)` builds a message like:

```
Hello Girl's Hood! I'd like to place an order:

1. *Blush Pleated Skirt*
   Size: M · Colour: Pink
   Qty: 2 × GH₵120.00 = GH₵240.00
   https://yoursite.com/products/blush-pleated-skirt-3f9a1c

*Total: GH₵240.00*

Please confirm availability, delivery and payment. Thank you!
```

It then opens `https://wa.me/<NEXT_PUBLIC_WHATSAPP_NUMBER>?text=<message>` in a new tab. The `*stars*` make text bold in WhatsApp.

`lib/contact.ts` holds the **Snapchat username** (`enaya455`) and formats the WhatsApp number for the footer. Edit it there.

### 8.5 Admin pages

- **`admin/layout.tsx`**: sets the "… · Admin · Girl's Hood" title format and `robots: noindex` so Google won't list admin pages.
- **`admin/login/`**: the password form. It uses `useActionState`, which calls the `login` action and shows its error.
- **`(dashboard)/layout.tsx` + `AdminNav.tsx`**: sidebar on desktop, top bar on phones.
- **`products/page.tsx`**: stats (total / live / new arrivals / low stock) and a list of every product, including drafts, with Live/Draft, New and stock badges. If Supabase isn't configured it shows setup steps instead.
- **`products/RowActions.tsx`**: Edit / Publish↔Unpublish / Delete (asks for confirmation). Shows errors inline.
- **`products/ProductForm.tsx`**: one form for both **new** and **edit**. Handles:
  - all fields, with errors shown under each field (from `saveProduct`),
  - picking or dragging photos, previews, reordering (← →; the first is the cover), removing,
  - shrinking photos (`lib/images/prepare.ts`, which also gives a clear message for iPhone HEIC photos the browser can't read),
  - the upload flow from section 7.4, with retries and "turn off your ad blocker" advice for network failures,
  - a Save button that stays disabled until JavaScript has loaded.
- **`products/[id]/edit/page.tsx`**: loads the product and renders `<ProductForm product={...} key={updated_at}>`. The `key` resets the form after a save.

---

## 9. Common tasks: where to make the change

| I want to… | Edit this |
|---|---|
| Add or rename a **category** | `CATEGORIES` in `lib/products/shared.ts` |
| Add a **size** | `SIZES` in `lib/products/shared.ts` |
| Change the **currency** | `CURRENCY` (and the locale `"en-GH"`) in `lib/products/shared.ts` |
| Change **brand colours / fonts** | `app/globals.css` / `app/layout.tsx` |
| Change the **WhatsApp number** | `NEXT_PUBLIC_WHATSAPP_NUMBER` in `.env.local` (and on the hosting provider), then restart |
| Change the **WhatsApp message text** | `lib/whatsapp.ts` |
| Change **Snapchat** | `lib/contact.ts` |
| Edit **home page** text/photo/stats | `app/(store)/page.tsx`, `public/assets/` |
| Edit **Our Story** | `STORY` object in `app/(store)/_components/OurStory.tsx` |
| Edit **footer** | `app/(store)/layout.tsx` |
| Edit **header links** | `navLinks` / `mobileLinks` in `app/components/Header.tsx` |
| Change the **"low stock"** threshold | `LOW_STOCK` in `cart/CartView.tsx` and `admin/.../products/page.tsx`, and the `<= 3` in `products/[slug]/page.tsx` |
| Change the **max photos** per product | `MAX_IMAGES` in `lib/products/shared.ts` |
| Add a **new database column** | See section 6.4 |
| Add a **new storefront page that reads products** | Add a cached function in `lib/products/queries.ts` (with `"use cache"`, `cacheTag`, `cacheLife`, **and** `is_published = true`) |
| Add a **new admin action** | Put it in a `"use server"` file, start with `await requireAdmin()`, end with `updateTag(PRODUCTS_TAG)` if it changes products |
| Change the admin password | `ADMIN_PASSWORD` in env, restart |
| Sign the admin out everywhere | Change `SESSION_SECRET`, restart |

---

## 10. Golden rules (read before you push code)

1. **Never import `lib/supabase/server.ts` or `lib/products/queries.ts` into a `"use client"` file.** `server-only` will break the build, and that's on purpose.
2. **Every admin Server Action and admin read starts with `await requireAdmin()`.** `proxy.ts` alone is not security.
3. **Every storefront query filters `is_published = true`.** The service-role key bypasses RLS.
4. **After changing products, call `updateTag(PRODUCTS_TAG)`**, or shoppers will see old data for hours.
5. **Validate on the server.** Browser checks (`required`, `maxLength`) are just for convenience. `parseProduct()` is the real check.
6. **Never commit `.env.local`** and never expose `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_PASSWORD` or `SESSION_SECRET`.
7. **Use `pnpm`**, and **run `pnpm build` before deploying**. It catches TypeScript errors that `pnpm dev` doesn't show.
8. **Check the Next.js 16 docs** in `node_modules/next/dist/docs/` before using an API you learned from an older tutorial.

---

## 11. Troubleshooting

| Problem | Likely cause / fix |
|---|---|
| Admin says **"Connect Supabase to start adding products"** | `NEXT_PUBLIC_SUPABASE_URL` or `SUPABASE_SERVICE_ROLE_KEY` missing in `.env.local`. Add them and **restart** `pnpm dev`. |
| Error **"SESSION_SECRET must be set…"** | Add a 32+ character `SESSION_SECRET`. |
| **"ADMIN_PASSWORD is not set"** on login | Add it to `.env.local`, restart. |
| Shop shows **"Connection hiccup"** | The server couldn't reach Supabase. Check the internet connection and that the Supabase project isn't paused (free projects pause when inactive). |
| **Photo upload fails** with a network error | Ad blocker / Brave Shields blocking `supabase.co`, or a weak connection. Turn the blocker off for the page and press Save again (already-uploaded photos aren't re-sent). |
| **iPhone photo** "couldn't be read" | HEIC format. Set the camera to "Most Compatible" (JPG) or export as JPG. |
| Product saved but **not visible on the shop** | Is it **Live** (published)? Does it have a photo? For New Arrivals, is "Show in New Arrivals" on? |
| **Images don't load** | Make sure the bucket exists (run `schema.sql`) and the image host is allowed in `next.config.ts` → `images.remotePatterns`. |
| Site works on PC but **buttons don't work on phone** in dev | Open it with the PC's local IP (allowed in `allowedDevOrigins`). If your network uses a different IP range, add it there. |
| WhatsApp asks to **pick a contact** | `NEXT_PUBLIC_WHATSAPP_NUMBER` is empty or wrong. Use digits only, with the country code. |

---

## 12. Deploying

The project is a standard Next.js app, so [Vercel](https://vercel.com) is the easiest host:

1. Push the code to GitHub. The Git repository is the `my-app/` folder itself (remote: `origin`). Run git commands from inside `my-app/`, not from the parent `fashionShop/` folder.
2. Import the repo into Vercel and set the **root directory** to `my-app`.
3. Add **all six** environment variables from section 3.2 in Vercel's project settings.
4. Deploy. In production the admin cookie is automatically `secure` (HTTPS only).

---

## 13. Known limitations and ideas for later

- **No order records.** Orders only exist in WhatsApp chats, and stock is **not** reduced automatically. The admin updates stock by hand after a sale.
- **No customer accounts.** Carts and favourites are per browser/device and are lost if the shopper clears their browser data.
- **One admin password**, shared by everyone who manages the shop. No audit log.
- **Search runs in memory.** Fine for hundreds of products. Move to Postgres full-text search for thousands.
- **No automated tests.** Test changes by hand in the browser (storefront **and** admin) and run `pnpm build`.
- **Placeholder content**: the Our Story text, the home page stats ("100+ Happy Customers") and the "Featured Look" label are hard-coded.
- `README.md` is still the default Next.js template. This guide is the real documentation.
