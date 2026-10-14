# Sew Lets Face It - Handmade Bags Store

A responsive e-commerce site for [Sew Lets Face It](https://www.sewletsfaceit.co.uk), handmade bags and accessories by Jackie Samuels in the UK.

- **Client:** React + Vite, Tailwind CSS v4, React Router, Axios, Lucide icons, Context API (`/client`)
- **Server:** Node.js + Express, MongoDB + Mongoose, JWT auth, bcrypt (`/server`)

> **Status.** Guest checkout with card payment through Stripe is built in (UK delivery only, flat-rate shipping with optional free delivery threshold). Sewing class places can be booked and paid for the same way. It runs in Stripe **test mode** until live keys are added. Product prices, stock levels and photos are illustrative placeholders (the photos are free Unsplash images). Replace them with real content from the admin panel before going live. The privacy policy and terms pages are drafts awaiting the owner's approval. Not included in this version: customer accounts, emails sent by the shop itself, international shipping, discount codes and in-app refunds (refunds are issued from the Stripe dashboard).

## Features

- Homepage with announcement bar, hero carousel, category grid, featured collection, brand story, custom creation enquiry (modal form), craftsmanship, an Instagram gallery (curated images that link to the profile, not a live feed), and newsletter sign-up
- Shop with search, category, price and availability filters, sorting and "load more"
- Product pages with image gallery, fabric and colour options, quantity, stock status, personalisation note, wishlist and related products
- Bag and wishlist saved in the browser (localStorage)
- Guest checkout: delivery details form, secure payment on Stripe Checkout, order confirmation page, and "Track your order" by order number + email
- Prices, stock and shipping are always recalculated on the server; stock is deducted once when Stripe confirms payment
- Sewing classes page (`/sewing-classes`): course details, a month-by-month date picker (Mondays and Wednesdays by default, places left shown per date), and "Buy now" to book and pay for places through Stripe
- Contact and custom-creation forms, plus newsletter sign-ups, saved to MongoDB
- Protected `/admin` area: dashboard (orders to fulfil, revenue, upcoming class places), orders (status, tracking number, notes, link to the Stripe payment), classes (prices, special offer, timetable, dates, attendees), products, categories, enquiries, newsletter subscribers and site settings (brand details, social links, homepage images, online ordering and delivery charges)

## Requirements

- Node.js 18 or newer (20+ recommended)
- MongoDB 6+, either running locally or a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster

## 1. Install

```bash
npm run install:all
```

This installs the root tooling (`concurrently`), then `/server` and `/client`.

## 2. MongoDB

**Local:** install [MongoDB Community Server](https://www.mongodb.com/try/download/community) and make sure the service is running. The default connection string is:

```
mongodb://127.0.0.1:27017/sewletsfaceit
```

**Atlas:** create a cluster and a database user, allow your IP under *Network Access*, then copy the connection string, e.g.

```
mongodb+srv://<user>:<password>@<cluster>.mongodb.net/sewletsfaceit?retryWrites=true&w=majority
```

## 3. Environment variables

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env   # optional in development
```

### `server/.env`

| Variable | Description |
| --- | --- |
| `PORT` | API port (default `5000`) |
| `NODE_ENV` | `development` or `production` |
| `MONGODB_URI` | Local or Atlas connection string |
| `JWT_SECRET` | Long random string. Generate with `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| `JWT_EXPIRES_IN` | Admin session length, e.g. `7d` |
| `CLIENT_URL` | Allowed browser origin(s) for CORS, comma separated. The first one is also used for Stripe's return links |
| `STRIPE_SECRET_KEY` | Stripe secret key (`sk_test_...` while testing, `sk_live_...` when live). Leave empty to turn checkout off |
| `STRIPE_WEBHOOK_SECRET` | Signing secret (`whsec_...`) of the webhook endpoint, see [Payments with Stripe](#payments-with-stripe) |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` / `ADMIN_NAME` | Used only by `npm run seed:admin` |

### `client/.env`

| Variable | Description |
| --- | --- |
| `VITE_API_URL` | Leave empty in development (Vite proxies `/api` to `localhost:5000`). In production, set it to the API origin, e.g. `https://your-api.onrender.com` |

Never commit `.env` files. They are already listed in `.gitignore`.

## 4. Seed data

```bash
npm run seed          # adds/updates 6 categories, 12 demo products and default site settings
npm run seed:reset    # deletes products, categories and settings first, then seeds
npm run seed:admin    # creates or updates the admin user from ADMIN_* in server/.env
```

The demo seed is idempotent, so you can run it more than once. `seed:admin` will refuse a weak password: it must be at least 10 characters with upper case, lower case and a number. Public visitors cannot register, and there is no API route that grants admin rights. The only way to create an admin is this script, run by someone with access to the server environment.

## 5. Run in development

```bash
npm run dev
```

On Windows you can double-click `start.bat` instead. It installs any missing packages, starts both servers and opens the website in your browser.

- Website: http://localhost:5173
- API: http://localhost:5000/api (health check at `/api/health`)
- Admin: http://localhost:5173/account, then sign in with the seeded admin details

## Payments with Stripe

Checkout appears automatically once `STRIPE_SECRET_KEY` is set and **Admin → Settings → Accept online orders** is on. Without a key, the bag shows a "contact us" message instead.

1. Create a free account at [stripe.com](https://dashboard.stripe.com/register) and stay in **test mode**.
2. Copy the secret key from [Developers → API keys](https://dashboard.stripe.com/test/apikeys) into `STRIPE_SECRET_KEY`.
3. Webhook (marks orders paid and deducts stock):
   - **Locally:** install the [Stripe CLI](https://docs.stripe.com/stripe-cli) and run
     ```bash
     stripe listen --forward-to localhost:5000/api/orders/webhook
     ```
     It prints a `whsec_...` secret: put it in `STRIPE_WEBHOOK_SECRET` and restart the server.
   - **Deployed:** in [Developers → Webhooks](https://dashboard.stripe.com/test/webhooks) add the endpoint `https://<your-api>/api/orders/webhook` with the events `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed` and `checkout.session.expired`, then copy its signing secret into `STRIPE_WEBHOOK_SECRET` on the host.
4. Test a purchase with card `4242 4242 4242 4242`, any future expiry date, any CVC and any postcode.
5. Optional: turn on **Settings → Customer emails → Successful payments** in Stripe so customers get a receipt by email.

How it works: the checkout page sends the bag and delivery address to `POST /api/orders/checkout`. The server re-prices everything from the database, checks stock, saves a `pending_payment` order and redirects to Stripe. When Stripe reports the payment (webhook, or the confirmation page asking Stripe directly if the webhook hasn't arrived yet), the order becomes `paid` and stock is deducted exactly once. Unpaid sessions expire after 30 minutes and the order is cancelled. If an item sells out between checkout and payment, the order is flagged with a stock issue in the admin.

Order statuses: `pending_payment` → `paid` → `processing` → `shipped` → `delivered`, or `cancelled` / `refunded`. Cancelling or refunding a paid order in the admin returns its stock. To refund money, use **View payment in Stripe** on the order and refund it there.

To go live, switch Stripe to live mode, replace both keys with the live ones (and add a live-mode webhook endpoint), then place a small real order to check.

## Sewing class bookings

Class bookings use the same Stripe keys and the same webhook endpoint as orders (each Checkout Session carries `metadata.type`, either `order` or `class_booking`), so no extra Stripe setup is needed.

- **Dates roll forward automatically.** The weekly timetable (default: Mondays 6:00 pm and Wednesdays 3:30 pm, UK time, 2 hours) is turned into dated classes for the next few weeks (default 8). New dates appear each week without any action. UK clock changes are handled.
- **Places.** Each date has a capacity (default 4). Choosing places and pressing **Buy now** holds them while the customer pays; the hold is released if they back out of Stripe, the session expires (30 minutes) or payment fails. The capacity check is atomic, so two people can never take the last place at the same time.
- **Price.** The regular price is £35. Turning on **Special offer** in **Admin → Classes** charges the offer price (£25) instead and shows the regular price struck through.
- **Admin → Classes:** change prices, the offer, places per class, how many weeks to show, the timetable, venue and photo; open a date to change its places, add a note for customers, cancel or reopen it, or add an extra one-off date. Each date lists its attendees with "Email all attendees", and each booking can be cancelled or marked refunded (which frees its places). Refund the money from the Stripe payment link.
- Cancelling a date does not cancel paid bookings automatically - contact the attendees and cancel or refund each booking.
- Set the **Contact phone** in **Admin → Settings** so it appears on the classes page.

Booking statuses: `pending_payment` → `paid`, or `cancelled` / `refunded`.

## 6. Production build

```bash
npm run build         # outputs client/dist
npm start --prefix server
```

## Deployment

### API (Render, Railway or similar)

1. Create a Node web service from the `server` directory.
2. Build command `npm install`, start command `npm start`.
3. Set the environment variables: `NODE_ENV=production`, `MONGODB_URI` (Atlas), `JWT_SECRET`, `JWT_EXPIRES_IN`, `CLIENT_URL` set to your deployed site URL (comma separate multiple origins, main site first), `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`.
4. Run `npm run seed` and `npm run seed:admin` once, either from the host's shell or locally with `MONGODB_URI` pointing at Atlas.

### Website (Vercel, Netlify or similar)

1. Use the `client` directory as the project root.
2. Build command `npm run build`, output directory `dist`.
3. Set `VITE_API_URL` to the API origin (without `/api`).
4. SPA routing is already configured: `client/vercel.json` for Vercel and `client/public/_redirects` for Netlify.

## API overview

| Method | Endpoint | Access |
| --- | --- | --- |
| POST | `/api/auth/login` | Public (rate limited) |
| GET | `/api/auth/me` | Signed in |
| GET | `/api/products` (`search`, `category`, `minPrice`, `maxPrice`, `inStock`, `sort`, `page`, `limit`) | Public |
| GET | `/api/products/featured` | Public |
| GET | `/api/products/:slug` | Public |
| POST / PUT / DELETE | `/api/products`, `/api/products/:id` | Admin |
| GET | `/api/categories` | Public |
| POST / PUT / DELETE | `/api/categories`, `/api/categories/:id` | Admin |
| POST | `/api/contact` | Public (rate limited) |
| GET / PATCH / DELETE | `/api/contact`, `/api/contact/:id` | Admin |
| POST | `/api/newsletter` | Public (rate limited) |
| GET / DELETE | `/api/newsletter`, `/api/newsletter/:id` | Admin |
| GET | `/api/settings` | Public |
| PUT | `/api/settings` | Admin |
| POST | `/api/orders/checkout` | Public (rate limited) |
| POST | `/api/orders/webhook` | Stripe only (signature verified) |
| GET | `/api/orders/confirmation/:sessionId` | Public (Stripe session id) |
| POST | `/api/orders/lookup` (`orderNumber`, `email`) | Public (rate limited) |
| GET | `/api/admin/stats`, `/api/admin/products`, `/api/admin/products/:id`, `/api/admin/categories` | Admin |
| GET / PATCH | `/api/admin/orders`, `/api/admin/orders/:id` | Admin |
| GET | `/api/classes` | Public |
| POST | `/api/classes/book` | Public (rate limited) |
| GET | `/api/classes/bookings/confirmation/:sessionId` | Public (Stripe session id) |
| POST | `/api/classes/bookings/release` (`sessionId`) | Public (rate limited) |
| GET / POST / PATCH | `/api/admin/classes/sessions`, `/api/admin/classes/sessions/:id` | Admin |
| GET | `/api/admin/classes/sessions/:id/bookings` | Admin |
| PATCH | `/api/admin/classes/bookings/:id` | Admin |

Every admin route is checked on the server. The JWT is verified and the user's role is re-read from the database on each request. All inputs are validated with `express-validator`.

## Project structure

```
client/
  src/api           Axios instance and error helpers
  src/components    layout, home sections, forms, UI kit, admin UI
  src/context       Cart, Wishlist, Auth, Settings, Toast
  src/hooks         useApi, useDocumentTitle, useSyncBag
  src/pages         public pages (incl. Checkout, OrderSuccess, OrderLookup, SewingClasses, ClassBooked) and pages/admin
server/
  src/config        env, database connection, Stripe client
  src/controllers   route handlers
  src/middleware    auth, validation, rate limits, errors
  src/models        Product, Category, User, Order, ClassSession, ClassBooking, ContactEnquiry, NewsletterSubscriber, Setting
  src/routes        REST routes
  src/services      order pricing, payment finalisation and restocking; class dates, place holds and bookings
  src/utils         UK time-zone helpers, reference numbers, errors
  src/seed          demo content, seed and admin seed scripts
  src/validators    express-validator rules
```

## Before going live

- Replace demo products, prices, stock and photos with real ones in **Admin → Products**.
- Add the real contact email, homepage images and delivery charges in **Admin → Settings**.
- Switch Stripe to live keys and a live webhook, and test one real order.
- Check the class timetable, prices, venue and photo in **Admin → Classes**, and add the contact phone in **Admin → Settings**.
- Agree the class cancellation and refund policy with the owner and add it to the Terms page.
- Have the owner review and approve the Privacy Policy and Terms pages.
- Use a strong, unique `JWT_SECRET` and admin password in production.
