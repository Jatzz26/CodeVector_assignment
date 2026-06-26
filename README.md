# Product Browser

A MERN-stack app that lets you browse **200,000 products** with category filtering and stable, fast pagination.

## Architecture

```
backend/   Node.js + Express + MongoDB (Mongoose)
frontend/  React + Vite
```

## How Pagination Works

This app uses **cursor-based pagination** instead of `SKIP/LIMIT` (offset) pagination.

### Why not SKIP/LIMIT?

| | SKIP/LIMIT | Cursor-based |
|--|--|--|
| Speed at page 1000 | Slow (scans 20,000 rows) | Fast (O(log n) index seek) |
| Stable when data changes | ❌ No — new inserts shift rows | ✅ Yes |

### The Cursor

Each page response includes a `nextCursor` token — a base64-encoded `{ createdAt, _id }` from the last item on the page.

To get the next page, send that cursor back:

```
GET /api/products?cursor=eyJjcmVhdGVkQXQ...
```

The query translates to:
```
WHERE (createdAt < cursor.createdAt)
   OR (createdAt = cursor.createdAt AND _id < cursor._id)
ORDER BY createdAt DESC, _id DESC
LIMIT 20
```

This uses a compound MongoDB index `{ createdAt: -1, _id: -1 }` — **pure index range scan, no collection scan**.

### Why It's Stable

New products arrive with a **newer** `createdAt` timestamp, so they land _before_ your current cursor position. Products already paginated past are never affected. You never see a product twice or skip one.

---

## Local Setup

### Prerequisites
- Node.js ≥ 18
- MongoDB running locally **or** a MongoDB Atlas account

### 1. Backend
```bash
cd backend
cp .env.example .env      # then edit .env with your MONGO_URI
npm install
npm run seed              # insert 200,000 products
npm run dev               # http://localhost:5000
```

### 2. Frontend
```bash
cd frontend
npm install
npm run dev               # http://localhost:3000
```
No `.env` needed locally — Vite proxies `/api/*` to `localhost:5000`.

---

## Deployment

### Recommended free-tier stack
| Layer | Service |
|---|---|
| Database | [MongoDB Atlas](https://mongodb.com/atlas) (free M0) |
| Backend | [Render.com](https://render.com) (free Web Service) |
| Frontend | [Vercel](https://vercel.com) (free Hobby) |

---

### Step 1 — MongoDB Atlas
1. Create a free cluster at [mongodb.com/atlas](https://mongodb.com/atlas)
2. Add a database user and whitelist `0.0.0.0/0` (allow all IPs)
3. Copy the connection string — looks like:
   ```
   mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/?appName=Cluster0
   ```
4. Run the seed script locally pointing at Atlas:
   ```bash
   MONGO_URI="mongodb+srv://..." npm run seed
   ```

### Step 2 — Backend on Render
1. Push the repo to GitHub
2. New → **Web Service** → connect your repo
3. Set:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
4. Add environment variables:
   ```
   MONGO_URI      = <your Atlas URI>
   PORT           = 10000          (Render sets this automatically)
   FRONTEND_URL   = https://your-app.vercel.app   (set after step 3)
   ```
5. Deploy — note the URL: `https://product-browser-api.onrender.com`

### Step 3 — Frontend on Vercel
1. New Project → import your repo
2. Set **Root Directory** to `frontend`
3. Add environment variable:
   ```
   VITE_API_URL = https://product-browser-api.onrender.com
   ```
4. Deploy → your frontend is live

### Step 4 — Update CORS
Go back to your Render backend env vars and set:
```
FRONTEND_URL = https://your-app.vercel.app
```
Then redeploy the backend.

---

## API

### `GET /api/products`

| Param | Type | Description |
|-------|------|-------------|
| `category` | string | Filter by category name |
| `cursor` | string | Base64 pagination cursor from previous response |
| `limit` | number | Items per page (default 20, max 100) |

**Response:**
```json
{
  "products": [ { "_id": "...", "name": "...", "category": "...", "price": 49.99, "createdAt": "...", "updatedAt": "..." } ],
  "nextCursor": "eyJjcmVhdGVkQXQi...",
  "total": 200000
}
```

`nextCursor` is `null` on the last page.

### `GET /api/products/categories`

Returns all distinct category names.

---

## MongoDB Indexes

```js
{ createdAt: -1, _id: -1 }            // cursor pagination
{ category: 1, createdAt: -1, _id: -1 } // category-filtered pagination
```
