# Sew Lets Face It - Handmade Bags Demo Store

A responsive e-commerce **demo** for [Sew Lets Face It](https://www.sewletsfaceit.co.uk), handmade bags and accessories by Jackie Samuels in the UK.

- **Client:** React + Vite, Tailwind CSS v4, React Router, Axios, Lucide icons, Context API (`/client`)
- **Server:** Node.js + Express, MongoDB + Mongoose, JWT auth, bcrypt (`/server`)

> **Demo scope.** There is no checkout, payment, shipping or order processing. The bag page asks visitors to get in touch to buy a piece or request a custom creation. Product prices, stock levels and photos are illustrative placeholders (the photos are free Unsplash images). Replace them with real content from the admin panel before going live. The privacy policy and terms pages are drafts awaiting the owner's approval.

## Features

- Homepage with announcement bar, hero carousel, category grid, featured collection, brand story, custom creation enquiry (modal form), craftsmanship, an Instagram gallery (curated images that link to the profile, not a live feed), and newsletter sign-up
- Shop with search, category, price and availability filters, sorting and "load more"
- Product pages with image gallery, fabric and colour options, quantity, stock status, personalisation note, wishlist and related products
- Bag and wishlist saved in the browser (localStorage)
- Contact and custom-creation forms, plus newsletter sign-ups, saved to MongoDB
- Protected `/admin` area: dashboard, products, categories, enquiries, newsletter subscribers and site settings (brand details, social links, homepage images)

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
| `CLIENT_URL` | Allowed browser origin(s) for CORS, comma separated |
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

- Website: http://localhost:5173
- API: http://localhost:5000/api (health check at `/api/health`)
- Admin: http://localhost:5173/account, then sign in with the seeded admin details

## 6. Production build

```bash
npm run build         # outputs client/dist
npm start --prefix server
```

## Deployment

### API (Render, Railway or similar)

1. Create a Node web service from the `server` directory.
2. Build command `npm install`, start command `npm start`.
3. Set the environment variables: `NODE_ENV=production`, `MONGODB_URI` (Atlas), `JWT_SECRET`, `JWT_EXPIRES_IN`, and `CLIENT_URL` set to your deployed site URL (comma separate multiple origins).
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
| GET | `/api/admin/stats`, `/api/admin/products`, `/api/admin/products/:id`, `/api/admin/categories` | Admin |

Every admin route is checked on the server. The JWT is verified and the user's role is re-read from the database on each request. All inputs are validated with `express-validator`.

## Project structure

```
client/
  src/api           Axios instance and error helpers
  src/components    layout, home sections, forms, UI kit, admin UI
  src/context       Cart, Wishlist, Auth, Settings, Toast
  src/hooks         useApi, useDocumentTitle
  src/pages         public pages and pages/admin
server/
  src/config        env + database connection
  src/controllers   route handlers
  src/middleware    auth, validation, rate limits, errors
  src/models        Product, Category, User, ContactEnquiry, NewsletterSubscriber, Setting
  src/routes        REST routes
  src/seed          demo content, seed and admin seed scripts
  src/validators    express-validator rules
```

## Before going live

- Replace demo products, prices, stock and photos with real ones in **Admin → Products**.
- Add the real contact email and homepage images in **Admin → Settings**.
- Have the owner review and approve the Privacy Policy and Terms pages.
- Use a strong, unique `JWT_SECRET` and admin password in production.
